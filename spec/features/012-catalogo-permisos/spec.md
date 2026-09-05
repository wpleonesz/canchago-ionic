# 012 · Catálogo de Permisos

**Estado:** implementado ✅

## Qué hace

Reemplaza el placeholder "Módulo previsto" de `/admin/permissions` por una pantalla real: un administrador con `permisos.read` ve el catálogo completo de permisos del sistema (`código`, `módulo`, `acción`, `descripción`), puede buscarlo por texto y navegarlo por páginas. Es de **solo lectura**: no hay creación, edición ni borrado de permisos desde la interfaz.

## Por qué

La navegación a `/admin/permissions` ya existía desde la feature `006-experiencia-administracion-navegacion` (ítem "Permisos" en `ADMIN_NAVIGATION`, gateado por `permisos.read`), pero `AdminLayout` la resolvía con `AdminModulePendingPage`: un mensaje de "esto se implementará en su propia feature". El catálogo real (`GET /api/permisos`) ya existe en el backend desde la feature `005-gestion-roles-permisos`, y su cliente (`getPermissions`), tipos (`PermissionDto`, `PermissionListQuery`, `PermissionListResponse`) y una variante en modo "cargar más" del hook (`usePermissions`) ya existen y están en uso dentro de `RolePermissionSelector` (features `018`/`020`). Faltaba únicamente la pantalla de catálogo standalone — completar `/admin/permissions` es cerrar ese último hueco visible de navegación con datos reales, sin inventar nada nuevo en el backend.

## Contrato de API consumido

_Verificado leyendo `canchago` directamente y contrastado con `../../constitution/api-integration.md` §6 ("Permisos") y su sección "Gestión administrativa de roles (backend 018)"._

- `GET /api/permisos` — permiso requerido: `permisos.read` — query `page?`, `pageSize?` (máx. 100), `search?` (código/módulo/acción/descripción), `module?` (filtro exacto); respuesta `{ data: PermissionDto[], meta: { page, pageSize, total, totalPages } }`, orden estable por `module`, `action`, `code`. Catálogo global, sin filtro de organización. Sin `orderBy`/`order`: el orden lo fija el backend.
- No se requiere ningún endpoint nuevo ni distinto al ya documentado; no se actualiza `api-integration.md` con un contrato nuevo (el existente ya cubre este uso).

## Criterios de aceptación

- [x] Un usuario con `permisos.read` que navega a `/admin/permissions` ve la lista real de permisos (código, módulo, acción, descripción), no el mensaje "Módulo previsto".
- [x] La búsqueda filtra contra el backend (parámetro `search` real), no en memoria sobre una página ya cargada.
- [x] El catálogo pagina con los controles ya estandarizados (`AppDataList`) cuando `totalPages > 1`; con un catálogo pequeño (caso real hoy) no se muestran controles de paginación innecesarios.
- [x] Estado de carga (`AppSkeleton`), error con reintento (`AppErrorState`) y vacío real ("sin resultados para tu búsqueda" vs. catálogo realmente vacío) se representan de forma distinta, igual que en `RolesListPage`.
- [x] Un usuario sin `permisos.read` no ve el ítem "Permisos" en la navegación (ya garantizado por `filterAdminNavigation` desde la feature `006`) y un acceso directo por URL a `/admin/permissions` es bloqueado por `AdminRoute` (ya garantizado, sin cambios en esta feature) — el backend sigue siendo la autoridad final si además se manipulara la sesión.
- [x] No se ofrece ninguna acción de crear, editar ni borrar permisos en esta pantalla.
- [x] Responsive: la pantalla se apila correctamente en móvil, igual que `RolesListPage`/`RoleDetailPage`.

### Contratos y tipos (obligatorio)

- [x] Los tipos TypeScript de request/response (`PermissionDto`, `PermissionListQuery`, `PermissionListResponse` en `src/types/api/roles.ts`) ya reflejaban exactamente el contrato real; no se modificaron porque no cambian con esta feature.
- [x] El contrato consumido no es nuevo ni cambió; `../../constitution/api-integration.md` no requiere una entrada adicional (ver "Contrato de API consumido" arriba).

## Fuera de alcance

- Cualquier mutación de permisos (crear/editar/borrar) — el backend no expone esos endpoints (ver `api-integration.md` §6: "catálogo global, sin CRUD").
- Filtro por `module` en la interfaz (el backend lo soporta vía query, pero no hay hoy una lista fija de módulos que valga la pena exponer como selector; se deja como mejora futura si el catálogo crece).
- Agrupar visualmente los permisos por módulo dentro de esta pantalla (ese tratamiento ya existe, con otro propósito, en `RoleDetailPage`/`RolePermissionSelector` para permisos *de un rol*; esta pantalla es un catálogo plano, buscable y paginado, igual que `RolesListPage`).
- Cualquier cambio al catálogo de menús o a la navegación (`ADMIN_NAVIGATION`, `AdminRoute`): el ítem y el guard ya existían y no cambian.
- Migrar `usePermissions` (la variante "cargar más" que usa el selector de permisos de un rol) a este nuevo hook paginado, o viceversa: son dos formas de consumo distintas y legítimas del mismo endpoint (ver `plan.md`, sección Decisiones).
