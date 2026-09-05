# Integración con la API — canchago-ionic ↔ canchago

_Contratos reales verificados leyendo el código de `canchago` (no la documentación OpenAPI cuando ambas discrepan — se anota explícitamente cuando eso pasa). Este documento se actualiza cada vez que una feature consume o descubre un contrato nuevo, y es el lugar donde se registran necesidades de cambio en el backend **antes** de pedir su implementación — nunca se modifica `canchago` directamente desde este proyecto._

Última verificación: 2026-09-04, contra el estado local actual de `canchago`.

---

## 1. Base URL y prefijo

`{APP_BASE_URL}/api/...`. En desarrollo backend: `http://localhost:3000/api`. No hay versión de API en el path (sin `/v1`).

## 2. Autenticación — flujo real

Confidential OIDC client vía Keycloak (realm `canchago`, client `canchago-api`), Authorization Code + PKCE, `directAccessGrantsEnabled: false` (sin password grant), `implicitFlowEnabled: false`.

```
GET  /api/auth/login       → 302 a Keycloak (genera PKCE + nonce, cookie temporal canchago_oauth_state)
     (usuario autentica en la pantalla de Keycloak — no se puede pintar dentro de la app)
GET  /api/auth/callback    → intercambia code, crea/actualiza UserSession, setea cookie canchago_session, 302
GET  /api/auth/session     → auth requerido → { data: SessionUser }
POST /api/auth/refresh     → auth requerido → 204 (rota tokens si quedan <5min de vida)
POST /api/auth/logout      → auth requerido → 204 (revoca en Keycloak + marca revokedAt en UserSession)
```

`SessionUser = { id, email, name, roles: [{id, code, name}], permissions: [{id, code}] }`.

**Cookies:**

- `canchago_session` — `HttpOnly; Secure; SameSite=Lax; Path=/`, 8h. Solo contiene `{sessionId, createdAt}` sellado con `@hapi/iron`; los tokens OAuth reales viven server-side en la tabla `user_sessions`.
- `canchago_oauth_state` — igual de flags, 10 min TTL, temporal durante el handshake.

**Consecuencia crítica para el frontend:** JS nunca puede leer estos cookies (`HttpOnly` por diseño) ni forwardearlos manualmente. La sesión solo funciona si las llamadas HTTP se hacen desde el mismo contexto de navegador/WebView que completó el login, con `withCredentials: true`, y **same-origin con el backend** (no hay CORS configurado — ver §5).

## 3. Auth para app empaquetada (Android/iOS): formulario nativo + Bearer token

**Estado: implementado ✅ (2026-08-14, feature `014` del backend + feature `003` de este repo, revisión ROPC).** El usuario aprobó explícitamente la propuesta original de esta sección (cliente público + Bearer) y luego pidió reemplazar el mecanismo de obtención del token: no un navegador externo con Keycloak, sino un formulario nativo de usuario/contraseña dentro de la app. Ver `canchago/spec/features/014-autenticacion-movil-nativa/spec.md` y `spec/features/003-autenticacion-nativa/spec.md` (secciones "Revisión") para el detalle completo de esa conversación y el riesgo aceptado explícitamente (Resource Owner Password Credentials).

**Contrato real:**

- **Cliente OAuth público en Keycloak**: `canchago-mobile` (`publicClient: true`, sin secreto). Es el **único** cliente del realm con `directAccessGrantsEnabled: true` — `canchago-api` (web) sigue exigiendo Authorization Code + PKCE sin excepción.
- **Endpoint**: `POST /api/auth/mobile/login` — body `{ username, password }`, responde `{ data: { sessionToken, expiresAt } }` o `401` con mensaje genérico en español (nunca el texto real de Keycloak) si las credenciales son incorrectas. `sessionToken` es el mismo payload sellado (`@hapi/iron`) que normalmente viaja en la cookie del flujo web.
- **`middleware/auth.ts` acepta `Authorization: Bearer <token>`** como alternativa a la cookie, resolviendo la misma tabla `user_sessions`. `/api/auth/session`, `/api/auth/refresh` y `/api/auth/logout` funcionan igual con Bearer que con cookie.
- **`canchago/proxy.ts` (nuevo)** — CORS abierto (`Access-Control-Allow-Origin: *`) en `/api/*`. Next.js 16 renombró el archivo de convención de `middleware.ts` a `proxy.ts`; usar el nombre viejo generaba un warning de deprecación pero igual funcionaba. Seguro sin restringir el origen porque el cliente móvil nunca usa cookies (`withCredentials: false` en ese contexto), solo Bearer — no hay credenciales de cookie que un origen ajeno pueda robar.

**Cómo lo usa el frontend** (feature `003`): `LoginPage.tsx` muestra un formulario nativo (`AppInput` + React Hook Form + Zod) cuando `Capacitor.isNativePlatform()` es verdadero, llama a `loginWithPassword()` (`POST /auth/mobile/login`), y guarda el `sessionToken` en `@aparajita/capacitor-secure-storage` (nunca `@capacitor/preferences`). El flujo web/dev de la feature `002` (cookie + proxy de Vite + redirect a Keycloak) sigue existiendo sin cambios en el mismo archivo, elegido en tiempo de ejecución.

### Gaps de infraestructura reales encontrados al validar contra un emulador Android real (no evidentes por adelantado)

1. **Mixed Content (Android)** — el WebView sirve la app en `https://localhost` por defecto; una página HTTPS no puede llamar a un backend HTTP. Fix: `capacitor.config.ts` → `server.androidScheme: 'http'`.
2. **App Transport Security (iOS)** — mismo problema, otro mecanismo. Fix: `Info.plist` → `NSAppTransportSecurity.NSAllowsArbitraryLoads`.
3. **`usesCleartextTraffic` (Android)** — con `targetSdkVersion 36`, Android bloquea _todo_ tráfico HTTP a nivel de red para la app entera, más allá del WebView. Fix: `AndroidManifest.xml` → `android:usesCleartextTraffic="true"`.
4. **Backend sin CORS** — una vez resueltos 1–3, las llamadas salían pero el navegador bloqueaba leer la respuesta. Fix: `canchago/proxy.ts` (arriba).
5. **`withCredentials: true` incompatible con CORS `*`** — heredado de la config web; un navegador rechaza la combinación aunque no exista cookie real que enviar. Fix: `apiClient.ts` → `withCredentials: !Capacitor.isNativePlatform()`.
6. **Header `X-Correlation-ID` fuera de la lista de CORS** — el interceptor de trazabilidad lo agrega a cada request; el preflight lo rechazaba. Fix: incluido en `Access-Control-Allow-Headers` de `proxy.ts`.

Los seis se descubrieron probando de verdad contra un emulador Android + Keycloak + Postgres reales (interacción vía Chrome DevTools Protocol contra el WebView de la app instalada), no contra mocks — login real, identidad real en `/home`, logout real, y persistencia real de la sesión tras matar y reabrir la app.

## 4. Autorización

`middleware/access.ts` compara `req.user.permissions[].code` contra permisos requeridos por endpoint (ver §6 tabla de endpoints). El frontend refleja `SessionUser.permissions[]` para mostrar/ocultar UI, pero **nunca** decide autorización real — cada 403 del backend es la autoridad final.

✅ **Corrección (2026-08-21, discovery de la feature `005-gestion-usuarios` de este repo):** el bug descrito abajo (tachado) **ya no reproduce**. Se verificó leyendo directamente `canchago/prisma/seed.ts` y todas las rutas `pages/api/users/*`: el catálogo sembrado usa consistentemente `users.read`/`users.create`/`users.update`/`users.delete`/`users.manage`, exactamente los códigos que exige `middleware/access.ts` en esas rutas. `/api/users` funciona con los permisos correctos concedidos — probado end-to-end contra el backend real (feature backend `015-bootstrap-super-admin`). La feature `005` de este repo ya no está bloqueada por este motivo.

~~⚠️ Bug conocido en el backend (roadmap `010`, abierto a 2026-08-14): el middleware exige códigos `users.read`/`users.create`/`users.manage`, pero el catálogo sembrado usa `usuarios.read`/`usuarios.write`/`usuarios.delete` — ningún permiso real satisface hoy al módulo de usuarios (`/api/users` responde 403 siempre). No implementar la pantalla de gestión de usuarios como "funcional" hasta que este bug se resuelva en `canchago`.~~

⚠️ **Dependencia real pendiente para gestión de usuarios (feature `005` de este repo):** el backend permite hoy que cualquier usuario con `users.manage` asigne un rol marcado `isSystem: true` (como `Administrador`) a través de `POST/PATCH /api/users*` sin ninguna restricción adicional — un payload manipulado directamente podría escalar privilegios. La feature de backend `canchago/spec/features/015-bootstrap-super-admin/` corrige esto (guardias de escalamiento y de "último administrador"), pero **aún no está implementada**. Mientras tanto, `canchago-ionic` oculta los roles `isSystem` en la UI (que de todas formas nunca aparecen vía `GET /api/roles`, ver §6), pero esto es solo una capa de UX, no una garantía de seguridad del servidor.

## 5. Sin CORS

No hay `next.config.ts` con headers CORS ni `middleware.ts` raíz en `canchago`. Si se abandona la estrategia same-origin (§3), esto bloquea cualquier llamada cross-origin desde el WebView — requiere el cambio de backend listado en §3.

## 6. Endpoints disponibles hoy (identidad/RBAC — no hay dominio de reservas aún)

| Recurso               | Rutas                                                                                                                                 | Métodos + permiso                                         | Notas                                                                                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth                  | `/api/auth/{login,callback,session,refresh,logout}`                                                                                   | ver §2                                                    | público excepto session/refresh/logout                                                                                                                                                                                                                                                  |
| Usuarios              | `/api/users`, `/api/users/{userId}`, `/api/users/{userId}/profile`, `/api/users/{userId}/roles`, `/api/users/{userId}/roles/{roleId}` | GET/POST/PATCH/DELETE, permisos `users.*`                 | DELETE es soft (status→INACTIVE); la edición básica usa el subrecurso `/profile`; lista NO incluye roles, detalle SÍ; ver quiebres reales abajo (`active`, `orderBy`)                                                                                                                   |
| Organizaciones        | `/api/organizaciones`, `/api/organizaciones/{organizationId}`                                                                         | GET/POST/PATCH/DELETE, `organizaciones.read`/`.manage`    | **lista responde `{organizations, meta}`, NO `{data, meta}`** — el propio Swagger del backend lo documenta mal, no confiar en `GET /api/docs` para este endpoint                                                                                                                        |
| Sedes                 | `/api/organizaciones/{organizationId}/sedes`, `.../sedes/{sedeId}`                                                                    | GET/POST/PATCH/DELETE, mismos permisos que organizaciones | **lista responde `{venues, meta}`, NO `{data, meta}`** — mismo bug de documentación                                                                                                                                                                                                     |
| Roles                 | `/api/roles`, `/api/roles/{roleId}`, `/api/roles/{roleId}/permisos`                                                                   | GET/POST/PATCH/DELETE, `roles.read`/`.manage`             | requieren `?organizationId=<uuid>` como query, NO como parte del path — fácil de olvidar; **nunca devuelve roles globales** (`organizationId: null`, como `Administrador`/`Futbolista`) — coincidencia estricta contra el `organizationId` dado, ver quiebre abajo                      |
| Permisos              | `/api/permisos`                                                                                                                       | GET, `permisos.read`                                      | catálogo global, sin CRUD                                                                                                                                                                                                                                                               |
| Registro              | `/api/auth/register`                                                                                                                  | POST, público                                             | ver §6.1 — límite de tasa real (429) por IP y por email                                                                                                                                                                                                                                 |
| Solicitudes de acceso | `/api/organizaciones/access-requests`, `.../access-requests/{requestId}/approve`, `.../reject`                                        | GET/POST, `organizaciones.manage`                         | ver §6.1                                                                                                                                                                                                                                                                                |
| Docs                  | `/api/docs`, `/api/docs/spec`                                                                                                         | público                                                   | Swagger UI real, útil para explorar pero no 100% confiable (ver bugs de envelope arriba); hoy además `GET /api/docs` no compila del todo en `canchago` por un problema preexistente de tipos en `zod-to-openapi` (ver su `roadmap.md`, ítem `010`) — no relacionado con estos endpoints |

### 6.1 Registro público y aprobación de acceso (feature `008-registro-publico`, backend `016`, 2026-08-22)

Contrato verificado en código real (`canchago/validations/auth/register.validation.ts`, `canchago/pages/api/auth/register.ts`, `canchago/pages/api/organizaciones/access-requests/`) y contra el backend corriendo (Playwright, ver `tasks.md` de esta feature):

```ts
// POST /api/auth/register — sin sesión
{
  email: string; password: string; firstName: string; lastName: string;
  accountType: 'futbolista' | 'gestor-de-cancha';
  organization?: { name: string; legalName?; taxIdentification?; email?; phone?; domain? }; // solo gestor-de-cancha
  venue?: { name: string; address?; phone?; email? };                                        // solo gestor-de-cancha
}
// 201 →
{ data: { accountType: 'futbolista'; user: { id, email, firstName, lastName } } }
// o, para gestor-de-cancha:
{ data: { accountType: 'gestor-de-cancha'; user: {...}; accessRequestId: string; organizationStatus: 'PENDING_APPROVAL' } }
```

Nunca devuelve contraseña ni tokens de sesión — no crea sesión (login sigue el flujo real de §2/§3). `Futbolista` obtiene el rol de inmediato; `gestor-de-cancha` no obtiene ningún rol: su Organization/Venue quedan en `PENDING_APPROVAL` hasta que se aprueba la solicitud. Errores: `409` email duplicado (Zod `email` inválido → `400`; password < 8 caracteres → `400`, espeja `passwordPolicy` real del realm de Keycloak), `429` límite de tasa (5/hora por IP, 3/día por email) con mensaje `"Demasiados intentos. Intenta de nuevo más tarde."` — **primer endpoint que realmente lanza `TOO_MANY_REQUESTS`**, actualizar la nota de §7 en consecuencia.

```ts
// GET /api/organizaciones/access-requests?page&pageSize&status=PENDING|APPROVED|REJECTED (default PENDING)
// → organizaciones.manage
{
  data: Array<{
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    reviewedAt: string | null;
    rejectionReason: string | null;
    organization: { id; name; status; venues: Array<{ id; name; status }> };
    requester: { id; email; profile: { firstName; lastName } };
  }>;
  meta: PaginationMeta;
}

// POST .../access-requests/{requestId}/approve → 200 { data: { organizationId, status } }
// POST .../access-requests/{requestId}/reject  → body opcional { reason? } → 200 { data: { requestId, status } }
// Ambos: 404 si no existe, 409 si status !== 'PENDING' (ya revisada)
```

Aprobar activa la Organization y TODAS sus Venue (`status: 'ACTIVE'`) y crea (o reutiliza, si ya existe para esa organización) el rol "Gestor de Cancha" con alcance a esa organización, asignándoselo al solicitante — sin relogin, el rol aparece en la siguiente lectura de sesión (mismo mecanismo que la feature `009` del backend). Rechazar deja Organization/Venue en `PENDING_APPROVAL` (no se activan, no se borran) y guarda `rejectionReason`.

**No existen** endpoints de canchas/recursos reservables ni reservas — ese dominio aún no está modelado en `canchago` (confirmado en `prisma/schema.prisma`). Cualquier feature de "buscar/reservar cancha" requiere trabajo previo de backend, fuera del alcance de este proyecto hasta que se construya allí.

### Quiebres reales en `GET /api/users` (descubiertos por la feature `005-gestion-usuarios`, 2026-08-21)

- **`active=false` no filtra a "solo inactivos".** El backend hace `status: filters.active ? 'ACTIVE' : undefined` — pasar `active=false` tiene el mismo efecto que omitir el parámetro (muestra todos los estados). `canchago-ionic` solo ofrece "Activos" (`active=true`) / "Todos" (parámetro omitido); nunca "solo inactivos".
- **`orderBy=name` no es válido en el modelo real.** El schema Zod del backend permite `orderBy: 'name'|'email'|'createdAt'`, pero `User` no tiene columna `name` (vive partido en `UserProfile.firstName`/`lastName`) — usarlo dispara un error de Prisma devuelto como `500 INTERNAL_ERROR` genérico. `canchago-ionic` solo ofrece `email`/`createdAt` como ordenamiento.

### Edición administrativa de perfil (feature `007`, 2026-08-21)

Contrato verificado e implementado en `canchago/pages/api/users/[userId]/profile.ts`:

```text
GET   /api/users/{userId}/profile   → users.read
PATCH /api/users/{userId}/profile   → users.update
```

Respuesta individual de ambos métodos:

```ts
{
  data: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    active: boolean;
    profileUpdatedAt: string;
  }
}
```

El PATCH acepta únicamente `{ firstName?, lastName?, expectedProfileUpdatedAt }`, exige al menos un nombre y rechaza claves desconocidas. `expectedProfileUpdatedAt` es el timestamp ISO recibido en el GET; si quedó obsoleto responde `409 CONFLICT`. También responde 409 para usuarios inactivos, 404 para usuario/perfil inexistente y 403 cuando un actor no Administrador intenta editar un usuario con rol `isSystem`.

Email, username, identificación, estado, roles, permisos, contraseñas, hashes, tokens e IDs no pertenecen a este contrato. El backend rechaza esos campos en vez de ignorarlos. La respuesta no incluye identificación, RBAC ni información de autenticación.

### Perfil propio ampliado (feature `009`, backend `017`, 2026-08-21)

`GET/PATCH /api/profile` y `GET/PUT/DELETE /api/profile/avatar` requieren sesión pero no permisos administrativos. No reciben `userId`: el backend usa exclusivamente `req.user.id`, por lo que cambiar query o payload no selecciona otro perfil.

El DTO textual contiene `phone`, los siete enlaces opcionales, `hasAvatar`, `avatarUpdatedAt` y `profileUpdatedAt`. El PATCH convierte vacíos en `null`, exige `expectedProfileUpdatedAt` y rechaza claves desconocidas; un timestamp obsoleto responde `409 CONFLICT`.

El PUT recibe `{ imageBase64, mimeType }`, admite JPEG/PNG/WebP reales hasta 2 MiB y el servidor normaliza a WebP de máximo 1024×1024. Tamaño excesivo responde `413 PAYLOAD_TOO_LARGE`; contenido inválido o discordante, `415 UNSUPPORTED_MEDIA_TYPE`. GET usa caché privada, ETag y `nosniff`; DELETE es idempotente.

**Sin idempotencia real en `PATCH /api/profile` (verificado para la feature `013-sincronizacion-offline-perfil`, 2026-09-05):** el backend no acepta ningún header/campo tipo `Idempotency-Key` — confirmado leyendo `database/users/index.ts` (`updateOwnProfile` hace `userProfile.updateMany({ where: { userId, updatedAt: expectedProfileUpdatedAt } })`, solo concurrencia optimista). Reenviar el mismo body tras un éxito previo no es idempotente en el sentido estricto: como `updatedAt` ya cambió, la segunda aplicación falla con `409 CONFLICT` en vez de no-op — es un fallo seguro (nunca duplica ni sobrescribe), pero no es idempotencia real. Cualquier cliente que necesite reintentar un `PATCH /api/profile` (offline-first, reintentos de red) debe basarse en esta concurrencia optimista para detectar reaplicaciones, no asumir un mecanismo de deduplicación del servidor. Si se necesita idempotencia real en el futuro, requiere trabajo de backend (p. ej. una tabla de claves de idempotencia) — no implementado, fuera de alcance de `canchago-ionic`.

## 7. Contrato de respuesta

```json
// Éxito individual
{ "data": { "...": "..." } }

// Colección (regla general)
{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 } }

// EXCEPCIONES reales al patrón anterior — usar tal cual, no "corregir" en el mapeo:
{ "organizations": [], "meta": {...} }   // GET /api/organizaciones
{ "venues": [], "meta": {...} }          // GET /api/organizaciones/{id}/sedes

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [{ "field", "message", "type" }] } }
```

Códigos de error reales usados hoy: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `INTERNAL_ERROR` (500), `METHOD_NOT_ALLOWED` (405), `TOO_MANY_REQUESTS` (429, desde la feature `016`/`008` — ver §6.1). `BUSINESS_RULE_ERROR` (422) sigue reservado en el backend pero **ningún endpoint lo lanza todavía** — no construir UI para él como si existiera hoy. Nota: `errorMapper.ts` en este repo aún no tiene una clase dedicada para `TOO_MANY_REQUESTS` (cae en `UnknownError` por el `default` del switch) — el código que lo necesite debe comprobar `error.httpStatus === 429` en vez de un `instanceof` específico (ver `RegisterPage.tsx`).

## 8. Trazabilidad — estado real

El backend **no** devuelve `X-Request-ID`, `X-Correlation-ID` ni `traceparent` en ningún response (confirmado, no hay tal header en `middleware/` ni handlers). El `X-Correlation-ID` que el frontend genera (`tech-stack.md` §9) es local al cliente únicamente — no hay forma de correlacionarlo con logs del servidor hasta que el backend lo adopte. Propuesta pendiente de registrar formalmente si se vuelve necesario para soporte/diagnóstico.

## 9. Modelos relevantes hoy (identidad/RBAC)

`User` (+`UserProfile` 1:1, +`AuthAccount[]` para el vínculo OAuth, +`UserSession[]`), `Organization`, `Venue` (única por `[organizationId, name]`), `Role` (única por `[organizationId, name]`, `organizationId` nullable = rol global), `Permission` (`code` único, formato `<modulo>.<accion>`), `RolePermission`, `UserRole` (con `organizationId`/`venueId` opcionales — asignación con alcance). No hay `Cancha`/`Reserva` todavía.

## 10. Registro de cambios

_Cada vez que una feature nueva descubra o requiera un contrato distinto a lo aquí escrito, añadir una entrada fechada aquí antes de implementar._

### Gestión de organizaciones y sedes — administración (feature 010, 2026-08-29)

Contrato verificado en código real de `canchago` (`pages/api/organizaciones/**`, `services/organizaciones-sedes/`, `database/organizaciones-sedes/`, `validations/organizaciones-sedes/`, `prisma/schema.prisma`) para la nueva pantalla administrativa de CRUD de organizaciones y sedes (`spec/features/010-gestion-organizaciones-sedes/`), que reemplaza el placeholder de organizaciones descrito en la entrada de la feature `008` de abajo.

- El modelo Prisma real es `Venue` (tabla `venues`), no `Sede` — "sede" es solo el término en español usado en rutas/carpetas del backend. No existe modelo `Court`/`Cancha`.
- `POST/PATCH /organizaciones` y `POST/PATCH /organizaciones/{id}/sedes` nunca aceptan `status` en el body; el backend siempre escribe `'ACTIVE'` al crear. `Organization.status`/`Venue.status` son texto libre (`VARCHAR(30)`, sin `CHECK`/enum); los únicos valores usados hoy en todo el código son `'ACTIVE'` y `'PENDING_APPROVAL'`.
- `POST /organizaciones/{organizationId}/sedes` nunca acepta `organizationId` en el body — se toma solo del path.
- Los permisos sembrados `sedes.read`/`sedes.manage` (`prisma/seed.ts`) **no los verifica ningún endpoint real** — todo el CRUD de sedes usa `organizaciones.read`/`organizaciones.manage`. No usar `sedes.*` para gatear nada en el frontend.
- **Gaps de backend verificados, sin cerrar hoy** (detalle completo y justificación en `spec/features/010-gestion-organizaciones-sedes/spec.md`, sección "Dependencia de backend"):
  1. `GET/PATCH/DELETE /organizaciones/{organizationId}/sedes/{sedeId}` no valida que `sedeId` pertenezca a `organizationId` — IDOR real entre organizaciones para el recurso sede.
  2. `GET/PATCH/DELETE /organizaciones/{organizationId}` y el CRUD de sede individual no repiten el filtro de alcance por actor que sí aplica `GET /organizaciones` (listado) para administradores no-globales.
  3. Crear una sede con `organizationId` inexistente produce `500` (violación de FK no capturada), no `404`.
  4. Sin concurrencia optimista (`expectedUpdatedAt`) en `PATCH` de organización/sede, a diferencia de `Role` (feature `018`).
  5. `Organization.name` no tiene `@@unique` real (solo índice) — duplicados de nombre de organización no están bloqueados pese a que el código maneja un `ConflictError` para ese caso (código inalcanzable). `Venue` sí tiene `@@unique([organizationId, name])` real y funcional.
  6. Sin auditoría: `AuditAction` solo cubre `ROLE_CREATED`/`ROLE_UPDATED`.
  7. Sin `_count` de sedes por organización en el listado — por eso la pantalla no muestra "número de sedes" (evita N+1).
- Mientras estos puntos no se resuelvan en `canchago` (posible feature de hardening futura, análoga a `018`, fuera de este repositorio), la pantalla de organizaciones/sedes **no se considera protegida contra acceso cruzado entre organizaciones a nivel de servidor** — mismo criterio que ya aplica la nota de escalamiento de privilegios de la feature `005` en §4: la UI oculta por conveniencia, no por garantía del servidor.

### Gestión administrativa de roles (backend 018, 2026-08-29)

El contrato de roles conserva sus rutas y añade seguridad/consulta remota:

- `GET /api/roles`: exige `organizationId`, `roles.read` y alcance efectivo; admite `page`, `pageSize`, `search`, `isSystem`, `orderBy=name|createdAt|updatedAt` y `order=asc|desc`.
- `POST /api/roles`: body estricto `{ name, description?, permissionIds? }`; crea rol personalizado y permisos en una transacción, con auditoría durable.
- `GET /api/roles/{roleId}`: detalle con `organizationId`, campos escalares y `permissions: [{ granted, permission }]`.
- `PATCH /api/roles/{roleId}`: body estricto `{ name?, description?, permissionIds?, expectedUpdatedAt }`; datos, permisos, versión y auditoría se confirman atómicamente.
- `GET /api/permisos`: admite `page`, `pageSize`, `search?`, `module?`, orden estable por módulo/acción/código.
- Los roles `isSystem` son visibles dentro del alcance pero inmutables por HTTP. Los roles globales continúan fuera del listado organizacional.
- Un actor no Administrador solo puede crear/editar roles cuyos permisos actuales y solicitados sean subconjunto de sus permisos efectivos. Recursos cross-tenant devuelven 404 opaco cuando existe un identificador de recurso.
- Errores: 400 body/query o permiso inexistente, 401 sesión, 403 permiso/rol system/escalamiento, 404 recurso/scope, 409 nombre normalizado o versión obsoleta, 500 genérico.
- La sesión backend recompone permisos en cada request; no requiere relogin tras editar un rol.

El listado de organizaciones usado como selector queda limitado al alcance del actor no global. El envelope sigue siendo `{ organizations, meta }`.

- **2026-08-14** — Discovery inicial. Documento creado a partir de lectura directa de `canchago` (auth, middleware, `pages/api/`, `prisma/schema.prisma`, validaciones Zod, `.env.example`).
- **2026-08-29** — Feature backend `018-gestion-administrativa-roles`: contrato endurecido, filtros remotos, roles system read-only, concurrencia optimista, escritura/auditoría atómicas y scope organizacional; añadido contrato para la pantalla `/admin/roles`.
- **2026-08-21** — Feature `005-gestion-usuarios`: corrección del bug de códigos de permiso (§4, ya no reproduce, verificado en código real de `canchago`); documentados los quiebres reales de `GET /api/users` (`active=false`, `orderBy=name`, ver §6) y de `GET /api/roles` (nunca expone roles globales); registrada la dependencia de `canchago/spec/features/015-bootstrap-super-admin/` para que la protección contra escalamiento de privilegios sea real y no solo una ocultación de UI (§4).
- **2026-08-21** — Feature `007-edicion-perfil-usuario-administracion`: añadido y verificado el subrecurso administrativo `/api/users/{userId}/profile`, con DTO mínimo, permisos `users.read`/`users.update`, lista blanca estricta, protección de usuarios de sistema y concurrencia optimista mediante `profileUpdatedAt`.
- **2026-08-21** — Feature `009-perfil-ampliado-autogestion` y backend `017`: documentados los cinco métodos de perfil propio, campos opcionales, concurrencia, avatar WebP, límites y errores 413/415.
- **2026-08-22** — Feature `008-registro-publico` y backend `016`: añadidos `POST /api/auth/register` (público, con rate limiting real) y los tres endpoints de `/api/organizaciones/access-requests` (§6.1); primer uso real de `TOO_MANY_REQUESTS` (429) en el backend, actualizada la nota de §7 en consecuencia.
- **2026-08-14** — Feature `002-autenticacion`: contrato de auth (§2) **confirmado con prueba real** contra el backend corriendo local (Postgres nativo + Keycloak vía Docker + `yarn dev`), no solo leído. Flujo completo login → sesión → logout probado dos veces: primero con `curl` + cookie jar (usuario semilla `futbolista`/`canchago123`), después con Chrome headless real (Playwright) ejecutando el código real de `canchago-ionic`. Se corrigió la estrategia de "mismo origen" documentada en `tech-stack.md` §6 — la idea original (`Capacitor server.url` apuntando al backend) no es viable tal como estaba escrita; ver el post-mortem en ese documento. La solución real para desarrollo es un proxy de Vite; para el empaquetado nativo, el gap de §3 de este documento sigue abierto y sin resolver.

### Gestión dedicada de permisos asociados a roles (backend 020, 2026-09-04)

- La pantalla Ionic `/admin/roles/{roleId}/permissions` reutiliza el detalle del rol como snapshot completo y `GET /api/permisos` como catálogo global paginado; no existe catálogo RBAC hardcodeado en el bundle.
- La ruta exige conjuntamente `roles.read`, `roles.manage` y `permisos.read`. El backend conserva la autoridad por endpoint y por alcance organizacional.
- `PATCH /api/roles/{roleId}/permisos?organizationId={uuid}` recibe exclusivamente `{ permissionIds: UUID[] únicos, expectedUpdatedAt: ISO date-time }` y reemplaza atómicamente el conjunto completo.
- Los roles `isSystem` son de solo lectura. Un actor no Administrador solo administra conjuntos que sean subconjunto de sus permisos efectivos; los recursos cross-tenant responden 404 opaco.
- Un 409 conserva el borrador y obliga a recargar. Tras éxito se actualizan las queries de roles y se invalida `['auth','session']`; el backend recompone permisos desde PostgreSQL en cada request, por lo que altas y bajas son efectivas en la siguiente petición autenticada.
- `Permission` continúa como catálogo persistido e inmutable por HTTP. No se introduce CRUD de permisos, jerarquía, dependencias o flags que el modelo no posee.
