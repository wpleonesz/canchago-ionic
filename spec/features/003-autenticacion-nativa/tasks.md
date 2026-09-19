# 003 · Autenticación nativa — Tareas

## Revisión: formulario nativo + ROPC (reemplaza la versión Authorization Code)

- [x] Eliminar `services/auth/pkce.ts`, `services/auth/nativeAuth.ts`, `features/auth/hooks/useNativeAuthListener.ts` (+ tests).
- [x] `yarn remove @capacitor/browser`.
- [x] Revertir intent-filter de `AndroidManifest.xml` y `CFBundleURLTypes` de `Info.plist`.
- [x] `src/config/env.ts`: eliminar variables OAuth sin uso.
- [x] `.env.development`/`.env.production`/`.env.example`/`.env`: quitar variables OAuth.
- [x] `src/validation/auth.ts`: `loginFormSchema` (Zod).
- [x] `src/components/forms/AppInput.tsx`: primer componente de formulario real.
- [x] `src/services/api/endpoints/auth.ts`: `loginWithPassword` reemplaza `exchangeMobileCode`.
- [x] `src/features/auth/pages/LoginPage.tsx`: reescrito con `NativeLoginForm` (RHF + Zod + `AppInput` + `IonInputPasswordToggle`) y `WebLogin`.
- [x] `src/app/App.tsx`: quitar `useNativeAuthListener`.

## Gaps de infraestructura descubiertos y corregidos (ver spec.md para el detalle)

- [x] `capacitor.config.ts`: `server.androidScheme: 'http'` (Mixed Content).
- [x] `Info.plist`: `NSAppTransportSecurity.NSAllowsArbitraryLoads` (ATS).
- [x] `AndroidManifest.xml`: `android:usesCleartextTraffic="true"`.
- [x] `canchago/proxy.ts` (nuevo, renombrado de `middleware.ts` por Next.js 16): CORS abierto en `/api/*`, incluye `X-Correlation-ID` en `Access-Control-Allow-Headers`.
- [x] `src/services/api/apiClient.ts`: `withCredentials: !Capacitor.isNativePlatform()`.

## Tests

- [x] `src/validation/auth.test.ts` (3 tests).
- [x] Suite completa sigue en verde tras la limpieza (19 tests, 8 archivos).

## Validación real (obligatoria antes de marcar la feature como hecha)

- [x] `./gradlew assembleDebug` → `BUILD SUCCESSFUL` tras cada cambio de manifiesto.
- [x] `xcodebuild ... -sdk iphonesimulator` → `BUILD SUCCEEDED`.
- [x] Emulador Android real (`Medium_Phone_API_36.0`), APK instalado, interacción real vía Chrome DevTools Protocol contra el WebView de la app instalada.
- [x] Login real (`futbolista`/`canchago123`) → `/home` con datos reales del usuario.
- [x] Logout real → vuelve a `/login`.
- [x] Persistencia real: `force-stop` + relanzar la app → entra directo a `/home` sin pedir login de nuevo.
- [x] `yarn lint && yarn typecheck && yarn test && yarn build && yarn cap:sync` sin errores.

## Cierre

- [x] Validado contra los criterios de aceptación de `spec.md`.
- [x] Roadmap actualizado con la revisión completa.

## Corrección: URL del backend en el simulador de iOS (2026-09-19)

- [x] Hallazgo: `yarn ios` construía con el modo `production` y heredaba `VITE_API_BASE_URL=http://10.0.2.2:3000/api` de `.env.production`. `10.0.2.2` es un alias exclusivo del emulador de Android; en el simulador de iOS no responde y el login falla con "No se pudo conectar con el servidor" aunque backend y Keycloak funcionen (verificado: `POST /api/auth/mobile/login` → 200 desde el host).
- [x] Solución definitiva (2026-09-19): la URL se resuelve **por plataforma en ejecución** (`resolveApiBaseUrl` en `src/config/env.ts`, con `Capacitor.getPlatform()`): `VITE_API_BASE_URL_ANDROID` (`10.0.2.2`) y `VITE_API_BASE_URL_IOS` (`localhost`), con `VITE_API_BASE_URL` de respaldo (web/dev). Un mismo build sirve para ambos emuladores sin cambios manuales; `ios`/`ios:run` vuelven a usar `vite build`. Probado con 4 pruebas nuevas.
- [ ] Verificación manual del login en el simulador de iOS y en el emulador de Android con el mismo build.
