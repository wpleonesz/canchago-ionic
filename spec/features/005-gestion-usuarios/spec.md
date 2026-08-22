# 005 · Gestión de Usuarios

**Estado:** en curso (implementación completa vía `git`/tests; pendiente prueba manual en emulador/dispositivo real y verificación manual del contrato contra un `canchago` local corriendo, antes de marcar "Hecho")

## Qué hace

Añade al panel de cuenta (`Home`, feature `004`) una sección de **gestión de usuarios** visible solo para quien tenga los permisos correspondientes, y un flujo de **creación de usuarios (registro back-office)**:

1. **Listado administrativo** — tabla/lista paginada de usuarios (`GET /api/users`), con búsqueda por nombre/email (con debounce) y filtro por estado activo, consumiendo exactamente el contrato real del backend (feature `003-gestion-usuarios` de `canchago`, ya implementada en código aunque su propio spec siga marcado "propuesta" — ver "Contrato de API consumido").
2. **Creación de un usuario** — formulario (email, nombre, apellido, organización, roles opcionales) que llama `POST /api/users`. Esto **no es un registro público de autoservicio**: sigue siendo una operación de back-office hecha por un administrador autenticado, igual que ya lo define `canchago/spec/features/003-gestion-usuarios/spec.md`. El proveedor OAuth (Keycloak) sigue siendo el único mecanismo de autenticación real; este formulario crea el registro `User`/`UserProfile` en la base de `canchago`, no una cuenta con contraseña local.
3. **Detalle y edición de un usuario** — ver datos, roles asignados (`GET /api/users/:userId`) y editar campos o roles (`PATCH /api/users/:userId`).
4. **Asignación/remoción de roles de organización** — seleccionar roles desde un catálogo obtenido en vivo del backend (`GET /api/roles?organizationId=<uuid>`), nunca hardcodeado, y solo los que el propio backend permite ver/asignar hoy (ver limitación de roles globales más abajo).
5. **Desactivación de un usuario** (`DELETE /api/users/:userId`, soft delete real vía `status: 'INACTIVE'`).

Todo esto respeta el estilo visual "tipo Facebook" ya introducido en la feature `004` (superficies limpias, tarjetas, azul como color de acción primaria, tokens semánticos de `src/theme/variables.css`) y reutiliza los componentes ya existentes (`AppButton`, `AppInput`, `AppPage`, `RoleGuard`, `PermissionGuard`) antes de crear nuevos.

## Por qué

El backend ya expone un CRUD completo de usuarios y de asignación de roles de organización (`canchago` features `003` y `006`, implementadas en código), pero **`canchago-ionic` no tiene ninguna pantalla que lo consuma** (`src/features/users/` y `src/features/roles/` son carpetas vacías hoy). Sin esta feature, los administradores no tienen forma de incorporar personal ni gestionar accesos desde la app — deben hacerlo por fuera (Prisma Studio, scripts). El roadmap de este repo ya anticipaba esta necesidad como backlog ("005 · Gestión de usuarios (móvil)"), bloqueada originalmente por un supuesto bug de códigos de permiso que, verificado directamente en el código de `canchago` durante el discovery de esta spec (2026-08-21), **ya no reproduce** (ver "Contrato de API consumido" para el detalle y la corrección de ese registro).

## Contrato de API consumido

_Verificado leyendo `canchago` directamente (código real, no solo sus specs — los specs `003`/`005`/`006` de `canchago` siguen marcados "propuesta" pero el código ya está implementado; se documenta lo que el código hace hoy)._

### Usuarios

- `GET /api/users` — permiso `users.read`. Query: `page`, `pageSize` (1-100), `organizationId?` (uuid), `active?` (boolean, **ver quiebre documentado abajo**), `search?` (≤255, coincide contra `email`, `profile.firstName`, `profile.lastName`, insensible a mayúsculas), `orderBy?` (`name|email|createdAt` — **`name` está permitido por el schema pero no existe como columna**, ver quiebre abajo), `order?` (`asc|desc`). Responde `200 { data: UserDto[], meta: {page,pageSize,total,totalPages} }`.
- `POST /api/users` — permiso `users.create`. Body: `{ email, firstName, lastName, organizationId, roleIds? }` — **`organizationId` es obligatorio en el schema Zod del backend aunque el servicio no lo usa para ninguna relación real** (se valida y se descarta; no crea ninguna vinculación usuario-organización). Responde `201 { data: UserDto }`. `409` si el email ya existe (o, por un detalle de implementación, si el `username` derivado automáticamente — `email.split('@')[0]` — colisiona con el de otro usuario; el mensaje de error es el mismo genérico de email duplicado en ambos casos).
- `GET /api/users/:userId` — permiso `users.read`. Responde `200 { data: UserDto }` o `404`.
- `PATCH /api/users/:userId` — permiso `users.update`. Body: mismo shape que `POST`, todos los campos opcionales (incluido `organizationId`, igualmente descartado). Si incluye `roleIds`, **reemplaza todos los roles previos del usuario** (no es un merge). Responde `200 { data: UserDto }`.
- `DELETE /api/users/:userId` — permiso `users.delete`. Soft delete real: `status → 'INACTIVE'`. Responde `204`.

`UserDto` real (verificado en `services/users/index.ts`, no coincide literalmente con lo escrito en `canchago/spec/features/003-gestion-usuarios/spec.md`):
```ts
{
  id: string; email: string; firstName: string; lastName: string;
  active: boolean; // derivado de status === 'ACTIVE', no un campo de columna directo
  roles: { id: string; organizationId: string | null; code: string; name: string;
           description: string | null; isSystem: boolean;
           createdAt: string; updatedAt: string; deletedAt: string | null }[];
  createdAt: string; updatedAt?: string; // updatedAt ausente en la respuesta de POST
}
```
Nunca incluye `passwordHash`, `oauthSubject` ni ningún campo interno — confirmado leyendo el `select` de Prisma (`selectUserFields`) usado en todas las consultas.

### Roles de organización

- `GET /api/roles?organizationId=<uuid>` — permiso `roles.read`. `organizationId` es **obligatorio** (`400 VALIDATION_ERROR` si falta) y la consulta hace **coincidencia estricta** contra ese valor. Responde `200 { data: RoleDto[], meta }`.
- `POST /api/users/:userId/roles` — permiso `users.manage`. Body `{ roleIds: uuid[] }` (mínimo 1). Responde `201 { data: RoleSummary[] }` con los roles resultantes del usuario.
- `DELETE /api/users/:userId/roles/:roleId` — permiso `users.manage`. Responde `204`.
- `GET /api/users/:userId/roles` — permiso `users.read`. Responde `200 { data: RoleSummary[], meta: { total } }`.

### Organizaciones (dependencia mínima, ya existente)

- `GET /api/organizaciones` — permiso `organizaciones.read`. **Envelope no estándar**: responde `{ organizations: [...], meta }`, no `{ data, meta }` (documentado también en `api-integration.md` §7). Es la única forma real de resolver qué `organizationId` usar al crear un usuario o al listar roles — no existe endpoint "mis organizaciones" filtrado por el admin actual.

### Quiebres reales encontrados y su tratamiento en esta feature

- **`active=false` no filtra a "solo inactivos".** El backend hace `status: filters.active ? 'ACTIVE' : undefined` — pasar `active=false` tiene el mismo efecto que omitir el filtro (muestra todos los estados). **Esta feature no debe ofrecer un filtro "solo inactivos"** apoyado en este parámetro; el filtro de UI se limita a "Activos" (envía `active=true`) / "Todos" (omite el parámetro). Se registra como gap en `api-integration.md`.
- **`orderBy=name` no es un ordenamiento válido en el modelo real** (`User` no tiene columna `name`; el nombre vive partido en `UserProfile.firstName`/`lastName`) — usarlo dispararía un error de Prisma sobre un campo inexistente, devuelto como `500 INTERNAL_ERROR` genérico. **Esta feature solo ofrece ordenamiento por `email` o `createdAt`** desde la UI, nunca `name`. Se registra como gap en `api-integration.md`.
- **`GET /api/roles` nunca devuelve roles globales** (`organizationId: null`, como `Administrador` o `Futbolista`) — la consulta exige coincidencia exacta de `organizationId`. **Esta feature no puede ofrecer "Administrador" ni "Futbolista" como roles asignables desde el selector de roles**, porque el backend no expone ninguna vía HTTP para listarlos ni asignarlos hoy. Esto es intencional y coherente con el propio backend (`prisma/asignar-rol.ts` documenta que la asignación de roles globales/con alcance especial se hace por script, no por API) y con la feature de backend `canchago/spec/features/015-bootstrap-super-admin/`, que mantiene el aprovisionamiento del super admin fuera de cualquier superficie HTTP. **El super admin nunca se crea ni se promueve desde esta app.**
- **Escalamiento de privilegios vía payload manipulado**: hoy (2026-08-21, antes de que `canchago` implemente la feature `015-bootstrap-super-admin`) el backend **no** rechaza que un usuario con `users.manage` asigne un rol marcado `isSystem: true` a través de `POST /api/users/:userId/roles`. Como se documentó arriba, esto no aplica en la práctica a `Administrador`/`Futbolista` porque no aparecen en el catálogo que expone `GET /api/roles` (así que la UI nunca los ofrece como opción) — pero la protección real contra un payload manipulado directamente (sin pasar por la UI) depende de que `canchago` implemente `015`. Mientras esa feature de backend no esté implementada, esta app **debe ocultar la asignación de roles como una capa de UX, dejando explícito en el roadmap que la autorización real todavía no está garantizada del lado del servidor para ese escenario específico**.

## Criterios de aceptación

_Condiciones verificables, redactadas para comprobarse con un sí/no. Marca `[x]` al cumplirse._

**Catálogo de roles**
- [x] El selector de roles del formulario de creación/edición de usuario obtiene sus opciones exclusivamente de `GET /api/roles?organizationId=<uuid>` — ningún rol aparece hardcodeado en el código fuente de Ionic (`UserRolesEditor` vía `useRoles`).
- [x] Solo se listan roles de la organización seleccionada (`deletedAt: null`, según ya filtra el backend); un rol eliminado (soft delete) en el backend deja de aparecer sin necesidad de cambios en el frontend (el frontend no filtra nada localmente, refleja tal cual la respuesta del backend).
- [x] La UI no ofrece ni permite escribir manualmente un `roleId` fuera de las opciones devueltas por el backend (`AppSelect` solo renderiza `IonSelectOption` a partir del catálogo recibido).

**Registro (creación back-office) de usuarios**
- [x] Un envío válido del formulario de creación produce exactamente un `POST /api/users` y, si el backend responde `201`, exactamente un usuario nuevo visible en el listado tras invalidar la query de TanStack Query (`useCreateUser` invalida `['users']`).
- [x] El formulario exige `email` (formato válido), `firstName` y `lastName` (no vacíos, ≤100 caracteres), y una organización seleccionada — mismas restricciones que el schema Zod real del backend, replicadas en `validation/users.ts` solo para UX (el backend sigue siendo quien valida en última instancia).
- [x] Un email duplicado produce un `409` mapeado a `BusinessRuleError` y se muestra como error de formulario contextual ("ya existe un usuario con ese correo"), sin reintento automático (`UserFormPage`'s `CreateUserForm`).
- [x] El doble envío del formulario está prevenido (botón deshabilitado/`isLoading` de `AppButton` mientras la mutación está en curso) — verificado con test.
- [x] Ningún campo de contraseña existe en el formulario — la identidad real se resuelve vía Keycloak en el primer login del usuario creado, no vía esta pantalla.

**Administración de usuarios**
- [x] El listado usa paginación remota real (`page`/`pageSize` contra el backend), nunca carga todos los usuarios al cliente para paginar localmente.
- [x] La búsqueda por nombre/email aplica debounce (mínimo ~300ms) antes de disparar la query, para no saturar el backend con cada tecla (`AppSearchInput` + `useDebounce`, verificado con test).
- [x] El filtro "Activos"/"Todos" usa exclusivamente los valores de `active` que el backend interpreta de forma correcta (`true` u omitido) — no ofrece una opción "solo inactivos" (`UserListQuery.active` es `true | undefined` a nivel de tipo, no `boolean`).
- [x] El ordenamiento ofrecido en la UI se limita a `email`/`createdAt` — nunca `name` (excluido estructuralmente del tipo `UserListQuery.orderBy`).
- [ ] Un usuario sin el permiso `users.read` no ve la sección de gestión de usuarios en absoluto, y si accede a la ruta directamente por URL, el propio `GET /api/users` responde `403` y la pantalla muestra el estado de error correspondiente, nunca datos. **Parcialmente verificado:** `/admin/users*` está protegido por `AdminRoute` (feature `006`), que ya redirige a una página de acceso denegado sin llamar al backend si falta `users.read` — más estricto que lo pedido aquí. El caso "el propio `GET /api/users` responde 403" no se ejercitó end-to-end contra un backend real en esta sesión (sí se verificó el 403 del backend directamente en `canchago` en la tarea anterior).
- [x] Un usuario sin `users.create`/`users.update`/`users.delete`/`users.manage` no ve los botones de crear/editar/eliminar/gestionar roles respectivamente (oculto vía `PermissionGuard` en `UsersListPage`, `UserDetailPage`); si la acción se intenta igual, el backend responde `403` (comportamiento del backend ya verificado en `canchago/spec/features/015-bootstrap-super-admin/`), y `errorMapper.ts` lo traduce a `AuthorizationError` sin tratarlo como éxito.

**Casos límite y errores**
- [ ] Rol inexistente o ya eliminado enviado en `roleIds`: el backend responde `422`/error de validación; la UI lo muestra como error de formulario. **No verificado end-to-end en esta sesión** — el manejo de errores genérico (`errorMapper.ts` + mensajes de `UserForm`/`UserDetailPage`) cubre el caso mecánicamente, pero no se probó contra un 422 real.
- [x] Sesión expirada durante cualquier operación de esta feature: el interceptor 401 global (`services/api/apiClient.ts`) limpia la sesión y redirige a `/login` — esta feature no implementa su propio manejo de 401 (no se tocó `apiClient.ts`).
- [x] Token inválido / usuario desactivado que intenta operar: mismo tratamiento que sesión expirada (401 → logout forzado, mecanismo ya existente reutilizado sin cambios).
- [x] Falta de permisos (`403`) en cualquier endpoint de esta feature se traduce a `AuthorizationError` (`errorMapper.ts`, sin cambios) y un estado de error legible (`AppErrorState`), nunca a una pantalla en blanco ni a un `console.error` crudo.
- [x] Error del servidor (`500`/red/timeout) muestra el estado `error` genérico (`AppErrorState`), con opción de reintentar solo en operaciones idempotentes (`onRetry` solo se pasa a queries GET, nunca a mutaciones).
- [x] Ninguna respuesta de ninguno de estos endpoints expone `passwordHash`, `oauthSubject` ni cualquier campo interno — confirmado en la tarea anterior contra el backend real corriendo (`selectUserFields` de Prisma nunca los incluye).

**Calidad / UX**
- [x] El listado, el formulario de creación y el detalle/edición son usables en pantalla móvil (single-column, targets táctiles vía componentes Ionic estándar) y en una ventana de escritorio más ancha (`users.css` con breakpoint a 720px para la barra de herramientas del listado). **No probado en emulador/dispositivo real** (ver `tasks.md`).
- [x] Estados `loading`, `empty`, `error` y `success` están cubiertos en el listado (`AppSkeleton`/`AppEmptyState`/`AppErrorState`/lista poblada vía `AppDataList`) y en el formulario (envío en curso vía `isSubmitting`, error de validación/negocio, éxito con navegación de vuelta).
- [x] Acciones sensibles (desactivar un usuario, remover un rol) piden confirmación explícita antes de ejecutar la mutación (`AppConfirmDialog`).
- [x] La interfaz reutiliza `AppButton`, `AppInput`, `AppPage`, `RoleGuard`, `PermissionGuard` y los tokens de `src/theme/variables.css` — no introduce una librería de UI adicional ni una paleta de color paralela. **Nota:** las páginas de esta feature no usan `AppPage` directamente porque se montan dentro del shell `AdminLayout` (feature `006`), que ya provee `IonPage`/`IonHeader`/`IonContent` — envolverlas de nuevo crearía una página anidada incorrecta.
- [x] Los nuevos componentes genéricos que esta feature necesite y no existan aún se agregaron en `components/common`, `components/feedback`, `components/forms` y `hooks/` respectivamente — no inline dentro de `features/users/`.

### Contratos y tipos (obligatorio)

- [x] Los tipos TypeScript de request/response en `src/types/api/users.ts` y `src/types/api/roles.ts` reflejan exactamente el `UserDto`/`RoleDto` reales documentados arriba, sin `any`.
- [x] `../../constitution/api-integration.md` está actualizado en el mismo commit con: la corrección del bloqueo original de esta feature, los tres quiebres reales documentados arriba, y la dependencia explícita de `canchago/spec/features/015-bootstrap-super-admin/`.

## Fuera de alcance

- **Registro público de autoservicio** (sign-up sin sesión de administrador) — no existe en el backend (`canchago/spec/features/002-autenticacion-core/spec.md` lo excluye explícitamente: "el proveedor OAuth es el origen de verdad de la identidad") y esta feature no lo introduce.
- **Creación, edición o eliminación de organizaciones/sedes** — se consume `GET /api/organizaciones` solo como catálogo de lectura para resolver `organizationId`; el CRUD completo es la feature backlog `006 · Gestión de organizaciones y sedes (móvil)`, no esta.
- **CRUD de roles y permisos** (crear/editar/eliminar roles, asignar permisos a un rol) — eso es la feature backlog `007 · Gestión de roles y permisos (móvil)`; aquí solo se **consume** el catálogo de roles ya existente para asignarlos a un usuario.
- **Asignar o promover el rol global `Administrador`/`Futbolista` desde esta app** — técnicamente imposible hoy (el backend no lo expone vía HTTP) y deliberadamente fuera de alcance por diseño: el super admin se aprovisiona exclusivamente vía `yarn asignar-rol` en `canchago`, documentado en su feature `015-bootstrap-super-admin`.
- **Restablecimiento de contraseña o gestión de credenciales** — no aplica; la autenticación es 100% Keycloak/OAuth, sin contraseña local en `canchago`.
- **Auditoría de cambios de usuarios/roles en la UI** — diferida en el propio backend (features `005`/`006` de `canchago`), no se construye una pantalla de auditoría aquí.
- **Invitaciones por correo electrónico** — explícitamente fuera de alcance también en `canchago/spec/features/003-gestion-usuarios/spec.md`.
- **Garantizar en el servidor la protección contra escalamiento de privilegios** — eso es responsabilidad de `canchago/spec/features/015-bootstrap-super-admin/`; esta feature solo refleja esa protección en la UI (ocultar opciones) y depende de que el backend la implemente para que sea real, no simulada.
