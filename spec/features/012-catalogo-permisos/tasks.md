# 012 · Catálogo de Permisos — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

- [x] Añadir `roleKeys.permissionsPage(query)` y `usePermissionsCatalog(query)` en `src/features/roles/hooks/useRoles.ts`.
- [x] Crear `src/features/roles/components/PermissionListItem.tsx` (fila de solo lectura: descripción/acción, badge de módulo, código).
- [x] Crear `src/features/roles/pages/PermissionsListPage.tsx` (header + buscador + `AppDataList`).
- [x] Añadir estilos en `src/features/roles/roles.css` (`.permissions-list-page`, `.permissions-list-page__toolbar`, `.permission-list-item__title`, `.permission-list-item__meta`).
- [x] Sustituir `AdminModulePendingPage` por `PermissionsListPage` en la ruta `/admin/permissions` de `src/layouts/AdminLayout.tsx`.
- [x] Verificar que `AdminModulePendingPage` sigue usándose o sigue siendo un componente genérico reutilizable antes de decidir si su import en `AdminLayout.tsx` se retira o se conserva.
- [x] `PermissionListItem.test.tsx` — título con `description`, fallback a `action`, badge de módulo visible.

## Contratos y tipos (obligatorio)

- [x] `src/types/api/roles.ts` ya reflejaba el contrato real (`PermissionDto`, `PermissionListQuery`, `PermissionListResponse`); no requirió cambios.
- [x] El contrato consumido no es nuevo; `../../constitution/api-integration.md` no requirió una entrada nueva (verificado contra §6 y la sección de la feature backend `018`).
- [ ] Verificar manualmente contra el backend real corriendo (`yarn dev` en `canchago` + Postgres/Keycloak reales) que la respuesta de `GET /api/permisos` coincide con lo tipado y que la pantalla renderiza datos reales — **no ejecutado en este entorno** (no hay una instancia de `canchago` con base de datos real levantada); sí se verificó el contrato leyendo el código real del backend (ver `spec.md`).

## Cierre

- [x] Validar contra los criterios de aceptación de `spec.md`.
- [x] `yarn lint && yarn typecheck && yarn test && yarn build` — lint, typecheck y build limpios; test: 115/117 verdes, la única falla es `src/features/users/components/UserForm.test.tsx`, confirmada preexistente y ajena a esta feature (falla igual con `git stash` aplicado, y ya está documentada en el roadmap para las features `008`/`011`).
- [x] `yarn cap:sync` — no aplica: no se tocó código nativo ni plugins de Capacitor.
- [x] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Si el catálogo de permisos crece significativamente (más módulos), evaluar añadir el filtro `module` ya soportado por el backend en vez de dejar la lista crecer sin filtrar.
