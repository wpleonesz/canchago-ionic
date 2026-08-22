# 007 · Edición Administrativa del Perfil de Usuario — Tareas

_Checklist accionable derivada del `plan.md`. La implementación principal está completa; permanecen pendientes la automatización E2E en Cypress y el cierre global del backend bloqueado por deuda previa de tipos._

## Backend: contrato y seguridad

- [ ] **T-01 (EPU-02/03/11/12)** Extender `validations/users/index.ts` con params UUID y body PATCH estricto, trim, nombres 1–100, al menos un cambio y timestamp ISO obligatorio.
- [ ] **T-02 (EPU-02/03/07/11)** Extender `database/users/index.ts` con acceso mínimo para leer y actualizar `UserProfile` por `userId + expectedProfileUpdatedAt`, sin propagar body ni seleccionar secretos.
- [ ] **T-03 (EPU-04/05/06)** Extender `services/users/index.ts` y reutilizar/ampliar `services/users/role-guard.ts` para validar objetivo existente/activo, actor con permisos y protección de usuarios con roles `isSystem`; sin checks por ID/email/username.
- [ ] **T-04 (EPU-07)** Ejecutar guard, comprobación de timestamp y escritura en una transacción coherente; convertir snapshot obsoleto en 409.
- [ ] **T-05 (EPU-02/04/06/12)** Crear `pages/api/users/[userId]/profile.ts`: GET `users.read`, PATCH `users.update`, parser Zod, envelopes y errores estándar.
- [ ] **T-06 (EPU-03/08/11)** Asegurar que el mapper PATCH solo escribe `firstName`/`lastName`; rechazar email, username, identification, estado, roles, permisos, passwords, tokens, IDs y claves desconocidas.
- [ ] **T-07 (EPU-08)** Mantener `PATCH /api/users/{userId}`, endpoints de roles y DELETE separados; evaluar/declarar deprecación del formulario de edición amplio sin romper creación.
- [ ] **T-08 (EPU-10)** Invalidar cualquier snapshot/cache backend de usuario/permisos únicamente después del commit si la infraestructura de cache correspondiente está implementada.

## Backend: OpenAPI y pruebas

- [ ] **T-09 (EPU-02/11/12)** Registrar `AdminUserProfile` y `UpdateAdminUserProfileBody` en `documentation/schemas/users.ts`.
- [ ] **T-10 (EPU-04/06/07/12)** Registrar GET/PATCH `/users/{userId}/profile`, seguridad, permisos, ejemplos y 200/400/401/403/404/409/500; verificar `/api/docs`.
- [ ] **T-11 (EPU-02/03)** Tests Zod: Unicode, trim, vacíos, >100, body sin cambios, timestamp inválido y cada familia de claves protegidas.
- [ ] **T-12 (EPU-04/05/06)** Tests de servicio: actor permitido, sin permiso, objetivo inexistente/inactivo, usuario con rol system, Administrador global, autoedición e ID manipulado.
- [ ] **T-13 (EPU-07)** Test concurrente: dos snapshots editan; el primero persiste y el segundo recibe 409 sin sobrescribir.
- [ ] **T-14 (EPU-03/08/11/12)** Integración API: mass assignment, 401/403/404/409/500 controlados, atomicidad, response mínimo y regresión de login/roles/desactivación.

## Frontend: contratos y estado

- [ ] **T-15 (EPU-02/10/11)** Actualizar `src/types/api/users.ts` con DTO/request dedicados, sin reutilizar el update general ni introducir `any`.
- [ ] **T-16 (EPU-02/03)** Crear `src/validation/user-profile.ts` con las reglas UX espejo del backend.
- [ ] **T-17 (EPU-02/10/12)** Agregar `getAdminUserProfile`/`updateAdminUserProfile` a `services/api/endpoints/users.ts`.
- [ ] **T-18 (EPU-07/10)** Crear `useUserProfile` y mutación: query específica, invalidación selectiva de detalle/listas y `SESSION_QUERY_KEY` al autoeditarse.

## Frontend: pantalla administrativa

- [ ] **T-19 (EPU-01/09)** Crear `AdminUserProfileForm` con Nombre/Apellido, email/estado informativos, Guardar/Cancelar, dirty state, doble envío y feedback accesible.
- [ ] **T-20 (EPU-01/04/12)** Crear `UserProfileEditPage` con loading/error/404/409/success y reintento/recarga segura.
- [ ] **T-21 (EPU-01/04/06)** Integrar detalle y `/admin/users/{userId}/edit` en `UsersModule`; proteger ruta y acción con `users.update` sin considerar el frontend autoridad.
- [ ] **T-22 (EPU-08/11)** Separar visualmente Perfil, Cuenta/estado y Roles; eliminar email/organización/roleIds del submit de perfil.
- [ ] **T-23 (EPU-09)** Aplicar layout móvil de una columna, acciones táctiles, ancho de escritorio, safe areas, dark mode, foco y reduced motion reutilizando tokens.
- [ ] **T-24 (EPU-09)** Evaluar/implementar advertencia de cambios no guardados compatible con Router 5/Ionic/back nativo; documentar salidas no cubiertas si queda riesgo residual.

## Frontend: pruebas

- [ ] **T-25 (EPU-02/09/12)** Unitarias del schema/form: nombres válidos, vacíos, Unicode, >100, dirty/valid, guardar, cancelar, error por campo y doble clic.
- [ ] **T-26 (EPU-04/05/06)** Componentes/rutas: solo lectura sin `users.update`, deep link negado, usuario system, ID cambiado y sesión expirada.
- [ ] **T-27 (EPU-07/10/12)** Hooks: éxito actualiza detalle/lista, autoedición invalida sesión, 409 conserva datos nuevos y errores remotos no producen éxito falso.
- [ ] **T-28 (EPU-01/09)** Cypress: listado → detalle → editar nombre → guardar; cancelar/dirty; 403; 404; conflicto; viewports móvil/escritorio.
- [ ] **T-29 (EPU-08/11)** Regresión: login web/nativo, Home, creación/listado/desactivación, roles/permisos y respuesta sin secretos.

## Contratos y tipos (obligatorio)

- [x] Implementar primero el contrato backend y OpenAPI; no consumir un endpoint supuesto desde Ionic.
- [x] Actualizar `../../constitution/api-integration.md` con endpoints, DTO, permisos, errores, concurrencia y límites.
- [x] Verificar mediante contrato y pruebas de integración que GET/PATCH coinciden exactamente con los tipos TypeScript y que un 403 directo no depende de ocultamiento UI.
- [x] Confirmar que no se creó migración Prisma para v1; si el alcance cambia a identification/otros campos, detener y aprobar una SPEC/migración separada.

## Cierre

- [ ] Validar EPU-01 a EPU-12 y todos los criterios de aceptación de `spec.md` con evidencia.
- [ ] En `canchago`: `yarn lint && yarn typecheck && yarn test && yarn build`; verificar GET `/api/docs`.
- [x] En `canchago-ionic`: `yarn lint && yarn typecheck && yarn test && yarn build`.
- [x] No se tocó código/configuración nativa; `yarn cap:sync` y validación Android/iOS no aplican.
- [x] Mover la feature a “Hecho” en el roadmap Ionic y registrar el contrato backend.

## Mantenimiento (checklist recurrente)

- [ ] Al agregar un campo editable, verificar primero modelo, permiso, auditoría, unicidad/formato, DTO, mass assignment, OpenAPI y pruebas negativas.
- [ ] Si cambia `UserProfile.updatedAt`, el contrato de concurrencia o la jerarquía super admin, actualizar backend, tipos Ionic, cache y pruebas en el mismo cambio.
- [ ] Cuando exista auditoría/identificación/email seguro, crear una feature nueva; no ampliar silenciosamente el body de `/profile`.
