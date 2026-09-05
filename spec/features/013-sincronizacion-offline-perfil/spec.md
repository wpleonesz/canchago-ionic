# 013 · Sincronización offline del contacto de perfil (patrón Outbox)

**Estado:** en curso — código implementado y verificado con lint/typecheck/test/build/`cap:sync` y un build headless real de Android (`gradlew assembleDebug`, `BUILD SUCCESSFUL`, con los plugins nativos nuevos empaquetados). Falta la verificación manual interactiva en un emulador/dispositivo real (requiere el backend `canchago` corriendo), no realizada en esta sesión.

## Qué hace

En "Mi perfil", si el dispositivo está sin conexión (o el guardado falla por red/timeout/error de servidor), el cambio de celular/enlaces sociales no se pierde ni bloquea al usuario: se guarda localmente y la pantalla muestra "Pendiente de sincronizar". Al recuperar conexión (o al reabrir la pantalla), la app reintenta automáticamente hasta confirmar el guardado real contra el servidor, mostrando en todo momento el estado (offline / pendiente / sincronizando / sincronizado / error). Si el perfil cambió en el servidor mientras el cambio estaba pendiente, la app nunca sobrescribe en silencio: pide al usuario decidir explícitamente entre reintentar con los datos frescos o descartar el cambio pendiente.

## Por qué

Es el primer ejemplo didáctico de offline-first del proyecto, sobre una operación real y de bajo riesgo (contacto opcional del propio usuario — no identidad, RBAC ni pagos) que ya existe online (feature `009`, "Hecho") y no requiere modificar el backend `canchago`.

## Contrato de API consumido

_Verificado leyendo `canchago` directamente: `pages/api/profile/index.ts`, `validations/users/index.ts` (`updateOwnProfileSchema`), `services/users/index.ts` (`updateOwnProfile`) y `database/users/index.ts` (`userProfile.updateMany({ where: { userId, updatedAt: expectedProfileUpdatedAt } })`). Ya documentado en `../../constitution/api-integration.md` §6 "Perfil propio ampliado"._

- `PATCH /api/profile` — sesión autenticada, sin permisos administrativos — body `{ phone?, facebookUrl?, instagramUrl?, linkedinUrl?, xUrl?, githubUrl?, tiktokUrl?, websiteUrl?, expectedProfileUpdatedAt }` (`.strict()`, al menos un campo opcional presente) — 200 con el `OwnUserProfileDto` actualizado, o `409 CONFLICT` si `expectedProfileUpdatedAt` no coincide con la fila real (concurrencia optimista).
- **El backend no soporta ningún header/campo de idempotencia (`Idempotency-Key` o equivalente)** — confirmado leyendo el código real, no se asume ni se inventa soporte inexistente. Ver "Fuera de alcance" y `api-integration.md` §6.

## Criterios de aceptación

- [x] Con la app sin red, guardar contacto en "Mi perfil" no falla: se refleja optimistamente y queda "Pendiente de sincronizar".
- [x] Al recuperar conexión, la app sincroniza automáticamente sin acción del usuario.
- [x] Reabrir "Mi perfil" también dispara un intento de sincronización si hay algo pendiente.
- [x] Un error de red/timeout/servidor programa reintentos con backoff exponencial creciente (con jitter), visibles como "Reintentando…", con un tope de intentos automáticos tras el cual se ofrece reintento manual.
- [x] Un error de validación/autenticación/autorización nunca se reintenta automáticamente.
- [x] Un conflicto (409) nunca sobrescribe: exige una decisión explícita del usuario, con ambas opciones (reintentar con datos frescos / descartar) disponibles.
- [x] Una sincronización interrumpida (fila `syncing` huérfana) se recupera al reabrir sin duplicar el cambio — en el peor caso produce un 409 "fallo seguro", nunca una escritura duplicada.
- [x] No se guarda ningún token/credencial en SQLite; el token de sesión sigue solo en `capacitor-secure-storage`.
- [x] Compila y empaqueta en un build nativo real (Android, `gradlew assembleDebug` → `BUILD SUCCESSFUL`, con `@capacitor-community/sqlite`/`@capacitor/network` incluidos).
- [ ] Validado interactivamente en un emulador/dispositivo real (pérdida de conexión, sincronización, conflicto) — pendiente, requiere el backend `canchago` corriendo; ver `tasks.md` y `plan.md` §Riesgos.

### Contratos y tipos (obligatorio)

- [x] Los tipos TypeScript de la fila del Outbox (`src/services/offline/outboxTypes.ts`) reflejan exactamente las columnas de la tabla local, sin `any`. No hay contrato de servidor nuevo: se reutiliza `UpdateOwnUserProfileRequest`/`OwnUserProfileDto` ya definidos en `src/types/api/users.ts`.
- [x] La limitación de idempotencia del backend está documentada en `../../constitution/api-integration.md` §6.

## Fuera de alcance

- Modificar `canchago` para agregar soporte real de `Idempotency-Key` — se documenta la necesidad, no se implementa sin instrucción explícita del usuario.
- Offline para cualquier otra pantalla/operación (avatar, administración, listados) — solo el contacto de "Mi perfil".
- Sincronización en background fuera de que la app esté abierta (background fetch/WorkManager/BackgroundTasks) — la sincronización ocurre mientras la app está en primer plano (al reconectar o al abrir la pantalla), no como servicio en segundo plano del sistema operativo.
- Resolución de conflicto campo-por-campo (merge) — solo binario reintentar-todo-con-datos-frescos vs. descartar-todo.
- Soporte web/PWA (`jeep-sqlite`) — la app nunca se distribuye como web; `yarn dev` en navegador no puede tocar la base SQLite real (ver `tech-stack.md` §13).
