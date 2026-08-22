# 008 · Registro Público de Usuarios — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

- [x] Confirmar contra `canchago/spec/features/016-registro-publico/` (implementado) el contrato exacto: endpoints, campos, política de contraseña real — leído directamente del código real (`validations/auth/register.validation.ts`, las 3 rutas de `pages/api/organizaciones/access-requests/`), no solo de la spec.
- [x] Crear `src/types/api/register.ts` y `src/types/api/access-requests.ts`.
- [x] Crear `src/validation/register.ts` (Zod, con la política de contraseña real confirmada: `min(8)`, espejo de `keycloak/realm-canchago.json`). **Cambio respecto al plan**: en vez de un único schema con `.superRefine`, se usan dos schemas separados (`playerRegisterFormSchema`/`managerRegisterFormSchema`) — el tipo de cuenta ya se elige en un paso previo (`AccountTypeStep`), así que cada formulario solo necesita validar sus propios campos; no hace falta refinamiento condicional en el cliente (el backend sí lo usa, porque para él llega todo en un solo body).
- [x] Crear `src/services/api/endpoints/register.ts` y `access-requests.ts`.
- [x] Crear `src/features/auth/hooks/useRegister.ts`.
- [x] Crear `src/features/access-requests/hooks/useAccessRequests.ts` (list, approve, reject).
- [x] Crear `src/features/auth/components/AccountTypeStep.tsx`, `PlayerRegisterForm.tsx`, `ManagerRegisterForm.tsx`.
- [x] Crear `src/features/auth/pages/RegisterPage.tsx`.
- [x] Agregar el enlace "¿No tienes cuenta? Regístrate" en `LoginPage.tsx` (ambas variantes).
- [x] Crear `src/features/access-requests/components/AccessRequestListItem.tsx` y `AccessRequestsPage.tsx` (más `AccessRequestsModule.tsx`, el router interno del módulo — mismo patrón que `UsersModule`).
- [x] Agregar `/register` a `AppRoutes.tsx` (pública).
- [x] Reemplazar el placeholder de `/admin/organizations` en `AdminLayout.tsx` por el nuevo módulo de solicitudes. Se actualizó también `admin-navigation.ts`: el ítem pasa de exigir `organizaciones.read` a `organizaciones.manage` (el permiso real que protege esta pantalla) y se renombra de "Organizaciones y sedes" a "Solicitudes de acceso" para no prometer el CRUD completo que sigue sin construirse (backlog 006).
- [x] Implementar la confirmación de aprobar/rechazar con `AppConfirmDialog`.
- [x] Implementar el prellenado de email al dirigir a login nativo tras un registro exitoso — implementado para **ambos** tipos de cuenta (no solo Futbolista): `RegisterPage` pasa `{ email }` como `location.state` a `/login`, y `LoginPage`/`NativeLoginForm` lo usa como `defaultUsername`. En web, sigue redirigiendo a Keycloak sin prellenado (no es posible desde fuera).

## Contratos y tipos (obligatorio)

_Debe completarse en paralelo con la integración del endpoint, no como paso final._

- [x] Definir/actualizar los tipos a partir del contrato real verificado en `canchago` (código, no solo su spec).
- [x] Actualizar `../../constitution/api-integration.md` en el mismo commit con el contrato real de los 4 endpoints.
- [x] Verificar manualmente contra el backend real que la respuesta de cada endpoint coincide exactamente con lo tipado — confirmado con Playwright contra `yarn dev` real (ver "Cierre").

## Cierre

- [x] Validar contra los criterios de aceptación de `spec.md`.
- [x] `yarn lint && yarn typecheck && yarn test && yarn build` sin errores. `test`: 89/90 pasan; el test #90 se pierde por un crash de memoria de un worker de Vitest (`ERR_WORKER_OUT_OF_MEMORY`), reproducido igual con y sin los cambios de esta feature — es un límite de memoria del entorno sandbox, no una regresión real (0 aserciones fallidas en ninguna corrida).
- [ ] Si se tocó código nativo/plugins: `yarn cap:sync` — **no aplica**, esta feature no toca ningún plugin ni código nativo.
- [x] Tests: unitarios para `validation/register.ts` (9 tests); componentes para `AccountTypeStep` (2), `PlayerRegisterForm`/`ManagerRegisterForm` (validación, doble envío bloqueado — 3+2 tests), `AccessRequestsModule` (guard de permisos — 2 tests), `AccessRequestsPage` (confirmación antes de mutar — 3 tests) y `AccessRequestListItem` (2 tests); integración del flujo completo de registro (`RegisterPage`, 6 tests) con mocks de los nuevos endpoints.
- [x] Probar manualmente: **no en emulador/dispositivo real** (queda pendiente, ver abajo) — sí probado end-to-end en navegador real (Playwright + `yarn dev`, contra Keycloak/Postgres reales) siguiendo la guía del skill `run`: registro Futbolista → confirmación de acceso inmediato; registro Gestor de Cancha → confirmación de "pendiente de aprobación"; login como `reviewer@canchago.local` (rol Administrador) → `/admin/organizations` muestra la solicitud real recién creada → aprobar vía el diálogo de confirmación real → la solicitud desaparece de la lista sin recargar. También se probó el límite de tasa (429) real del backend, mostrando el mensaje esperado sin reintento automático.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md` — **no se marca "Hecho" todavía**: falta la verificación en emulador/dispositivo real (Android/iOS vía `yarn android`/`yarn ios`), que es la que de verdad importa para esta app (nunca se distribuye como web, ver `tech-stack.md`). El navegador solo valida la lógica; el target real queda pendiente de que el usuario lo confirme, siguiendo el mismo criterio ya aplicado en la feature 005 de este repo.

### Bug encontrado y corregido durante la verificación manual

`AccessRequestListItem` ubicaba el `IonBadge` ("Pendiente") y los botones Aprobar/Rechazar en `slot="end"` de `IonItem` — con dos elementos en ese slot, el contenido no ajustaba en un viewport angosto (probado a 420–480px, el ancho real de un teléfono) y los botones quedaban cortados fuera de la pantalla, invisibles e inaccesibles. Corregido moviendo todo (encabezado con badge, texto, botones) dentro de un único `IonLabel` con `flex-wrap`, verificado visualmente antes/después con capturas de Playwright.

## Mantenimiento (checklist recurrente)

- [ ] Si el backend agrega un endpoint "mi solicitud" en el futuro, construir la pantalla de estado dedicada para el Gestor de Cancha pendiente (hoy diferida, ver `spec.md`).
- [ ] Si se construye el CRUD completo de organizaciones (backlog `006`), integrar la pantalla de solicitudes como una pestaña/sección de esa feature en vez de un módulo aparte.
