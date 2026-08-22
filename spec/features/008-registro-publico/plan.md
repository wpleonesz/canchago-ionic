# 008 · Registro Público de Usuarios — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar la `constitution/`._

## Enfoque

Un formulario público de dos pasos (elegir tipo de cuenta → datos correspondientes) reutilizando el patrón ya establecido en `UserForm`/`AuthShell` (React Hook Form + Zod + `Controller` + `AppInput`/`AppSelect`), y una pantalla administrativa mínima de aprobación que sigue exactamente el mismo patrón que `UsersModule`/`UsersListPage` (feature `005`): un módulo montado dentro del shell administrativo existente (feature `006`), reemplazando su placeholder de organizaciones.

## Implementación

1. **`src/types/api/register.ts`** (nuevo) — `RegisterAccountType`, `RegisterOrganizationInput`, `RegisterVenueInput`, `RegisterRequest`, `RegisterResponse` (variantes según `accountType`, discriminadas por ese campo).
2. **`src/types/api/access-requests.ts`** (nuevo) — `AccessRequestDto` (id, status, createdAt, organization: {id, name}, venue: {id, name}, requester: {id, email, firstName, lastName}), `AccessRequestListQuery`, `AccessRequestListResponse`.
3. **`src/validation/register.ts`** (nuevo) — Zod: schema base de cuenta + `.superRefine` exigiendo `organization`/`venue` solo cuando `accountType === 'gestor-de-cancha'`, espejo del `registerSchema` real del backend (confirmar la política de contraseña real antes de fijar el `min()`).
4. **`src/services/api/endpoints/register.ts`** (nuevo) — `register(body: RegisterRequest): Promise<RegisterResponse>`.
5. **`src/services/api/endpoints/access-requests.ts`** (nuevo) — `getAccessRequests(query)`, `approveAccessRequest(requestId)`, `rejectAccessRequest(requestId, reason?)`.
6. **`src/features/auth/hooks/useRegister.ts`** (nuevo) — `useRegisterMutation()` (`useMutation` sobre `register`, sin invalidar queries de sesión — el registro no crea sesión).
7. **`src/features/access-requests/hooks/useAccessRequests.ts`** (nuevo) — `useAccessRequests(query)`, `useApproveAccessRequest()`, `useRejectAccessRequest()` (invalidan `['access-requests']` tras mutar), mismo patrón que `useUsers`/`useUserMutations`.
8. **`src/features/auth/components/`** (nuevo) — `AccountTypeStep.tsx` (selector "Jugar"/"Gestionar una cancha", tarjetas grandes tocables, no un `<select>` — es la primera decisión del flujo, merece más presencia visual), `PlayerRegisterForm.tsx`, `ManagerRegisterForm.tsx` (extiende los campos de cuenta con organización/sede).
9. **`src/features/auth/pages/RegisterPage.tsx`** (nuevo) — orquesta los pasos (estado local: `accountType | null` → renderiza el formulario correspondiente), usa `AuthShell` igual que `LoginPage`, muestra la confirmación final distinta según tipo (redirección a login para Futbolista; mensaje de "pendiente de aprobación" para Gestor, con un botón para ir a `/login`).
10. **`src/features/auth/pages/LoginPage.tsx`** — agregar el enlace "¿No tienes cuenta? Regístrate" (`routerLink="/register"`) en ambas variantes (`WebLogin` y `NativeLoginForm`), sin tocar el resto del flujo de login existente.
11. **`src/features/access-requests/components/AccessRequestListItem.tsx`** y **`AccessRequestsPage.tsx`** (nuevos) — mismo patrón que `UserListItem`/`UsersListPage`: `AppDataList` + `AppConfirmDialog` para aprobar/rechazar.
12. **`src/routes/PublicRoute.tsx`** — sin cambios de lógica; se reutiliza tal cual envolviendo la nueva ruta `/register`.
13. **`src/routes/AppRoutes.tsx`** — agregar `<PublicRoute exact path="/register"><RegisterPage /></PublicRoute>`.
14. **`src/layouts/AdminLayout.tsx`** — reemplazar el `AdminRoute path="/admin/organizations"` actual (hoy `AdminModulePendingPage`) por el nuevo módulo de solicitudes, exactamente como se hizo con `/admin/users` en la feature `005` (mismo patrón: un `Route` no-exacto que monta un router interno propio del módulo, con sus `AdminRoute` internos si en el futuro se agregan más sub-rutas de organizaciones).
15. **`../../constitution/api-integration.md`** — actualizar con el contrato real de los 4 endpoints una vez verificados contra el backend implementado.

## Decisiones

- **Selector de tipo de cuenta como paso separado (tarjetas), no un campo más del formulario** — es la decisión que determina qué campos siguen; tratarlo como un `<select>` perdido entre inputs de texto le resta la importancia que tiene (un Gestor de Cancha está a punto de crear una organización real).
- **No auto-loguear tras el registro** — el contrato de `016` no devuelve tokens de sesión en la respuesta de registro (solo el backend web usa cookies HttpOnly que solo Keycloak/el propio backend pueden establecer, y el nativo requiere el flujo ROPC explícito); simular una sesión a partir de datos que no llegaron violaría el principio de "el backend es la fuente de verdad" (`mission.md`). Se dirige al login real y, cuando el flujo lo permite (nativo), se prellena el email para minimizar fricción.
- **Módulo de solicitudes montado en `/admin/organizations` (reemplazando su placeholder) en vez de una ruta nueva fuera del shell administrativo** — mantiene una sola fuente de navegación administrativa (la de la feature `006`), en vez de crear un segundo árbol de rutas admin paralelo.
- **No se construye "mi solicitud" para el propio Gestor de Cancha pendiente** — ver "Fuera de alcance" en `spec.md`; requeriría un endpoint que el backend no expone en `016`.

## Riesgos

- **Este plan depende de que `canchago/spec/features/016-registro-publico/` se implemente con el contrato exacto aquí asumido** — si el backend real difiere (nombres de campo, endpoints, o si decide devolver una sesión en el mismo request), esta feature debe actualizar `api-integration.md` y ajustar tipos/servicios antes de dar por buena la integración — no se asume el contrato como definitivo hasta verificarlo contra el backend corriendo.
- **Formulario de Gestor de Cancha es el más largo de toda la app hasta ahora** (cuenta + organización + sede) — riesgo de abandono en móvil. Mitigación: agrupar visualmente en secciones claras (`AuthShell` + subtítulos), no dividir en múltiples pantallas por ahora (evita el trabajo de persistir estado entre pasos) — si la tasa de abandono real resulta un problema, se revisita en una feature futura.
- **Confusión del usuario tras un registro de Gestor de Cancha** ("¿ya puedo entrar o no?") — mitigado con un mensaje explícito de "pendiente de aprobación" en la confirmación, pero sin una pantalla de estado propia post-login (ver "Fuera de alcance"); se acepta el riesgo de que un usuario pendiente vea el panel vacío sin más contexto hasta que la mejora futura ("mi solicitud") se construya.
