# Integración con la API — canchago-ionic ↔ canchago

_Contratos reales verificados leyendo el código de `canchago` (no la documentación OpenAPI cuando ambas discrepan — se anota explícitamente cuando eso pasa). Este documento se actualiza cada vez que una feature consume o descubre un contrato nuevo, y es el lugar donde se registran necesidades de cambio en el backend **antes** de pedir su implementación — nunca se modifica `canchago` directamente desde este proyecto._

Última verificación: 2026-08-21, contra el estado local actual de `canchago`.

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

| Recurso        | Rutas                                                                                                                                 | Métodos + permiso                                         | Notas                                                                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Auth           | `/api/auth/{login,callback,session,refresh,logout}`                                                                                   | ver §2                                                    | público excepto session/refresh/logout                                                                                                                                                                                                                             |
| Usuarios       | `/api/users`, `/api/users/{userId}`, `/api/users/{userId}/profile`, `/api/users/{userId}/roles`, `/api/users/{userId}/roles/{roleId}` | GET/POST/PATCH/DELETE, permisos `users.*`                 | DELETE es soft (status→INACTIVE); la edición básica usa el subrecurso `/profile`; lista NO incluye roles, detalle SÍ; ver quiebres reales abajo (`active`, `orderBy`)                                                                                              |
| Organizaciones | `/api/organizaciones`, `/api/organizaciones/{organizationId}`                                                                         | GET/POST/PATCH/DELETE, `organizaciones.read`/`.manage`    | **lista responde `{organizations, meta}`, NO `{data, meta}`** — el propio Swagger del backend lo documenta mal, no confiar en `GET /api/docs` para este endpoint                                                                                                   |
| Sedes          | `/api/organizaciones/{organizationId}/sedes`, `.../sedes/{sedeId}`                                                                    | GET/POST/PATCH/DELETE, mismos permisos que organizaciones | **lista responde `{venues, meta}`, NO `{data, meta}`** — mismo bug de documentación                                                                                                                                                                                |
| Roles          | `/api/roles`, `/api/roles/{roleId}`, `/api/roles/{roleId}/permisos`                                                                   | GET/POST/PATCH/DELETE, `roles.read`/`.manage`             | requieren `?organizationId=<uuid>` como query, NO como parte del path — fácil de olvidar; **nunca devuelve roles globales** (`organizationId: null`, como `Administrador`/`Futbolista`) — coincidencia estricta contra el `organizationId` dado, ver quiebre abajo |
| Permisos       | `/api/permisos`                                                                                                                       | GET, `permisos.read`                                      | catálogo global, sin CRUD                                                                                                                                                                                                                                          |
| Docs           | `/api/docs`, `/api/docs/spec`                                                                                                         | público                                                   | Swagger UI real, útil para explorar pero no 100% confiable (ver bugs de envelope arriba)                                                                                                                                                                           |

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

Códigos de error reales usados hoy: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `INTERNAL_ERROR` (500), `METHOD_NOT_ALLOWED` (405). `BUSINESS_RULE_ERROR` (422) y `TOO_MANY_REQUESTS` (429) están reservados en el backend pero **ningún endpoint los lanza todavía** — no construir UI para ellos como si existieran hoy.

## 8. Trazabilidad — estado real

El backend **no** devuelve `X-Request-ID`, `X-Correlation-ID` ni `traceparent` en ningún response (confirmado, no hay tal header en `middleware/` ni handlers). El `X-Correlation-ID` que el frontend genera (`tech-stack.md` §9) es local al cliente únicamente — no hay forma de correlacionarlo con logs del servidor hasta que el backend lo adopte. Propuesta pendiente de registrar formalmente si se vuelve necesario para soporte/diagnóstico.

## 9. Modelos relevantes hoy (identidad/RBAC)

`User` (+`UserProfile` 1:1, +`AuthAccount[]` para el vínculo OAuth, +`UserSession[]`), `Organization`, `Venue` (única por `[organizationId, name]`), `Role` (única por `[organizationId, name]`, `organizationId` nullable = rol global), `Permission` (`code` único, formato `<modulo>.<accion>`), `RolePermission`, `UserRole` (con `organizationId`/`venueId` opcionales — asignación con alcance). No hay `Cancha`/`Reserva` todavía.

## 10. Registro de cambios

_Cada vez que una feature nueva descubra o requiera un contrato distinto a lo aquí escrito, añadir una entrada fechada aquí antes de implementar._

- **2026-08-14** — Discovery inicial. Documento creado a partir de lectura directa de `canchago` (auth, middleware, `pages/api/`, `prisma/schema.prisma`, validaciones Zod, `.env.example`).
- **2026-08-21** — Feature `005-gestion-usuarios`: corrección del bug de códigos de permiso (§4, ya no reproduce, verificado en código real de `canchago`); documentados los quiebres reales de `GET /api/users` (`active=false`, `orderBy=name`, ver §6) y de `GET /api/roles` (nunca expone roles globales); registrada la dependencia de `canchago/spec/features/015-bootstrap-super-admin/` para que la protección contra escalamiento de privilegios sea real y no solo una ocultación de UI (§4).
- **2026-08-21** — Feature `007-edicion-perfil-usuario-administracion`: añadido y verificado el subrecurso administrativo `/api/users/{userId}/profile`, con DTO mínimo, permisos `users.read`/`users.update`, lista blanca estricta, protección de usuarios de sistema y concurrencia optimista mediante `profileUpdatedAt`.
- **2026-08-21** — Feature `009-perfil-ampliado-autogestion` y backend `017`: documentados los cinco métodos de perfil propio, campos opcionales, concurrencia, avatar WebP, límites y errores 413/415.
- **2026-08-14** — Feature `002-autenticacion`: contrato de auth (§2) **confirmado con prueba real** contra el backend corriendo local (Postgres nativo + Keycloak vía Docker + `yarn dev`), no solo leído. Flujo completo login → sesión → logout probado dos veces: primero con `curl` + cookie jar (usuario semilla `futbolista`/`canchago123`), después con Chrome headless real (Playwright) ejecutando el código real de `canchago-ionic`. Se corrigió la estrategia de "mismo origen" documentada en `tech-stack.md` §6 — la idea original (`Capacitor server.url` apuntando al backend) no es viable tal como estaba escrita; ver el post-mortem en ese documento. La solución real para desarrollo es un proxy de Vite; para el empaquetado nativo, el gap de §3 de este documento sigue abierto y sin resolver.
