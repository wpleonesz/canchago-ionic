# 013 · Sincronización offline del contacto de perfil — Tareas

_Checklist accionable derivada del `plan.md`._

- [x] `src/services/offline/outboxTypes.ts` — tipos de la fila del Outbox.
- [x] `src/services/offline/migrations.ts` — migración `toVersion: 1`, forward-only.
- [x] `src/services/offline/db.ts` — singleton de conexión SQLite, solo nativo.
- [x] `src/services/offline/outboxRepository.ts` — todo el SQL encapsulado (coalescing, due intents, transiciones de estado).
- [x] `src/services/offline/retryPolicy.ts` — backoff exponencial + full jitter, clasificación reintentable/terminal.
- [x] `src/services/offline/syncEngine.ts` — motor de sincronización, reutiliza `updateOwnProfile()`.
- [x] `src/services/offline/networkMonitor.ts` — detección de red vía `@capacitor/network`.
- [x] `src/store/networkStore.ts` / `src/store/outboxStore.ts` — stores Zustand imperativos.
- [x] `src/hooks/useNetworkStatus.ts` — hook de lectura de conectividad.
- [x] `src/features/users/hooks/useOwnProfileOutbox.ts` — puente React↔offline, optimistic update.
- [x] `src/features/users/components/OutboxStatusBanner.tsx` — estados + diálogo de conflicto.
- [x] `src/app/App.tsx` — inicializa `initNetworkMonitor`.
- [x] `src/features/users/pages/OwnProfilePage.tsx` — integra encolado offline y el banner.
- [x] `src/features/users/components/OwnProfileForm.tsx` — prop `readOnly` para bloqueo durante conflicto.
- [x] Pruebas unitarias junto a cada archivo de `src/services/offline/` y de los stores/hooks nuevos.

## Contratos y tipos (obligatorio)

_Debe completarse en paralelo con la integración del endpoint, no como paso final._

- [x] `outboxTypes.ts` sin `any`, columnas 1:1 con el esquema SQL de `plan.md`. No hay contrato de servidor nuevo — se reutilizan `UpdateOwnUserProfileRequest`/`OwnUserProfileDto` de `src/types/api/users.ts`.
- [x] `../../constitution/api-integration.md` §6 documenta la ausencia de `Idempotency-Key` en el backend.
- [x] Nada nuevo que verificar contra `/api/docs`: el contrato de `PATCH /api/profile` ya estaba documentado y sin cambios.

## Cierre

- [x] Validar contra los criterios de aceptación de `spec.md` (todos cumplidos salvo la verificación en build nativo real, sin emulador/dispositivo disponible en este entorno).
- [x] `yarn lint && yarn typecheck && yarn test && yarn build` sin errores.
- [x] `yarn cap:sync` sin errores; `@capacitor-community/sqlite` y `@capacitor/network` aparecen en `android/app/src/main/assets/capacitor.plugins.json` y en el `Podfile` de iOS.
- [x] Build headless Android (`gradlew assembleDebug`) real — `BUILD SUCCESSFUL`, incluye `@capacitor-community/sqlite`/`@capacitor/network` empaquetados y verificados en `capacitor.plugins.json`.
- [ ] Verificación manual en emulador (pérdida de conexión, edición offline, reconexión, sincronización, conflicto, error terminal, kill de app a medio-envío) — **pendiente**. Hay AVDs disponibles (`Medium_Phone_API_36.0`, `Pixel_Tablet`) pero ninguno corriendo, y el flujo requiere una sesión real contra el backend `canchago` (Postgres + Keycloak + Next.js) — no se levantó esa infraestructura en esta sesión por ser un cambio de alcance mayor no solicitado. Queda para una sesión con el backend real corriendo.
- [ ] Mover `013` a "Hecho ✅" en `../../constitution/roadmap.md` **solo** cuando la verificación manual anterior se complete; hasta entonces permanece en "Siguiente 🔜" con este pendiente explícito.
