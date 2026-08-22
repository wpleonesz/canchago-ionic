# 005 · Gestión de Usuarios — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

- [ ] Crear `src/types/api/users.ts`, `src/types/api/roles.ts`, `src/types/api/organizaciones.ts` con los shapes reales verificados (ver "Contrato de API consumido" en `spec.md`).
- [ ] Crear `src/validation/users.ts` (Zod, espejo del schema real de `canchago`).
- [ ] Crear `src/services/api/endpoints/users.ts`, `roles.ts`, `organizaciones.ts` (una función por endpoint real).
- [ ] Normalizar en `organizaciones.ts` el envelope `{organizations, meta}` al shape interno usado por el resto de la app.
- [ ] Crear `src/hooks/useDebounce.ts` (hoy `src/hooks/` está vacío).
- [ ] Crear `src/components/forms/AppSearchInput.tsx` y `AppSelect.tsx`.
- [ ] Crear `src/components/feedback/AppEmptyState.tsx`, `AppErrorState.tsx`, `AppSkeleton.tsx`, `AppConfirmDialog.tsx`.
- [ ] Crear `src/components/common/AppDataList.tsx` (lista/tabla paginada genérica).
- [ ] Crear `src/features/users/hooks/` (`useUsers`, `useUser`, `useCreateUser`, `useUpdateUser`, `useDeactivateUser`, `useUserRoles`, `useAssignUserRoles`, `useRemoveUserRole`).
- [ ] Crear `src/features/roles/hooks/useRoles.ts`.
- [ ] Crear `src/features/organizations/hooks/useOrganizations.ts`.
- [ ] Crear `src/features/users/components/` (`UserListItem`, `UserForm`, `UserRolesEditor`, `OrganizationPicker`).
- [ ] Crear `src/features/users/pages/` (`UsersListPage`, `UserFormPage`, `UserDetailPage`).
- [ ] Agregar rutas `/users`, `/users/new`, `/users/:userId`, `/users/:userId/edit` en `src/routes/AppRoutes.tsx`, envueltas en `ProtectedRoute` + `PermissionGuard` donde corresponda.
- [ ] Agregar entrada de navegación a `/users` en `src/pages/Home.tsx` dentro de `PermissionGuard permission="users.read"`, reutilizando `HomeActionCard`.
- [ ] Implementar el selector de roles excluyendo del catálogo los roles que el usuario ya tiene asignados (mitigación del gap de duplicados en `POST /api/users/:userId/roles`).
- [ ] Implementar el filtro de estado limitado a "Activos"/"Todos" (sin "solo inactivos") y el ordenamiento limitado a `email`/`createdAt` (sin `name`), con comentario citando el gap real del backend.
- [ ] Confirmación explícita (`AppConfirmDialog`) antes de desactivar un usuario o remover un rol.

## Contratos y tipos (obligatorio)

_Debe completarse en paralelo con la integración del endpoint, no como paso final._

- [ ] Definir/actualizar `src/types/api/users.ts`, `roles.ts`, `organizaciones.ts` a partir del contrato real verificado en `canchago` (código, no solo sus specs).
- [ ] Actualizar `../../constitution/api-integration.md` en el mismo commit: corregir el registro del bug de permisos (ya no reproduce), documentar los tres quiebres reales (`active=false`, `orderBy=name`, roles globales invisibles), y registrar la dependencia de `canchago/spec/features/015-bootstrap-super-admin/`.
- [ ] Verificar manualmente contra el backend real (o su Swagger en `/api/docs`, con cautela) que la respuesta de `GET/POST/PATCH /api/users`, `GET /api/roles`, `GET /api/organizaciones` coincide exactamente con lo tipado, incluyendo el envelope no estándar de organizaciones.

## Cierre

- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] `yarn lint && yarn typecheck && yarn test && yarn build` sin errores.
- [ ] Si se tocó código nativo/plugins: `yarn cap:sync` sin errores.
- [ ] Escribir/actualizar tests: unitarios para `useDebounce`, `validation/users.ts`, `errorMapper` (casos nuevos si aplica); componentes para `UserForm` (validación, doble envío bloqueado), `UserRolesEditor` (excluye roles ya asignados), guards (`PermissionGuard` ocultando la sección/los botones sin `users.read`/`users.create`/`users.update`/`users.delete`/`users.manage`); integración `hook → servicio → API mock (msw) → estado UI` para el flujo crear/listar/editar/desactivar; E2E (Cypress) para listar, crear, editar, desactivar usuario — mismos flujos críticos que exige `tech-stack.md` §14.
- [ ] Probar manualmente en emulador/dispositivo real (Android y/o iOS vía `yarn android`/`yarn ios`), no solo en `yarn dev` — según exige `tech-stack.md` §13 ("el navegador es solo un atajo de desarrollo").
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`, y actualizar la entrada del backlog original ("005 · Gestión de usuarios (móvil) — Bloqueada...") para reflejar que el bloqueo verificado ya no aplica, dejando constancia de la nueva dependencia real (`canchago` feature `015`).

## Mantenimiento (checklist recurrente)

- [ ] Cada vez que `canchago` implemente la feature `015-bootstrap-super-admin` o corrija los quiebres de `active`/`orderBy`/roles globales, revisar y actualizar `api-integration.md` y esta feature (quitar las restricciones de UI que ya no sean necesarias).
- [ ] Cada vez que se agregue un nuevo campo a `UserDto` en el backend, actualizar `src/types/api/users.ts` en el mismo commit que se empiece a consumir.
