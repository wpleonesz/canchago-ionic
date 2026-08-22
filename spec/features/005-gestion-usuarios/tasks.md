# 005 · Gestión de Usuarios — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

- [x] Crear `src/types/api/users.ts`, `src/types/api/roles.ts`, `src/types/api/organizaciones.ts` con los shapes reales verificados (ver "Contrato de API consumido" en `spec.md`). **Nota:** `RoleDto` no incluye `organizationId` (el select real de `GET /api/roles` no lo devuelve por fila, solo se filtra por él); `permissionsCount` normaliza el `_count.permissions` real de Prisma.
- [x] Crear `src/validation/users.ts` (Zod, espejo del schema real de `canchago`).
- [x] Crear `src/services/api/endpoints/users.ts`, `roles.ts`, `organizaciones.ts` (una función por endpoint real).
- [x] Normalizar en `organizaciones.ts` el envelope `{organizations, meta}` al shape interno usado por el resto de la app.
- [x] Crear `src/hooks/useDebounce.ts` (hoy `src/hooks/` está vacío).
- [x] Crear `src/components/forms/AppSearchInput.tsx` y `AppSelect.tsx`.
- [x] Crear `src/components/feedback/AppEmptyState.tsx`, `AppErrorState.tsx`, `AppSkeleton.tsx`, `AppConfirmDialog.tsx`.
- [x] Crear `src/components/common/AppDataList.tsx` (lista/tabla paginada genérica).
- [x] Crear `src/features/users/hooks/` (`useUsers`, `useUser`, `useCreateUser`, `useUpdateUser`, `useDeactivateUser`, `useUserRoles`, `useAssignUserRoles`, `useRemoveUserRole`) — repartidos en `useUsers.ts`, `useUserMutations.ts`, `useUserRoles.ts`.
- [x] Crear `src/features/roles/hooks/useRoles.ts`.
- [x] Crear `src/features/organizations/hooks/useOrganizations.ts`.
- [x] Crear `src/features/users/components/` (`UserListItem`, `UserForm`, `UserRolesEditor`, `OrganizationPicker`).
- [x] Crear `src/features/users/pages/` (`UsersListPage`, `UserFormPage`, `UserDetailPage`).
- [x] **Cambio respecto al plan original:** las rutas se integraron en `/admin/users`, `/admin/users/new`, `/admin/users/:userId`, `/admin/users/:userId/edit` (vía un nuevo `src/features/users/pages/UsersModule.tsx` montado desde `src/layouts/AdminLayout.tsx`), no en `/users*` como decía el plan original. Al implementar esta feature ya existía en el repo (en curso, por otra sesión) la feature `006-experiencia-administracion-navegacion`, que define el shell administrativo real bajo `/admin` con un placeholder ya reservado para "Gestión de usuarios" en `/admin/users` con permiso `users.read` — coherente con esta spec. Se integró ahí en vez de duplicar una jerarquía de rutas paralela. Cada ruta usa `AdminRoute` (de esa feature) con su propio permiso: lista/detalle `users.read`, creación `users.create`, edición `users.update`.
- [x] Entrada de navegación: **no fue necesario tocarla** — `src/pages/Home.tsx` ya fue actualizado por la feature `006` con un enlace genérico "Abrir administración" que resuelve al primer módulo admin autorizado (`getFirstAdminPath`), reemplazando el plan original de un `HomeActionCard` específico para usuarios.
- [x] Implementar el selector de roles excluyendo del catálogo los roles que el usuario ya tiene asignados (mitigación del gap de duplicados en `POST /api/users/:userId/roles`) — `UserRolesEditor` vía prop `excludeRoleIds`, usado en `UserDetailPage`.
- [x] Implementar el filtro de estado limitado a "Activos"/"Todos" (sin "solo inactivos") y el ordenamiento limitado a `email`/`createdAt` (sin `name`) — el tipo `UserListQuery.orderBy` en TypeScript ya excluye `'name'` estructuralmente (no solo por convención), citando el gap real del backend.
- [x] Confirmación explícita (`AppConfirmDialog`) antes de desactivar un usuario o remover un rol.

## Contratos y tipos (obligatorio)

_Debe completarse en paralelo con la integración del endpoint, no como paso final._

- [x] Definir/actualizar `src/types/api/users.ts`, `roles.ts`, `organizaciones.ts` a partir del contrato real verificado en `canchago` (código, no solo sus specs).
- [x] Actualizar `../../constitution/api-integration.md` en el mismo commit: corregir el registro del bug de permisos (ya no reproduce), documentar los tres quiebres reales (`active=false`, `orderBy=name`, roles globales invisibles), y registrar la dependencia de `canchago/spec/features/015-bootstrap-super-admin/`.
- [ ] Verificar manualmente contra el backend real (o su Swagger en `/api/docs`, con cautela) que la respuesta de `GET/POST/PATCH /api/users`, `GET /api/roles`, `GET /api/organizaciones` coincide exactamente con lo tipado, incluyendo el envelope no estándar de organizaciones. **No ejecutado en esta sesión** (requiere levantar `canchago` localmente desde este repo); los shapes se basan en la lectura de código ya hecha para `spec.md` y en la verificación end-to-end real realizada al implementar `canchago/spec/features/015-bootstrap-super-admin/`.

## Cierre

- [x] Validar contra los criterios de aceptación de `spec.md` — ver checklist actualizado ahí.
- [x] `yarn lint && yarn typecheck && yarn test && yarn build` sin errores (53/53 pruebas, incluyendo las 15 nuevas de esta feature).
- [ ] Si se tocó código nativo/plugins: `yarn cap:sync` — **no aplica**, esta feature no tocó código nativo ni plugins de Capacitor.
- [x] Escribir/actualizar tests: unitarios para `useDebounce` y `validation/users.ts` (hechos); componentes para `UserForm` (validación vacía, doble envío bloqueado) y `UserRolesEditor` (excluye roles ya asignados) (hechos). **Pendiente:** tests de `errorMapper` (sin casos nuevos que agregar — no se introdujeron códigos de error nuevos), tests de guards específicos de esta feature (los guards genéricos `PermissionGuard`/`RoleGuard` ya tienen su propia suite en `guards.test.tsx`, no duplicada aquí), integración con `msw` (la infraestructura de mocking en este repo hoy usa `vi.mock` a nivel de módulo — mismo patrón que `useSession.test.tsx`/`LoginPage.test.tsx` — no existe aún ningún test que use `msw` pese a estar instalado; no se introdujo su primer uso en esta feature para no mezclar dos convenciones de mocking en el mismo repo sin decisión explícita), y E2E Cypress (no escrito — requiere decidir primero los selectores/flujo de Cypress para todo el shell `/admin`, coordinado con la feature `006`).
- [ ] Probar manualmente en emulador/dispositivo real (Android y/o iOS) — **no ejecutado en esta sesión** (sandbox sin emulador disponible); validado con `yarn dev` (web) y `yarn build` únicamente. Queda pendiente que el usuario lo confirme en un dispositivo/emulador real antes de considerar la feature completamente cerrada.
- [x] Mover la feature a "Hecho" en `../../constitution/roadmap.md`, y actualizar la entrada del backlog original para reflejar que el bloqueo verificado ya no aplica.

## Mantenimiento (checklist recurrente)

- [ ] Cada vez que `canchago` implemente la feature `015-bootstrap-super-admin` o corrija los quiebres de `active`/`orderBy`/roles globales, revisar y actualizar `api-integration.md` y esta feature (quitar las restricciones de UI que ya no sean necesarias).
- [ ] Cada vez que se agregue un nuevo campo a `UserDto` en el backend, actualizar `src/types/api/users.ts` en el mismo commit que se empiece a consumir.
