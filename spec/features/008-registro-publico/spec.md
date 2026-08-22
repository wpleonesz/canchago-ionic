# 008 · Registro Público de Usuarios

**Estado:** propuesta

## Qué hace

Añade la pantalla de **registro público** que hoy no existe en la app (confirmado: no hay ninguna referencia a "registro"/"signup" en todo `src/` ni en ningún spec previo) — el punto de entrada para que cualquier persona que se descarga Canchago cree su propia cuenta, sin depender de un administrador.

1. **`/register`** (pública, sin sesión) — formulario que primero pregunta **"¿Cómo quieres usar Canchago?"**: **Jugar y reservar canchas** (Futbolista) o **Gestionar una cancha** (Gestor de Cancha).
2. **Flujo Futbolista** — email, contraseña, nombre, apellido. Al enviarse, la cuenta queda activa de inmediato: la app inicia sesión automáticamente (o dirige a `/login` a iniciar sesión, según lo que permita el contrato real — ver "Contrato de API consumido") y el usuario llega a su panel con el rol `Futbolista` ya asignado.
3. **Flujo Gestor de Cancha** — mismos campos de cuenta, más los datos de la organización (nombre, y opcionalmente razón social, RUC/identificación fiscal, email, teléfono, dominio) y de su primera sede (nombre, dirección, teléfono, email). Al enviarse, la app muestra con claridad que **la solicitud quedó pendiente de aprobación** — no promete acceso inmediato, porque no lo hay (ver backend `016-registro-publico`).
4. **Aprobación administrativa** — una pantalla nueva, mínima, para quien tenga `organizaciones.manage`: lista las solicitudes pendientes (organización, sede, solicitante) con acciones **Aprobar**/**Rechazar**. Se integra reemplazando el placeholder actual de `/admin/organizations` (feature `006`), sin construir el CRUD completo de organizaciones (eso sigue siendo el backlog `006` de este repo, sin fecha).

Reutiliza el estilo, componentes y capas ya existentes: `AppInput`, `AppButton`, `AppSelect`, `AppDataList`, `AppConfirmDialog`, `AppErrorState`, `AppEmptyState`, `AppSkeleton`, `PermissionGuard`, `useDebounce` no aplica aquí (no hay listado con búsqueda en el registro).

## Por qué

Canchago será una app pública descargable. Sin registro propio, la única forma de conseguir una cuenta es que un administrador te la cree manualmente (feature `005`) — inviable para una app pública. El backend expone ahora `canchago/spec/features/016-registro-publico/`; esta feature construye el consumo real de ese contrato, sin inventar ningún campo ni comportamiento que el backend no soporte.

## Contrato de API consumido

_Verificado contra `canchago/spec/features/016-registro-publico/spec.md` y su `plan.md` — el backend de esta feature específica se especifica en paralelo a esta; si al implementar el contrato real difiere de lo aquí descrito, se actualiza `api-integration.md` antes de continuar, no se asume._

- `POST /api/auth/register` — sin autenticación. Body `{ email, password, firstName, lastName, accountType: 'futbolista' | 'gestor-de-cancha', organization?, venue? }` (`organization`/`venue` solo si `accountType === 'gestor-de-cancha'`). Responde `201` con los datos de la cuenta creada (nunca contraseña ni tokens); `400` datos inválidos/faltantes; `409` email duplicado; `422` contraseña no cumple la política; `429` límite de intentos excedido.
- **Login posterior al registro**: el contrato de `016` no crea una sesión automáticamente en el mismo request — el registro solo crea la cuenta. Esta feature, tras un `201`, dirige al flujo de login real ya existente (`redirectToLogin()` en web, `loginWithPassword()` en nativo — mismos mecanismos de las features `002`/`003`), pre-rellenando el email cuando el flujo lo permita (el formulario nativo sí lo permite; el flujo web redirige a Keycloak y no se puede prellenar desde fuera).
- `GET /api/organizaciones/access-requests` — permiso `organizaciones.manage`. Query `page`, `pageSize`, `status?` (default `PENDING`). Responde `{ data: AccessRequestDto[], meta }`.
- `POST /api/organizaciones/access-requests/{requestId}/approve` — permiso `organizaciones.manage`. Sin body. `200`. `404`/`409` (ya revisada).
- `POST /api/organizaciones/access-requests/{requestId}/reject` — permiso `organizaciones.manage`. Body opcional `{ reason? }`. `200`. Mismos `404`/`409`.

### Quiebres/gaps a vigilar (heredados del backend, no de esta feature)

- El backend de `016` no ofrece ninguna forma de saber, desde la sesión de un Gestor de Cancha pendiente, que su solicitud está "en revisión" específicamente (no hay un endpoint "mi solicitud"). Esta feature no inventa uno: el usuario pendiente simplemente ve el panel administrativo vacío (`AdminDashboardPage`, feature `006`, ya maneja "sin capacidades administrativas" de forma genérica y honesta) — no se construye un mensaje más específico ("tu solicitud está pendiente") en esta versión porque requeriría un endpoint que no existe. Se registra como mejora futura, no como bug de esta feature.
- El límite de contraseña (longitud mínima, caracteres exigidos) depende de la política real del realm de Keycloak, que el backend debe documentar en su propio `plan.md` antes de que esta feature fije las reglas de `validation/register.ts` — no se inventa una política aquí; se replica la que el backend confirme.

## Criterios de aceptación

**Navegación y acceso**
- [ ] `/register` es accesible sin sesión (ruta pública) desde un enlace "¿No tienes cuenta? Regístrate" visible tanto en el login web como en el nativo.
- [ ] Un usuario con sesión activa que visita `/register` es redirigido, igual que ya ocurre hoy con `/login` (mismo patrón de `PublicRoute`).

**Flujo Futbolista**
- [ ] El formulario exige `email` (formato válido), `password` (según la política real confirmada con el backend), `firstName`, `lastName` (no vacíos, ≤100 caracteres) — mismas restricciones que el `registerSchema` real del backend, replicadas solo para UX.
- [ ] Un envío válido produce exactamente un `POST /api/auth/register` con `accountType: 'futbolista'`; tras `201`, la app dirige al flujo de login real (no inventa una sesión ni guarda ningún token localmente a partir de la respuesta de registro, que no los incluye).
- [ ] Un email duplicado (`409`) se muestra como error de formulario contextual ("ya existe una cuenta con ese correo"), sin reintento automático.
- [ ] El doble envío está prevenido (`isLoading` de `AppButton`).
- [ ] Ningún campo pide datos de organización/sede cuando se elige Futbolista.

**Flujo Gestor de Cancha**
- [ ] Al elegir "Gestionar una cancha" aparecen los campos de organización (nombre obligatorio; razón social, identificación fiscal, email, teléfono, dominio opcionales) y de sede (nombre obligatorio; dirección, teléfono, email opcionales) — mismas restricciones que el backend.
- [ ] Un envío válido produce un `POST /api/auth/register` con `accountType: 'gestor-de-cancha'` y los datos de `organization`/`venue`; tras `201`, la app muestra explícitamente que la cuenta se creó pero el acceso de gestor está **pendiente de aprobación** — nunca sugiere que ya tiene acceso.
- [ ] Si el usuario, tras esto, inicia sesión, ve el panel administrativo vacío (sin módulos) — comportamiento ya cubierto por `AdminDashboardPage` (feature `006`), no un estado nuevo.

**Aprobación administrativa**
- [ ] La pantalla de solicitudes pendientes solo es visible/accesible para quien tenga `organizaciones.manage` (oculta vía `PermissionGuard`/`AdminRoute`, igual que el resto del panel).
- [ ] Lista paginada real (no carga todo al cliente), mostrando organización, sede y solicitante.
- [ ] Aprobar/rechazar piden confirmación explícita (`AppConfirmDialog`) antes de ejecutar la mutación, dado que son acciones sensibles e irreversibles desde la UI.
- [ ] Tras aprobar/rechazar, la solicitud desaparece de la lista de pendientes (invalidación de la query) sin recargar la página.
- [ ] Un usuario sin `organizaciones.manage` no ve la pantalla ni sus acciones; si accede por URL, el backend responde `403` y se muestra el estado de error correspondiente, nunca datos.

**Casos límite y errores**
- [ ] `400`/`422` del backend se muestran como errores de formulario específicos por campo cuando el backend los asocia a un campo, o como mensaje general si no.
- [ ] `429` se muestra como "demasiados intentos, espera un momento e inténtalo de nuevo" — sin reintento automático inmediato.
- [ ] Error de servidor/red sigue la taxonomía ya existente (`errorMapper.ts`), estado `error` genérico con reintento solo si aplica.
- [ ] Ninguna respuesta expone campos internos (tokens, secretos, `passwordHash`) — la contraseña tampoco se guarda en ningún estado de cliente más allá de la duración del propio formulario.

**Calidad / UX**
- [ ] Formularios usables en móvil (una columna, ≥44×44px) y en pantallas más anchas.
- [ ] Estados `loading`/`error`/`success` cubiertos en el registro (envío en curso, error de validación/negocio, confirmación clara de éxito distinta para Futbolista vs. Gestor pendiente) y en la lista de solicitudes (`loading`/`empty`/`error`/poblada, reutilizando `AppDataList`).
- [ ] Reutiliza el lenguaje visual existente (tokens de `theme/variables.css`, `AuthShell` para el registro) sin introducir una librería de UI nueva.

### Contratos y tipos (obligatorio)

- [ ] Los tipos de request/response en `src/types/api/register.ts` y `src/types/api/access-requests.ts` (nuevos) reflejan exactamente el contrato real verificado en `canchago/spec/features/016-registro-publico/` — actualizados si el contrato real difiere al implementar.
- [ ] `../../constitution/api-integration.md` se actualiza en el mismo commit con el contrato real de los 4 endpoints nuevos una vez verificados contra el backend corriendo (no solo contra su spec).

## Fuera de alcance

- **Verificación de email** — el backend no la implementa en `016` (sin infraestructura de correo); esta feature no simula un estado que no existe.
- **Pantalla dedicada "tu solicitud está pendiente"** para el propio Gestor de Cancha solicitante — requeriría un endpoint "mi solicitud" que el backend no expone; se usa el estado vacío genérico ya existente del panel administrativo.
- **CRUD completo de organizaciones y sedes** — la pantalla de aprobación solo lista/aprueba/rechaza solicitudes; crear, editar o eliminar organizaciones/sedes directamente sigue siendo el backlog `006` de este repo (Gestión de organizaciones y sedes), sin fecha.
- **Login automático inmediatamente después del registro** sin pasar por el flujo de login real — el backend no crea una sesión en el mismo request de registro; esta feature no lo simula guardando tokens que no recibió.
- **CAPTCHA u otra fricción anti-bot en el cliente** — el backend mitiga abuso con rate limiting server-side; el cliente no implementa nada adicional (evita depender de una librería de terceros sin necesidad comprobada).
- **Cambiar el login, logout o sesión existentes** — sin cambios en `LoginPage.tsx` más allá de agregar el enlace a `/register`.
