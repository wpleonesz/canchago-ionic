# 007 · Edición Administrativa del Perfil de Usuario — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar las constituciones de `canchago` y `canchago-ionic`._

## Enfoque

Implementar primero un subrecurso backend mínimo `/api/users/{userId}/profile`, con DTO propio, Zod estricto, autorización por permisos, guard de jerarquía y compare-and-update sobre `UserProfile.updatedAt`. Después integrar el contrato en Ionic mediante las capas existentes: tipos → endpoint API → hook TanStack Query → formulario específico → rutas de `UsersModule` dentro de `AdminLayout`.

La creación de usuarios conserva su formulario actual. La edición deja de reutilizar ese formulario amplio: perfil, roles, estado e identidad se presentan como secciones y operaciones separadas. No se modifica el schema Prisma para v1 porque `firstName`, `lastName` y `updatedAt` ya existen.

## Implementación

1. **Revalidación de contratos** — Antes de código, releer `canchago/prisma/schema.prisma`, usuarios/auth/super admin y el estado final de las features Ionic `005`/`006`. Resolver cualquier deriva en la SPEC, no mediante supuestos.
2. **`canchago/validations/users/index.ts`** — Extender el módulo real con `adminUserProfileParamsSchema` y `updateAdminUserProfileSchema.strict()`. Normalizar trim; nombres 1–100; exigir al menos un nombre y `expectedProfileUpdatedAt` ISO. Rechazar claves extra.
3. **`canchago/database/users/index.ts`** — Extender el módulo real con un select mínimo del perfil y un update condicional por `userId + updatedAt` dentro de transacción; retornar conteo/DTO sin exponer campos internos. No aceptar un objeto Prisma construido desde el body.
4. **`canchago/services/users/index.ts`** — Extender el servicio real para verificar objetivo, estado activo y jerarquía de roles. Reutilizar `services/users/role-guard.ts` o ampliarlo con `assertCanEditUserProfile(actingUser, targetUser)`: si el objetivo porta un rol `isSystem`, exigir que el actor posea el rol global `Administrador`, reutilizando el concepto ya aplicado en feature `015`. Mapear conflicto concurrente a `ConflictError`.
5. **Atomicidad/concurrencia** — Leer protección de objetivo y ejecutar compare-and-update en una transacción coherente. Si el perfil cambió después del snapshot, devolver 409. Actualizar ambos nombres en una sola sentencia; no tocar `User.email/status/username` ni relaciones.
6. **`canchago/pages/api/users/[userId]/profile.ts`** (nuevo) — `GET` con `auth` + `access('users.read')`; `PATCH` con `auth` + `access('users.update')`; validar params/body, pasar `req.user` al servicio y devolver envelopes estándar.
7. **Errores backend** — Reutilizar `ValidationError` 400, `AuthenticationError` 401, `AuthorizationError` 403, `NotFoundError` 404, `ConflictError` 409 y router 500. No propagar Prisma, roles objetivo ni conteos privilegiados.
8. **`canchago/documentation/schemas/users.ts`** — Registrar `AdminUserProfile`, `UpdateAdminUserProfileBody` y ambos paths con seguridad, permisos, ejemplos y respuestas 200/400/401/403/404/409/500. Mantener export actual desde `documentation/schemas/index.ts`.
9. **Tests backend unitarios** — Schemas: trim, Unicode, vacío, >100, body sin cambios, timestamp inválido y todas las claves protegidas. Servicio/database: éxito, usuario inexistente/inactivo, actor parcial contra rol system, Administrador global, autoedición y carrera de timestamp.
10. **Tests backend de integración** — GET/PATCH con sesión/permisos reales mockeados según infraestructura vigente; 401, 403, 404, 409, path cambiado, body con `userId`, mass assignment, atomicidad y respuesta sin secretos. Verificar que PATCH general/roles/desactivación no cambian.
11. **`canchago-ionic/spec/constitution/api-integration.md`** — Registrar el contrato implementado y sus límites antes de crear el cliente API.
12. **`canchago-ionic/src/types/api/users.ts`** — Agregar `AdminUserProfileDto` y `UpdateAdminUserProfileRequest`; no reutilizar `UpdateUserRequest`, que incluye campos fuera del perfil.
13. **`canchago-ionic/src/validation/user-profile.ts`** (nuevo) — Reglas UX equivalentes para nombres y timestamp gestionado fuera de controles. Inferir `AdminUserProfileFormValues`; no aceptar email/roles/estado.
14. **`canchago-ionic/src/services/api/endpoints/users.ts`** — `getAdminUserProfile(userId)` y `updateAdminUserProfile(userId, body)`; una petición de detalle y un PATCH, sin descargar listados/catálogos.
15. **`canchago-ionic/src/features/users/hooks/useUserProfile.ts`** (nuevo) — Query `['users', userId, 'profile']`; mutación que actualiza el detalle y luego invalida `['users']` de forma dirigida. Si `userId === sessionUser.id`, invalidar `SESSION_QUERY_KEY` después del éxito.
16. **`canchago-ionic/src/features/users/components/AdminUserProfileForm.tsx`** (nuevo) — React Hook Form + Zod, `AppInput`, Guardar/Cancelar, `isDirty/isValid/isSubmitting`, feedback accesible y valores reseteados al recibir un DTO más reciente. Email/estado se muestran fuera de inputs editables.
17. **`canchago-ionic/src/features/users/pages/UserProfileEditPage.tsx`** (nuevo) — Estados loading/404/error/success, navegación de retorno al detalle y confirmación de conflicto con opción de recargar. No renderizar formulario hasta tener permisos/datos.
18. **`canchago-ionic/src/features/users/pages/UsersModule.tsx`** — Integrar rutas exactas `/admin/users/{userId}` y `/admin/users/{userId}/edit`; envolver edición en `AdminRoute requiredPermissions={['users.update']}`. Actualizar enlaces antiguos `/users...` solo mediante redirects si aún existen.
19. **Detalle/listado Ionic** — Mostrar acción Editar perfil mediante `PermissionGuard('users.update')`; separar visualmente Perfil, Cuenta/estado y Roles. Tras éxito, nombres actualizados aparecen sin reload global.
20. **Cambios no guardados** — Evaluar una abstracción compatible con React Router 5, Ionic y `@capacitor/app` antes de interceptar. Si puede cubrir navegación web, menú, toolbar y back nativo sin loops, implementarla como hook transversal probado; si no, limitar v1 a confirmación explícita en Cancelar y documentar el riesgo residual, sin monkey patches de history.
21. **Estilos** — Reutilizar `admin-layout.css`, tokens y componentes existentes. Formulario en una columna móvil, acciones visibles, ancho legible en escritorio, dark mode, safe areas, foco y reduced motion.
22. **Pruebas frontend** — Vitest/Testing Library para validación, permisos, estados, dirty form, doble envío, guardar/cancelar, 409, error remoto y cache/session invalidation. Cypress existente para listado → detalle → editar → guardar, deep link, sin permiso, sesión expirada y viewports.
23. **Regresión/cierre** — Backend: `yarn lint && yarn typecheck && yarn test && yarn build`; Ionic: los mismos cuatro comandos, y `yarn cap:sync` solo si se toca código/config nativa. Validar Swagger y dispositivo/emulador según constitución; actualizar roadmaps al completar.

## Matriz requisito → diseño → tareas

| Requisito      | Diseño                                             | Tareas           |
| -------------- | -------------------------------------------------- | ---------------- |
| EPU-01         | rutas de `UsersModule`, acción desde detalle/lista | 17–19, 22        |
| EPU-02, EPU-03 | contrato `/profile`, Zod strict y DTO mínimo       | 2–8, 12–16       |
| EPU-04, EPU-06 | auth/access, params y target recargado             | 4, 6, 9–10, 18   |
| EPU-05         | guard de usuario con rol system                    | 4–5, 9–10        |
| EPU-07         | `profileUpdatedAt` compare-and-update              | 3–6, 9–10, 15–17 |
| EPU-08, EPU-11 | secciones separadas/select mínimo                  | 3, 6, 12–19      |
| EPU-09         | formulario, feedback, responsive y dirty state     | 16–17, 20–22     |
| EPU-10         | query keys e invalidación de sesión                | 15, 19, 22       |
| EPU-12         | errores existentes y estados UI                    | 7–10, 14–17, 22  |

## Decisiones

- **Subrecurso `/profile` en vez de ampliar el PATCH general** — Reduce mass assignment y permite que perfil evolucione sin mezclar email, roles u organización. Se descarta reutilizar `UpdateUserRequest`, cuyo shape actual es demasiado amplio.
- **Solo `firstName`/`lastName` en v1** — Son los únicos campos personales existentes con reglas suficientes. `identification` queda bloqueado por falta de unicidad, permiso específico y auditoría; campos inexistentes no justifican migración.
- **Email solo informativo** — OAuth/Keycloak sigue siendo origen de identidad y el login resincroniza email. Se descarta editarlo como texto ordinario.
- **Concurrencia sobre `UserProfile.updatedAt`** — Es el timestamp del recurso realmente editado. Se descarta confiar solo en `User.updatedAt` o last-write-wins.
- **Protección de roles system mediante modelo real** — El catálogo no tiene un permiso “editar super admin”. Se reutiliza centralmente `Role.isSystem` y el rol Administrador global de la feature `015`, sin IDs/usernames hardcodeados ni lógica dispersa en rutas.
- **`users.update` conserva alcance global actual** — No hay información suficiente para autorización por tenant. Se documenta el gap en vez de inferir organización desde UI o query params manipulables.
- **Sin auditoría compleja en v1** — Los nombres no se registran con valores completos; cambios críticos permanecen deshabilitados. Una futura auditoría será una feature propia.
- **Sin dependencia UI nueva** — Ionic, React Hook Form, Zod, TanStack Query y componentes existentes cubren todo el flujo.

## Riesgos

- **Endpoint general existente sigue siendo amplio** — `PATCH /api/users/{userId}` acepta email, organización y roles. Mitigación: la UI deja de usarlo para perfil y la implementación debe evaluar deprecación/endurecimiento coordinado con feature `005`; pruebas demuestran que `/profile` no acepta esos campos.
- **Autorización multi-tenant incompleta** — `SessionUser` no contiene alcance y `User` no pertenece directamente a una organización. Mitigación: no prometer aislamiento inexistente; bloquear una futura edición por tenant hasta endurecer RBAC.
- **Jerarquía basada en rol Administrador** — Es el mecanismo real del super admin, pero roles system distintos también quedan protegidos. Mitigación: guard central y pruebas con `isSystem`; no replicar checks por nombre en frontend.
- **Concurrencia entre verificación y escritura** — Si el guard y el update no comparten transacción, el objetivo podría cambiar de rol/estado. Mitigación: cargar protección y compare-and-update en una transacción; documentar aislamiento residual si Prisma/Postgres no permiten bloquear todo el agregado.
- **Perfil legacy ausente** — Los flujos actuales crean `UserProfile`, pero datos heredados podrían faltar. Mitigación: GET devuelve 404/estado controlado y no inventa nombres; decidir reparación de datos por script separado antes de habilitar upsert automático.
- **Dirty-state con Ionic Router** — Bloqueos de navegación de React Router 5 pueden no cubrir gesto/back nativo. Mitigación: probar todas las salidas; no declarar cobertura nativa sin evidencia.
- **Trabajo concurrente de feature `005`** — Sus archivos están en desarrollo y actualmente presentan errores de tipo. Mitigación: implementar `007` sobre su estado final aprobado, resolver solapamientos deliberadamente y preservar cambios ajenos.
- **Deuda de build backend** — El backend mantiene errores OpenAPI/typecheck no relacionados. Mitigación: no confundirlos con esta feature, pero resolverlos antes del cierre porque la constitución exige build verde.
