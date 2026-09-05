# 012 · Catálogo de Permisos — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar la `constitution/`._

## Enfoque

Clonar el patrón ya validado de `RolesListPage` (header, buscador, `AppDataList` con paginación por página) pero de solo lectura y sin selector de organización (el catálogo de permisos es global, no por tenant). Toda la capa de datos (tipos, cliente API) ya existe y se reutiliza sin cambios; solo falta un hook de consulta paginada nuevo (la variante existente, `usePermissions`, es una *infinite query* pensada para "cargar más" dentro del selector de un rol — no sirve tal cual para una tabla con paginación por página) y la propia pantalla.

## Implementación

1. **`src/features/roles/hooks/useRoles.ts`** — Añadir `roleKeys.permissionsPage(query)` (clave de caché distinta de `roleKeys.permissions`, que es la de la infinite query existente, para no mezclar ambas formas de cachear el mismo endpoint) y `usePermissionsCatalog(query: PermissionListQuery)` como `useQuery` simple sobre `getPermissions` (mismo `staleTime` que `usePermissions`, 5 min — el catálogo es prácticamente inmutable en tiempo de sesión).
2. **`src/features/roles/components/PermissionListItem.tsx`** (nuevo) — Fila de solo lectura: título = `description ?? action`, badge de `module`, `code` en `<code>`. Mismo esqueleto que `RoleListItem` pero sin `PermissionGuard` ni acciones (no hay nada que hacer sobre una fila).
3. **`src/features/roles/pages/PermissionsListPage.tsx`** (nuevo) — Header (`roles-page-header`, reutilizado) sin botón de acción, un único `AppSearchInput`, `AppDataList` con `usePermissionsCatalog`. `pageSize` fijo en 50 (el catálogo real hoy tiene ~13 entradas; con 50 por página la mayoría de instalaciones no ve controles de paginación, y quien lo necesite los sigue teniendo disponibles).
4. **`src/features/roles/roles.css`** — Añadir `.permissions-list-page` al selector que ya fija las variables de espaciado (`--app-space-*`) y `display: grid; gap: var(--app-space-5);`; reutilizar `.roles-page-header`. Añadir `.permissions-list-page__toolbar` (un único campo, sin grid de 3 columnas como en roles) y `.permission-list-item__title`/`__meta`, calcados de `.role-list-item__title`/`__meta`.
5. **`src/layouts/AdminLayout.tsx`** — Sustituir `<AdminModulePendingPage moduleName="Catálogo de permisos" />` por `<PermissionsListPage />` dentro del `AdminRoute` de `/admin/permissions` (sin tocar el `AdminRoute` en sí: guard y permiso requerido no cambian). Se conserva el import de `AdminModulePendingPage` solo si queda algún otro módulo pendiente que lo use — verificar antes de decidir si el import sobra.
6. **Pruebas** — `PermissionListItem.test.tsx` (nuevo, mismo estilo que `RoleListItem.test.tsx`): título con `description`, fallback a `action` cuando `description` es `null`, badge de módulo visible.

No se toca `src/types/api/roles.ts` ni `src/services/api/endpoints/roles.ts`: el contrato y su cliente ya son correctos y ya se usan en producción desde `RolePermissionSelector`.

## Decisiones

- **Hook nuevo (`usePermissionsCatalog`) en vez de reutilizar `usePermissions`** — `usePermissions` es una `useInfiniteQuery` con `pageSize` fijo en 100 pensada para acumular "todas las páginas cargadas hasta ahora" dentro de un selector con checkboxes; no expone una página concreta ni un `meta.page` compatible con `AppDataList`. Forzar esa forma en una tabla paginada habría sido más complejo que un `useQuery` simple sobre el mismo `getPermissions`. Ambos hooks conviven porque consumen el mismo endpoint para dos propósitos de UI distintos y legítimos.
- **Sin selector de organización** — A diferencia de `RolesListPage`, el catálogo de permisos es global (`GET /api/permisos` no acepta `organizationId`); se omite ese control por completo en vez de dejarlo deshabilitado o simulado.
- **Sin filtro de `module` en la UI** — El backend lo soporta, pero no existe hoy una lista fija y estable de módulos que valga la pena hardcodear en un `<select>`, y derivarla dinámicamente de los datos ya cargados solo cubriría los módulos de la página actual, dando un filtro incompleto y confuso. Se deja fuera (ver `spec.md`), no se inventa una fuente de verdad para los módulos que el backend no expone.
- **`pageSize` fijo en 50, sin selector de tamaño de página** — El catálogo es pequeño y de crecimiento lento (es un catálogo de capacidades técnicas del sistema, no de datos de negocio); un tamaño fijo generoso evita paginación innecesaria sin la complejidad de un control adicional que `RolesListPage` tampoco ofrece hoy.
- **`AdminModulePendingPage` no se elimina** — Sigue siendo el placeholder genérico para módulos futuros aún no implementados (p. ej. un futuro dominio de reservas); esta feature solo deja de usarlo para `/admin/permissions`.

## Riesgos

- **El catálogo crece y el listado plano deja de ser suficiente** — Si en el futuro el número de permisos crece mucho (más módulos), un filtro por `module` o una vista agrupada podría volverse necesario. Mitigación: el backend ya soporta `module` como query param: agregar el filtro es una extensión aislada de esta misma pantalla, no un rediseño.
- **Confundir esta pantalla con la gestión de permisos de un rol** — Alguien podría esperar poder asignar permisos desde aquí. Mitigación: el encabezado dice explícitamente "solo lectura" (ver `spec.md`) y no hay ningún control de escritura; la asignación real sigue viviendo en `/admin/roles/:roleId/permissions` (feature `020`).
