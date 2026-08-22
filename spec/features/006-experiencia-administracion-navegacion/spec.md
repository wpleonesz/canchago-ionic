# 006 · Experiencia de Administración y Navegación por Capacidades

**Estado:** en curso

## Qué hace

Define para `canchago-ionic` una única experiencia administrativa reutilizable, accesible desde rutas bajo `/admin`, con navegación vertical construida a partir de la sesión y los permisos efectivos que ya devuelve `canchago`.

El área administrativa organiza las capacidades reales del sistema en esta jerarquía inicial:

| Grupo             | Opción         | Ruta objetivo                             | Visibilidad mínima                            | Estado real                                                                 |
| ----------------- | -------------- | ----------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| Administración    | Inicio         | `/admin`                                  | Al menos un permiso administrativo reconocido | Nueva vista de navegación; sin métricas remotas en este alcance             |
| Usuarios y acceso | Usuarios       | `/admin/users`                            | `users.read`                                  | Pantallas previstas en `canchago-ionic/spec/features/005-gestion-usuarios/` |
| Usuarios y acceso | Roles          | `/admin/roles`                            | `roles.read`                                  | Backend implementado; pantalla Ionic prevista, no implementada              |
| Usuarios y acceso | Permisos       | `/admin/permissions`                      | `permisos.read`                               | Catálogo global de solo lectura; no existe CRUD de permisos                 |
| Estructura        | Organizaciones | `/admin/organizations`                    | `organizaciones.read`                         | Backend implementado; pantalla Ionic futura                                 |
| Estructura        | Sedes          | Ruta hija de la organización seleccionada | `organizaciones.read`                         | Backend implementado; pantalla Ionic futura                                 |

Las rutas anteriores son el destino canónico de la experiencia nueva. Si al implementar una pantalla administrativa ya existe con otra URL, se conserva temporalmente la URL anterior mediante redirección compatible hacia la ruta canónica, sin mantener dos pantallas ni dos configuraciones de navegación.

El layout contiene un menú lateral vertical persistente en escritorio y un `IonMenu`/drawer accionado desde el toolbar en móvil. El contenido y el encabezado administrativo comparten el mismo shell; el encabezado muestra el título de la sección y el control del menú móvil, sin duplicar el perfil o el cierre de sesión si estos permanecen en el header global. La ruta activa y sus rutas hijas quedan identificadas al navegar o abrir un deep link.

La presentación conserva el lenguaje visual existente de `canchago-ionic`: tokens semánticos de `src/theme/variables.css`, superficies claras, azul de acción primaria, tarjetas y densidad equilibrada inspiradas de forma general en Facebook, sin copiar activos, marcas ni componentes propietarios. Se reutilizan Ionic, ionicons y los componentes propios instalados.

La configuración de navegación es central y declarativa. Cada entrada asocia identificador interno, label, icono existente, ruta, coincidencia de rutas hijas y uno o más permisos requeridos. La configuración no contiene roles hardcodeados, tokens, secretos ni datos sensibles. `PermissionGuard`, el guard administrativo de rutas y el menú evalúan la misma función reutilizable de capacidades sobre `SessionUser.permissions`; ocultar una opción solo mejora la experiencia y nunca sustituye a `middleware/access.ts` del backend.

## Por qué

El backend ya implementa autenticación, sesiones persistentes, usuarios, organizaciones/sedes, roles, catálogo de permisos y asignación de roles, pero `canchago-ionic` solo registra `/login` y `/home`. Las carpetas administrativas están vacías y los accesos actuales de `Home` son tarjetas informativas dispersas. Sin un shell común, cada módulo futuro tendría que duplicar navegación, responsive design y evaluación de permisos, con alto riesgo de inconsistencias entre el menú, los guards y la autorización real.

Esta feature establece primero esa arquitectura compartida e integra las pantallas existentes o aprobadas cuando estén disponibles; no convierte la navegación en un CRUD paralelo ni inventa contratos para rellenar el menú.

## Contrato de API consumido

Verificado contra el código real de `canchago` y contra `canchago-ionic/spec/constitution/api-integration.md`:

- `GET /api/auth/session` — autenticación requerida. Devuelve `{ data: { id, email, name, roles: [{ id, code, name }], permissions: [{ id, code }] } }`. Es la única fuente central para construir las capacidades del menú; se reutiliza la query `['auth', 'session']`, con `staleTime` actual de cinco minutos, y el espejo `sessionStore`. No se hace una petición por opción.
- `POST /api/auth/logout` — autenticación requerida. Revoca la sesión; el cliente ya limpia usuario, token seguro nativo y queries de negocio.
- `/api/users`, `/api/users/{userId}` y `/api/users/{userId}/roles...` — permisos reales `users.read`, `users.create`, `users.update`, `users.delete` y `users.manage`. La navegación solo enlaza las pantallas definidas por la feature Ionic `005`; no las implementa aquí.
- `/api/roles`, `/api/roles/{roleId}` y `/api/roles/{roleId}/permisos` — `roles.read` para consulta y `roles.manage` para escritura; requieren `organizationId` donde lo exige el contrato actual.
- `GET /api/permisos` — `permisos.read`. Catálogo global paginado de solo lectura. No existen `POST`, `PATCH` ni `DELETE` de permisos.
- `/api/organizaciones` y sus rutas de sedes — `organizaciones.read` para consulta y `organizaciones.manage` para escritura. Sus envelopes no estándar permanecen documentados en `canchago-ionic/spec/constitution/api-integration.md`.

No se requiere un endpoint nuevo para renderizar el layout. Los permisos ya llegan juntos con la sesión. Tampoco existe hoy un endpoint agregado para indicadores del dashboard, listado de sesiones/dispositivos, auditoría administrativa, configuración general ni catálogos adicionales.

## Requisitos trazables

| ID     | Requisito verificable                                                                                     | Diseño asociado                                          | Pruebas asociadas                                                                       |
| ------ | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| ADM-01 | Existe un único layout administrativo reutilizable con navegación vertical                                | `AdminLayout` + configuración central                    | Unitarias de configuración; componente y E2E del shell                                  |
| ADM-02 | Sin sesión válida no se renderiza ni se abre `/admin...`                                                  | `ProtectedRoute` antes del guard administrativo          | Integración 401 y E2E de deep link sin sesión                                           |
| ADM-03 | Cada opción visible exige permisos efectivos; fallo o carga pendiente concede cero capacidades            | función común de capacidades + estado seguro por defecto | Unitarias con sesión pending/error/partial/full                                         |
| ADM-04 | Manipular la URL no permite conservar una vista no autorizada                                             | guard de ruta por permisos + autoridad de `403` backend  | Integración/E2E de URL manual y respuesta 403                                           |
| ADM-05 | El super admin ve todas las secciones que permiten sus permisos reales, sin comprobar su nombre de rol    | evaluación exclusiva de `permissions[].code`             | Prueba con todos los permisos y nombre de rol arbitrario                                |
| ADM-06 | La jerarquía y rutas activas funcionan en rutas raíz e hijas                                              | matcher de rutas central, coincidencia por segmentos     | Unitarias de `/admin`, detalle y edición                                                |
| ADM-07 | Escritorio usa navegación lateral y móvil usa drawer sin bloquear el contenido                            | breakpoints/tokens existentes + componentes Ionic        | Componentes, viewport Cypress y prueba manual nativa                                    |
| ADM-08 | Navegación accesible por teclado, con foco, labels y estado activo no dependiente solo del color          | semántica de navegación/Ionic y tokens existentes        | Testing Library, axe si ya estuviera disponible; revisión manual sin añadir dependencia |
| ADM-09 | Logout, 401, revocación o cambio de permisos retiran acceso y limpian estado administrativo               | sesión/query central + interceptor actual + invalidación | Integración de logout/401 y refresco de permisos                                        |
| ADM-10 | Añadir un módulo futuro requiere una entrada central y su ruta, sin duplicar lógica de autorización       | modelo declarativo de navegación                         | Unitaria de filtrado/configuración                                                      |
| ADM-11 | No se exponen módulos, rutas ocultas, secretos ni identificadores sensibles                               | filtrado previo al render y configuración no sensible    | Revisión estática y pruebas negativas                                                   |
| ADM-12 | No hay regresiones en `/login`, `/home`, autenticación web/nativa ni pantallas administrativas existentes | composición con rutas actuales y redirects compatibles   | Suite actual + E2E de flujos existentes                                                 |

## Criterios de aceptación

### Navegación y estructura

- [ ] Existe un único layout administrativo reutilizable para todas las rutas `/admin...`, con menú lateral vertical y una única fuente central de configuración.
- [ ] El menú agrupa “Usuarios y acceso” (Usuarios, Roles y Permisos) y “Estructura” (Organizaciones y Sedes) sin duplicar módulos ni presentar opciones sin destino definido.
- [ ] Usuarios, Roles y Permisos apuntan a las rutas canónicas verificadas en esta SPEC; las pantallas aún no implementadas muestran únicamente un estado explícito y no ejecutan contratos ficticios, o se incorporan cuando su SPEC propia se implemente.
- [ ] La ruta activa se identifica visual y semánticamente; una ruta hija de detalle o edición mantiene activa su sección padre al abrirla mediante navegación o deep link.
- [ ] Los grupos con subopciones pueden expandirse y contraerse mediante controles accesibles; el grupo de la ruta activa se abre automáticamente.
- [ ] Agregar una opción futura requiere modificar una única configuración de navegación y registrar la ruta/pantalla correspondiente, sin replicar comprobaciones de permisos en varios componentes.

### Autenticación y autorización

- [ ] Un usuario no autenticado que abre cualquier `/admin...` no ve el layout ni contenido privilegiado y es dirigido una sola vez al flujo real de `/login`, sin loops.
- [ ] Mientras la sesión/permisos están en `idle` o `loading`, no aparece fugazmente ninguna opción administrativa; ante error se deniega el acceso por defecto.
- [ ] Un usuario autenticado solo ve los grupos y opciones para los que posee al menos el permiso de lectura exigido por el destino; los grupos vacíos no se renderizan.
- [ ] Un administrador parcial ve únicamente sus módulos autorizados y un intento de URL manual a otro módulo termina en un estado `403`/sin acceso sin revelar su contenido.
- [ ] Un super admin con el conjunto completo de permisos efectivos ve todas las secciones administrativas reales, aunque el nombre/código de su rol no sea `superadmin` ni `administrador`.
- [ ] No existe lógica de visibilidad administrativa basada en `role === 'superadmin'`; la autorización de navegación usa `SessionUser.permissions` y la asignación del super admin sigue el mecanismo definido por la feature backend `015-bootstrap-super-admin`.
- [ ] Cada petición de datos o mutación continúa protegida por `middleware/auth.ts` y `middleware/access.ts` en `canchago`; manipular DOM, estado o URL no convierte el ocultamiento de UI en autorización.
- [ ] Un `401` por sesión expirada/revocada limpia el usuario, el token nativo y los datos administrativos cacheados, y redirige a `/login` sin loops.
- [ ] Tras cerrar sesión no permanece visible el menú, una ruta administrativa ni información cacheada del usuario anterior.
- [ ] Si los permisos cambian y la sesión se revalida, el menú se recalcula desde el nuevo `SessionUser`; si se revoca el permiso de la ruta activa, se abandona esa vista y las llamadas posteriores siguen sujetas al backend.

### Responsive, accesibilidad y estilo

- [ ] En escritorio el menú es persistente; puede ser colapsable solo si conserva labels accesibles y su preferencia local no sensible mediante el wrapper existente de Capacitor Preferences.
- [ ] En móvil la navegación usa un drawer/panel Ionic accionable desde el encabezado y se cierra tras navegar; nunca mantiene un sidebar fijo que reduzca de forma inusable el contenido.
- [ ] El contenido respeta safe areas, dark mode, `--app-content-max-width`, tokens de color/espaciado/radio y la estética actual tipo Facebook sin copiar activos propietarios.
- [ ] Cada opción tiene nombre, icono de ionicons cuando corresponda, target táctil mínimo coherente con el proyecto, foco visible, nombre accesible y estado activo perceptible sin depender únicamente del color.
- [ ] Menú, submenús y drawer pueden operarse con teclado cuando la plataforma lo permite; abrir/cerrar conserva un orden de foco comprensible.
- [ ] No se agrega una librería de sidebar, dashboard, iconos, estado o routing; se reutilizan Ionic React, ionicons, React Router 5, TanStack Query y Zustand ya instalados.

### Estados, eficiencia y seguridad

- [ ] El layout cubre estados `loading`, `error`, `empty` (usuario autenticado sin capacidades administrativas) y `success`, con mensajes no sensibles y acciones seguras.
- [ ] La sesión y los permisos se cargan centralmente y se reutilizan; no se hace una petición por entrada ni se recargan permisos en cada cambio de ruta mientras la query siga vigente.
- [ ] La caché de sesión se invalida al cerrar sesión, cambiar de usuario y cuando una respuesta `401` indique sesión inválida; nunca se considera autoridad de seguridad.
- [ ] Labels, rutas e identificadores de entradas no autorizadas se filtran antes del render y no se incluyen como UI oculta; la configuración no almacena credenciales, tokens ni secretos.
- [ ] El dashboard administrativo inicial no descarga listados completos para calcular métricas. Sin endpoint agregado real, presenta orientación/contexto y accesos autorizados, no cifras inventadas.
- [ ] La implementación completa conserva verdes las pruebas actuales de login, sesión, logout, guards y Home, además de `yarn lint && yarn typecheck && yarn test && yarn build` en `canchago-ionic`.

### Contratos y tipos (obligatorio)

- [ ] La feature reutiliza `SessionUser`, `RoleSummary` y `PermissionSummary` de `canchago-ionic/src/types/api/auth.ts` sin `any` y sin duplicar el contrato.
- [ ] Si la implementación revela una diferencia respecto del contrato descrito, `canchago-ionic/spec/constitution/api-integration.md` se actualiza en el mismo cambio antes de consumirla.
- [ ] Como esta feature no crea endpoints backend, no agrega documentación OpenAPI. Si posteriormente requiere un contrato nuevo, este se especifica primero en una feature backend separada y se registra en `documentation/schemas/` antes de consumirlo.

## Fuera de alcance

- Implementar las pantallas CRUD de usuarios, roles, permisos, organizaciones o sedes; pertenecen a sus SPEC de dominio. Esta feature crea el shell, navegación, guards compartidos e integración de rutas.
- Crear, promover o identificar al super admin por nombre de rol desde la app. Su bootstrap permanece fuera de HTTP según `015-bootstrap-super-admin`.
- CRUD de permisos: el backend solo expone el catálogo global mediante `GET /api/permisos`.
- Perfil editable o cambio de credenciales del administrador: `Home` ya muestra identidad, pero no existe contrato backend de perfil propio ni contraseñas locales.
- Listado/revocación de otras sesiones o dispositivos: existe persistencia interna `UserSession`, pero no una API administrativa para consultarla.
- Auditoría/historial administrativo: la misión lo prevé como principio, pero no existe todavía módulo ni endpoint consultable.
- Configuración general, catálogos/datos maestros adicionales y motor de reservas: no existen contratos actuales que los sostengan.
- Dashboard estadístico: se difiere hasta que una feature backend defina un endpoint agregado eficiente y autorizado.
- Cambiar la autenticación web, la autenticación nativa, RBAC del backend o los contratos ya implementados.
