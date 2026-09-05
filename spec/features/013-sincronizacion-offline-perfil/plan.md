# 013 · Sincronización offline del contacto de perfil — Plan

_Cómo se implementa lo descrito en `spec.md`. Respeta `constitution/tech-stack.md`._

## Enfoque

Patrón Outbox clásico sobre SQLite nativo (`@capacitor-community/sqlite`): cada intento de guardar el contacto del perfil propio que no puede completarse en el momento (sin red, o falla con un error reintentable) se registra como una única fila local por usuario, y un motor de sincronización la procesa cuando hay red — reutilizando el mismo `updateOwnProfile()` del camino online, sin duplicar lógica HTTP. El backend no cambia: solo tiene concurrencia optimista (`expectedProfileUpdatedAt`), no idempotencia por clave de cliente, así que el diseño trata el UUID del cliente como identidad **local** del intent (dedup de reintentos, recuperación tras matar la app) y confía en que una reaplicación tras éxito falla de forma segura con 409, nunca duplica.

## Implementación

_Capas de `tech-stack.md` §2: types → services/offline (equivalente a `services/api` para el dominio local) → stores → hooks de feature → componentes/páginas._

1. **`src/services/offline/outboxTypes.ts`** — `OutboxStatus`, `OutboxIntentRow` (1:1 con las columnas SQL), `OwnProfileOutboxInput` (los mismos 8 campos + `expectedProfileUpdatedAt`).
2. **`src/services/offline/migrations.ts`** — `OUTBOX_DB_NAME`, `OUTBOX_DB_VERSION`, `OUTBOX_MIGRATIONS: capSQLiteVersionUpgrade[]` con la migración `toVersion: 1` (CREATE TABLE + índice). Forward-only: una futura evolución del esquema agrega `{ toVersion: 2, statements: [...] }`, nunca edita la entrada 1 ni hace DROP+CREATE.
3. **`src/services/offline/db.ts`** — `getOutboxDb()`, singleton `SQLiteConnection` (`addUpgradeStatement` → `createConnection`/`retrieveConnection` → `open()`), rechaza explícitamente en web (`!Capacitor.isNativePlatform()`).
4. **`src/services/offline/outboxRepository.ts`** — único lugar con SQL: `upsertOwnProfileIntent` (coalescing a una fila activa), `getActiveIntent`, `getDueIntents`, `markSyncing`, `markSynced` (borra la fila), `markConflict`, `markError`, `resetToPending` (retry manual), `deleteIntent`.
5. **`src/services/offline/retryPolicy.ts`** — `isRetryableError(error: AppClientError)`, `computeNextAttempt(attemptCount)` (backoff exponencial + full jitter), `MAX_AUTO_ATTEMPTS`.
6. **`src/services/offline/syncEngine.ts`** — `processOwnProfileOutbox(queryClient)`: lee el intent activo/vencido vía el repositorio, llama a `updateOwnProfile()` (de `src/services/api/endpoints/users.ts`, sin tocarlo), y según el resultado marca `synced`/programa reintento/`conflict`/`error`; actualiza `outboxStore` y, en éxito, `queryClient.setQueryData(OWN_PROFILE_QUERY_KEY, ...)` igual que `useUpdateOwnProfile`. Recupera filas `syncing` huérfanas (>30s) al iniciar.
7. **`src/services/offline/networkMonitor.ts`** — `initNetworkMonitor(queryClient)` vía `@capacitor/network`: sincroniza `networkStore.isOnline` y dispara `processOwnProfileOutbox` al pasar de offline→online.
8. **`src/store/networkStore.ts`** / **`src/store/outboxStore.ts`** — Zustand imperativo, mismo patrón que `sessionStore.ts` (permite que código no-React como `networkMonitor.ts`/`syncEngine.ts` escriba estado sin hooks).
9. **`src/hooks/useNetworkStatus.ts`** — wrapper de lectura de `networkStore` para componentes.
10. **`src/features/users/hooks/useOwnProfileOutbox.ts`** — puente React↔offline: `activeIntent` (vía `outboxStore`), `enqueue(input)`, `retryNow()`, `keepMineAfterConflict()`, `discardPending()`; hace la actualización optimista de `OWN_PROFILE_QUERY_KEY` al encolar.
11. **`src/features/users/components/OutboxStatusBanner.tsx`** — presentacional: 5 estados (offline/pendiente/sincronizando/sincronizado/error) + diálogo de conflicto reutilizando `AppConfirmDialog`/`AppInteractionAlert` (no una UI de notificación paralela).
12. **`src/app/App.tsx`** — un `useEffect` más: `void initNetworkMonitor(queryClient)`, junto al ya existente de `usePreferencesStore`.
13. **`src/features/users/pages/OwnProfilePage.tsx`** — `submit` intenta el camino online normal; si `useNetworkStatus()` es `false` o la mutación lanza `NetworkError`/`TimeoutError`, delega a `useOwnProfileOutbox().enqueue()` en vez de mostrar error; renderiza `<OutboxStatusBanner />`. No toca `UserPreferencesSection`/`Prompt` (trabajo no relacionado ya presente en el árbol).
14. **`OwnProfileForm.tsx`** — prop opcional `readOnly` (bloquea edición mientras `status === 'conflict'`), sin cambios de contrato en `onSubmit`.
15. **`package.json`** — `@capacitor-community/sqlite@8.1.1`, `@capacitor/network@8.0.1`.
16. **`../../constitution/api-integration.md`** — nota en §6 "Perfil propio ampliado" documentando la ausencia de `Idempotency-Key`.

No se toca `src/services/api/endpoints/users.ts` ni `src/features/users/hooks/useOwnProfile.ts` (se reutilizan tal cual) ni el repositorio `canchago`.

## Decisiones

- **Snapshot completo de los 8 campos, no un diff parcial** — evita ambigüedad "campo no tocado vs. campo vaciado a null"; coincide exactamente con lo que `OwnProfilePage.tsx` ya envía hoy en el camino online.
- **Coalescing a una sola fila activa por usuario** — una segunda edición offline actualiza la misma fila (reinicia `attempt_count`, mantiene `id`) en vez de crear una nueva; evita colas fantasma y conflictos consigo mismo. Alternativa descartada: cola FIFO de múltiples intents — innecesaria para un formulario de un solo registro por usuario y añadiría complejidad de "cuál es el vigente" sin beneficio real aquí.
- **`'no-encryption'` en `createConnection`** — la tabla nunca guarda tokens/credenciales, solo los campos de contacto que el propio usuario ya ve en pantalla; el token de sesión sigue exclusivamente en `capacitor-secure-storage` (sin cambios).
- **Backoff exponencial con *full jitter*** (`delayMs = random(0, min(5min, 5s·2^intentos))`, 8 intentos automáticos) — evita reintentos sincronizados si varios dispositivos reconectan a la vez; tras agotar el cupo, reintento manual explícito sin perder la fila.
- **Fila `conflict` se conserva (no se borra) hasta decisión explícita**; fila `synced` se borra inmediatamente (el badge "Sincronizado" es efímero, vive en `outboxStore`, no se relee de SQLite) — la tabla solo contiene lo verdaderamente pendiente/problemático.
- **Solo nativo, sin `jeep-sqlite`** — la app nunca se distribuye como web/PWA (`tech-stack.md` §13); cada feature previa se validó con builds headless reales (Android/iOS), no en navegador. `yarn dev` sigue sirviendo para UI que no dependa de la base local.
- **ObjectBox descartado** — no existe plugin Capacitor/Ionic para JS; exigiría escribir y mantener un puente nativo Android/iOS a medida, desproporcionado para un ejemplo pequeño y didáctico.
- **UUID de cliente = identidad local, no idempotencia de servidor** — el backend no soporta `Idempotency-Key`; se documenta como limitación real (`api-integration.md`), no se simula soporte inexistente. Se confía en que la concurrencia optimista ya existente convierte una posible reaplicación en un 409 seguro.

## Riesgos

- **409 "fantasma" tras matar la app a medio-envío** — si el PATCH sí llegó al servidor pero la respuesta se perdió, el reintento automático recibirá 409 aunque el dato ya esté guardado. Mitigación: se trata igual que cualquier conflicto real (nunca sobrescribe, pide decisión explícita) — es el "fallo seguro" documentado, no una pérdida de datos.
- **Sin verificación en emulador/dispositivo real en este entorno** — no hay Android/iOS disponible para ejecutar el build headless ni la prueba manual de pérdida de conexión real. Mitigación: se documenta explícitamente como pendiente (no se marca "Hecho" en `roadmap.md` sin esto, siguiendo el precedente de la feature `008`); `yarn lint/typecheck/test/build` y `yarn cap:sync` sí se ejecutan y deben pasar limpios.
- **Doble tabla de verdad (SQLite + `outboxStore` en memoria)** — riesgo de desincronización si `outboxStore` no se actualiza en cada transición. Mitigación: todas las escrituras de estado pasan por `syncEngine.ts`/`outboxRepository.ts`, que actualizan ambos en el mismo punto; `useOwnProfileOutbox` relee `getActiveIntent()` al montar la página para autocorregir si la app se abrió después de un cambio hecho por el motor en background.
