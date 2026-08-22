# 007 · Edición Administrativa del Perfil de Usuario

**Estado:** propuesta

## Qué hace

Permite que un usuario administrativo autorizado abra, desde `/admin/users`, el detalle de un usuario y edite exclusivamente los datos personales básicos que existen hoy en `canchago.UserProfile`: `firstName` y `lastName`.

La pantalla administrativa separa claramente:

| Sección                  | Datos reales                                               | Comportamiento en esta feature                                                                                       |
| ------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Información personal     | `UserProfile.firstName`, `UserProfile.lastName`            | Editables con `users.update`                                                                                         |
| Identificación           | `UserProfile.identification`                               | No editable en v1; ver “Fuera de alcance”                                                                            |
| Cuenta e identidad       | `User.email`, `User.username`, `User.status`               | Email y estado visibles solo donde ya corresponda; nunca se envían en el formulario de perfil. Username no se expone |
| Acceso                   | `UserRole`, roles y permisos derivados                     | Sección separada, gobernada por la feature `005`; nunca forma parte del payload de perfil                            |
| Datos sensibles internos | `passwordHash`, `AuthAccount`, `UserSession`, tokens OAuth | No se exponen ni aceptan                                                                                             |

No existen en el modelo actual teléfono personal, fecha de nacimiento, avatar, género, biografía ni ubicación. Tampoco existe almacenamiento de archivos. La interfaz no muestra campos ficticios para esos datos.

La edición utiliza un contrato de perfil dedicado en el backend, separado del `PATCH /api/users/{userId}` actual, porque este último mezcla email, organización y roles. El contrato nuevo admite una lista blanca estricta de campos de perfil y un token de concurrencia:

```text
GET   /api/users/{userId}/profile
PATCH /api/users/{userId}/profile
```

La pantalla se integra en el shell administrativo de la feature `006`, conserva la estética actual tipo Facebook mediante Ionic y los tokens semánticos existentes, y funciona en una columna en móvil y con ancho controlado en escritorio. Incluye guardar, cancelar, estado de cambios pendientes, prevención de doble envío, feedback accesible y advertencia al abandonar cambios sin guardar cuando React Router/Ionic pueda interceptar la navegación de forma fiable.

## Por qué

El backend ya almacena nombres separados en `UserProfile` y expone una actualización general de usuario, mientras el frontend de la feature `005` ya prepara listado, detalle y formulario. Sin embargo, el formulario actual reutiliza creación para edición y permite enviar conjuntamente email, organización y roles. Esto amplía innecesariamente el riesgo de mass assignment, mezcla responsabilidades y hace que una edición de nombre pueda modificar acceso o identidad.

La nueva feature crea un límite explícito para editar perfil sin alterar autenticación, estado ni RBAC. También evita presentar como editables campos que existen físicamente pero todavía no cuentan con las salvaguardas necesarias, como `identification`.

## Contrato de API consumido

_Contrato nuevo propuesto tras verificar directamente `canchago`. Debe especificarse e implementarse primero en el backend, registrarse en OpenAPI y añadirse a `../../constitution/api-integration.md` antes de que Ionic lo consuma._

### Lectura de perfil administrativo

- `GET /api/users/{userId}/profile` — autenticación y permiso `users.read`.
- Respuesta `200`:

```ts
{
  data: {
    id: string;
    email: string; // informativo, no editable por este contrato
    firstName: string;
    lastName: string;
    active: boolean; // informativo; cambiar estado sigue siendo otra operación
    profileUpdatedAt: string; // ISO UTC, control de concurrencia
  }
}
```

- No devuelve `username`, `passwordHash`, cuentas OAuth, sesiones, tokens, roles, permisos ni `identification` en v1.
- Errores: `400 VALIDATION_ERROR` para UUID inválido, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `500 INTERNAL_ERROR`.

### Actualización parcial de perfil

- `PATCH /api/users/{userId}/profile` — autenticación y permiso `users.update`.
- Body estricto:

```ts
{
  firstName?: string;
  lastName?: string;
  expectedProfileUpdatedAt: string;
}
```

- Debe incluir al menos uno de `firstName` o `lastName`; `expectedProfileUpdatedAt` siempre es obligatorio.
- Responde `200` con el mismo DTO de lectura y el nuevo `profileUpdatedAt`.
- Responde `409 CONFLICT` si `expectedProfileUpdatedAt` ya no coincide, si el objetivo cambió durante la edición o si otra salvaguarda de concurrencia impide sobrescribir silenciosamente.
- Un payload que incluya `email`, `username`, `identification`, `status`, `active`, `roleIds`, roles, permisos, `isSystem`, `password`, `passwordHash`, tokens, sesiones, `userId` u otra clave desconocida se rechaza con `400 VALIDATION_ERROR`; no se ignora silenciosamente.

### Reglas de datos

- `firstName` y `lastName` son obligatorios en el resultado persistido, igual que en `UserProfile`; cada uno admite 1–100 caracteres después de eliminar espacios al inicio/final.
- Una entrada formada solo por espacios es inválida.
- Se conservan Unicode, acentos, mayúsculas/minúsculas y espacios internos escritos por el usuario; no se inventa una capitalización automática ni un regex de “solo letras”.
- El backend normaliza primero y valida después; el frontend replica esas reglas únicamente para feedback temprano.
- El endpoint actual `PATCH /api/users/{userId}` no se usa desde esta pantalla. Su endurecimiento o descomposición completa debe coordinarse con la feature `005` para evitar que el formulario antiguo siga mezclando perfil, email y roles.

### Autorización, jerarquía e IDOR

- `middleware/auth.ts` y `access('users.update')` protegen la escritura; ocultar botones o rutas en Ionic no autoriza nada.
- El `userId` se toma únicamente del path validado como UUID; el body no acepta IDs de usuario.
- El servicio vuelve a cargar el usuario objetivo y sus roles vigentes antes de escribir. Un objetivo inexistente produce `404`; un usuario desactivado puede consultarse, pero su edición queda rechazada con `409` en v1 para no reactivar ni alterar implícitamente una cuenta cerrada.
- Un actor que no posea el rol global real `Administrador` no puede editar un usuario objetivo que tenga algún rol `isSystem: true`. Esta protección se centraliza en servicios y reutiliza el modelo/guardias de la feature backend `015`; nunca se basa en ID, email o username hardcodeado.
- El administrador global puede editar perfiles dentro de las mismas reglas de campos; poseer todos los permisos no habilita email, identificación, estado o RBAC mediante este endpoint.
- La autoedición se permite si el actor posee `users.update` y no infringe la protección anterior. Tras editar al usuario de la sesión, Ionic invalida `SESSION_QUERY_KEY`; el backend ya reconstruye `SessionUser` desde base de datos en cada petición.
- El sistema actual no representa en `SessionUser` el alcance `UserRole.organizationId`/`venueId` ni relaciona directamente un `User` con una organización. Por ello esta feature no puede afirmar aislamiento administrativo por tenant: `users.update` conserva su semántica global actual. Agregar autorización por alcance requiere primero un contrato RBAC multi-tenant separado; no se simula en frontend.

## Requisitos trazables

| ID     | Requisito                                         | Diseño/contrato                                                        | Pruebas derivadas                             |
| ------ | ------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| EPU-01 | Abrir detalle y edición desde administración      | rutas `/admin/users/{userId}` y `/edit`, integración con `UsersModule` | componente + E2E de navegación/deep link      |
| EPU-02 | Editar solo nombres reales del perfil             | GET/PATCH `/profile`, DTO y schema estrictos                           | contrato, servicio, formulario y persistencia |
| EPU-03 | Prevenir mass assignment                          | Zod `.strict()` y mapeo explícito database                             | payloads protegidos/clave desconocida         |
| EPU-04 | Exigir autenticación y `users.update`             | middleware backend + `AdminRoute`/`PermissionGuard` como UX            | 401, 403 y manipulación directa               |
| EPU-05 | Impedir escalamiento sobre usuarios privilegiados | guard central sobre `Role.isSystem` y actor Administrador              | admin parcial vs. usuario de sistema          |
| EPU-06 | Evitar IDOR dentro de la autorización real        | path UUID, objetivo recargado, body sin userId                         | cambiar path/body, 404 y autorización         |
| EPU-07 | Evitar sobrescritura silenciosa                   | `profileUpdatedAt` + compare-and-update transaccional                  | dos editores, segundo recibe 409              |
| EPU-08 | Mantener identidad, estado y RBAC separados       | email informativo; roles/estado fuera del body                         | regresión login, roles y desactivación        |
| EPU-09 | UX responsive, accesible y segura                 | formulario específico, dirty state, feedback y tokens actuales         | móvil/escritorio, teclado y estados           |
| EPU-10 | Refrescar datos afectados sin recargar la app     | invalidación selectiva de users/session                                | cache de detalle/lista y autoedición          |
| EPU-11 | No exponer secretos ni datos inexistentes         | selects/DTO mínimos, sin archivos                                      | snapshots de respuesta y revisión UI          |
| EPU-12 | Conservar errores normalizados                    | taxonomía existente 400/401/403/404/409/500                            | mapper y estados controlados                  |

## Criterios de aceptación

### Acceso y navegación

- [ ] Desde el listado o detalle bajo `/admin/users`, un usuario con `users.update` ve una acción clara “Editar perfil”; un usuario con solo `users.read` puede consultar el detalle pero no ve la acción.
- [ ] Abrir directamente `/admin/users/{userId}/edit` sin sesión redirige al login; con sesión sin `users.update` muestra acceso denegado y el backend responde `403` si se fuerza el PATCH.
- [ ] Cambiar `userId` en la URL solo permite editar otro objetivo si la autorización backend real lo permite; IDs inválidos producen `400`, objetivos inexistentes `404` y el body no puede sustituir el ID del path.
- [ ] Un administrador parcial no puede editar un objetivo con rol `isSystem`; el Administrador global sí puede editar sus nombres sin obtener capacidades adicionales sobre email, estado o roles.
- [ ] La autoedición sigue las mismas reglas, sin excepciones por email/username/ID.

### Campos, validación y seguridad

- [ ] El formulario muestra como editables únicamente Nombre y Apellido; ambos corresponden a `UserProfile.firstName/lastName` reales y se reflejan correctamente en listado, detalle y sesión cuando aplica.
- [ ] Email y estado se muestran como contexto no editable; organización y roles permanecen en secciones/operaciones distintas.
- [ ] No aparecen teléfono, fecha de nacimiento, avatar, género, biografía, ubicación ni otros campos inexistentes.
- [ ] Valores vacíos o solo espacios se rechazan; cada nombre normalizado admite como máximo 100 caracteres y conserva Unicode/capitalización interna.
- [ ] El backend rechaza claves desconocidas y payloads con email, username, identificación, estado, roles, permisos, flags administrativos, contraseñas, hashes, tokens o IDs.
- [ ] Ninguna respuesta contiene `passwordHash`, AuthAccount, sesiones, tokens, secretos, MFA ni detalles internos.
- [ ] Cambiar email, username, contraseña o identificación no es posible mediante esta feature. Un futuro cambio de email deberá coordinar verificación con Keycloak y no marcar el nuevo correo como verificado automáticamente.

### Persistencia, concurrencia y estados

- [ ] Guardar un cambio válido ejecuta un único PATCH y actualiza `User`/`UserProfile` de forma atómica; nunca deja un nombre actualizado parcialmente.
- [ ] Un `expectedProfileUpdatedAt` obsoleto produce `409`, conserva los datos más recientes y ofrece recargar/revisar en vez de sobrescribirlos.
- [ ] Un usuario desactivado no puede modificarse mediante el endpoint de perfil y recibe un error controlado sin cambiar su estado.
- [ ] Tras éxito se actualizan/invalida únicamente el detalle y las colecciones de usuarios; si el objetivo es el usuario autenticado también se invalida `SESSION_QUERY_KEY`.
- [ ] Los estados `loading`, `error`, `success` y ausencia/404 se presentan sin pantalla en blanco. Los errores 401/403/409/500 y red/timeout usan la taxonomía existente sin stack traces.
- [ ] El botón Guardar está deshabilitado sin cambios válidos y durante la mutación; un doble clic no genera dos PATCH.
- [ ] Cancelar restaura/navega sin guardar; abandonar un formulario sucio muestra advertencia donde el router Ionic permita bloquear de forma estable, incluyendo el botón atrás nativo si se implementa el mecanismo transversal correspondiente.

### UX, compatibilidad y pruebas

- [ ] En móvil el formulario es de una columna, respeta safe areas y ofrece acciones táctiles claras; en escritorio usa el ancho del layout administrativo sin estirar controles de forma inusable.
- [ ] Labels, errores, foco y feedback son accesibles; el resultado no depende solo del color y respeta dark mode/reduced motion.
- [ ] Se reutilizan `AppInput`, `AppButton`, feedback común, `AdminLayout`, TanStack Query, React Hook Form y Zod; no se agrega una librería de formularios/UI.
- [ ] Login web/nativo, `/home`, listado/detalle, creación, desactivación y administración de roles continúan funcionando sin cambios contractuales accidentales.
- [ ] Las pruebas incluyen edición positiva, validaciones, mass assignment, 401/403/404/409, usuario de sistema, IDOR, autoedición, sesión expirada, cache e intento de doble envío.

### Contratos y tipos (obligatorio)

- [ ] `src/types/api/users.ts` incorpora `AdminUserProfileDto` y `UpdateAdminUserProfileRequest` reflejando exactamente el contrato backend, sin `any`.
- [ ] `../../constitution/api-integration.md` registra los dos endpoints, permisos, campos, errores, concurrencia y el hecho de que email/identificación/RBAC quedan fuera antes de consumirlos.
- [ ] `canchago/documentation/schemas/users.ts` registra componentes y paths; ambos endpoints son correctos y visibles en `GET /api/docs`.

## Fuera de alcance

- Editar `identification`: aunque la columna existe (`varchar(30)`, nullable), hoy no tiene unicidad, normalización, permiso específico ni auditoría durable. Requiere una feature backend separada que defina semántica, migración/índice si corresponde, permiso elevado y registro de cambios antes de exponerse.
- Cambiar email: es único en PostgreSQL, pero también proviene del proveedor OAuth y `findOrSyncByOAuth` lo vuelve a sincronizar. Requiere flujo coordinado con Keycloak, verificación del nuevo correo, tratamiento de sesiones y reautenticación reciente.
- Cambiar username: existe como campo único interno y se deriva del email al crear; no forma parte de DTOs públicos ni del contrato de sesión.
- Cambiar contraseña, reset administrativo, MFA o credenciales: Keycloak es el origen de identidad; `passwordHash` local no se usa y nunca se expone.
- Editar estado, activar/desactivar, roles o permisos dentro del formulario de perfil: permanecen en endpoints y permisos administrativos separados.
- Avatar/archivos: no existe columna, endpoint, storage ni validación de uploads; no se diseña una solución ficticia.
- Teléfono, nacimiento, género, biografía, ubicación u otros campos nuevos: no existen y no se justifica una migración sin requisito de producto separado.
- Auditoría administrativa durable: no existe `AuditLog`. Antes de habilitar cambios críticos se requiere otra feature; esta v1 solo admite nombres y puede registrar metadatos operativos sin valores completos mediante el logger existente.
- Autorización por organización/sede: el contrato de sesión actual pierde el alcance de `UserRole`; requiere endurecimiento RBAC previo.
- Implementar código, migraciones o modificar datos reales en esta entrega documental.
