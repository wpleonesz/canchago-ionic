# 008 · Registro Público de Usuarios — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

- [ ] Confirmar contra `canchago/spec/features/016-registro-publico/` (implementado) el contrato exacto: endpoints, campos, política de contraseña real.
- [ ] Crear `src/types/api/register.ts` y `src/types/api/access-requests.ts`.
- [ ] Crear `src/validation/register.ts` (Zod, con la política de contraseña real confirmada).
- [ ] Crear `src/services/api/endpoints/register.ts` y `access-requests.ts`.
- [ ] Crear `src/features/auth/hooks/useRegister.ts`.
- [ ] Crear `src/features/access-requests/hooks/useAccessRequests.ts` (list, approve, reject).
- [ ] Crear `src/features/auth/components/AccountTypeStep.tsx`, `PlayerRegisterForm.tsx`, `ManagerRegisterForm.tsx`.
- [ ] Crear `src/features/auth/pages/RegisterPage.tsx`.
- [ ] Agregar el enlace "¿No tienes cuenta? Regístrate" en `LoginPage.tsx` (ambas variantes).
- [ ] Crear `src/features/access-requests/components/AccessRequestListItem.tsx` y `AccessRequestsPage.tsx`.
- [ ] Agregar `/register` a `AppRoutes.tsx` (pública).
- [ ] Reemplazar el placeholder de `/admin/organizations` en `AdminLayout.tsx` por el nuevo módulo de solicitudes.
- [ ] Implementar la confirmación de aprobar/rechazar con `AppConfirmDialog`.
- [ ] Implementar el prellenado de email al dirigir a login nativo tras un registro Futbolista exitoso.

## Contratos y tipos (obligatorio)

_Debe completarse en paralelo con la integración del endpoint, no como paso final._

- [ ] Definir/actualizar los tipos a partir del contrato real verificado en `canchago` (código, no solo su spec).
- [ ] Actualizar `../../constitution/api-integration.md` en el mismo commit con el contrato real de los 4 endpoints.
- [ ] Verificar manualmente contra el backend real que la respuesta de cada endpoint coincide exactamente con lo tipado.

## Cierre

- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] `yarn lint && yarn typecheck && yarn test && yarn build` sin errores.
- [ ] Si se tocó código nativo/plugins: `yarn cap:sync` sin errores.
- [ ] Tests: unitarios para `validation/register.ts`; componentes para `AccountTypeStep` (cambia los campos mostrados), `PlayerRegisterForm`/`ManagerRegisterForm` (validación, doble envío bloqueado), `AccessRequestsPage` (guard de permisos); integración del flujo completo de registro con mocks de los nuevos endpoints.
- [ ] Probar manualmente en emulador/dispositivo real: registrar un Futbolista y confirmar que puede loguearse después; registrar un Gestor de Cancha, aprobar la solicitud desde otra cuenta con `organizaciones.manage`, y confirmar que el primero obtiene acceso sin reinstalar la app.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Si el backend agrega un endpoint "mi solicitud" en el futuro, construir la pantalla de estado dedicada para el Gestor de Cancha pendiente (hoy diferida, ver `spec.md`).
- [ ] Si se construye el CRUD completo de organizaciones (backlog `006`), integrar la pantalla de solicitudes como una pestaña/sección de esa feature en vez de un módulo aparte.
