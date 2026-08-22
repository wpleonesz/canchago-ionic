# Canchago Ionic — cliente móvil

Aplicación oficial de Canchago construida con Ionic React, TypeScript y Capacitor. Consume la API del repositorio hermano [`canchago`](../canchago/README.md); no implementa reglas de negocio. El navegador permite iterar con rapidez, pero el producto se empaqueta para Android e iOS.

> Estado actual: están implementados login/sesión, protección por roles/permisos y una pantalla inicial. La API aún no ofrece recursos reservables ni reservas.

## Arquitectura

```text
Ionic React (pages/components)
        │ hooks + TanStack Query / Zustand
        ▼
services/api (Axios) ─────► canchago :3000 ─► PostgreSQL + Keycloak
        │
        └── token nativo: Secure Storage (Keychain / Keystore)
```

En navegador, Vite sirve `http://localhost:5173` y proxya `/api` a la API, lo que permite cookies `HttpOnly` de mismo origen. En Capacitor, la app usa una URL absoluta, login nativo y un token Bearer almacenado con `@aparajita/capacitor-secure-storage`.

Stack verificado: Ionic React 8, React 19, TypeScript 5.9, Vite 5, Capacitor 8.5, React Router 5, TanStack Query 5, Zustand, Axios, React Hook Form, Zod 4, Vitest/Cypress y Yarn 3.6.4.

## Qué necesita instalar

### Obligatorio, incluso si trabaja solo en navegador

- Git.
- Node.js 22 o posterior. Capacitor CLI 8.5 declara `node >=22`.
- Corepack. El repositorio fija Yarn 3.6.4 en `.yarnrc.yml`; no use npm ni pnpm.
- El backend `canchago`, PostgreSQL y Keycloak configurados según su [README](../canchago/README.md).

```bash
git --version
node --version       # v22 o superior
corepack --version
yarn --version       # dentro del repo: 3.6.4
```

Si hace falta, ejecute `corepack enable` y vuelva a abrir la terminal.

### Ionic CLI y Capacitor CLI: qué debe instalar realmente

Ionic y Capacitor no se instalan de la misma manera en este proyecto:

| Herramienta                      | ¿Debe instalarla globalmente? | Cómo se obtiene aquí                                                         |
| -------------------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| Ionic Framework (`@ionic/react`) | No                            | `yarn install` la instala como dependencia del proyecto                      |
| Ionic CLI (`ionic`)              | No se requiere                | El repositorio usa Vite directamente mediante `yarn dev` y `yarn build`      |
| Capacitor CLI (`cap`)            | No                            | `yarn install` instala `@capacitor/cli` 8.5.0 como dependencia de desarrollo |
| Capacitor Android/iOS            | No globalmente                | `yarn install` instala `@capacitor/android` y `@capacitor/ios` 8.5.0         |

Por tanto, **no ejecute** `npm install -g @ionic/cli` ni `npm install -g @capacitor/cli` para preparar este repositorio. Una instalación global podría usar una versión distinta de la fijada en `yarn.lock`. Los scripts `yarn android:run`, `yarn ios` y `yarn cap:sync` resuelven automáticamente el ejecutable local `cap`.

Después de `yarn install`, compruebe la CLI local de Capacitor:

```bash
yarn cap --version      # debe mostrar 8.5.0
```

No existe un comando `ionic` necesario para el flujo normal. Sus equivalencias en este proyecto son:

| Tarea habitual de Ionic  | Comando real del repositorio |
| ------------------------ | ---------------------------- |
| Servidor de desarrollo   | `yarn dev`                   |
| Build web para Capacitor | `yarn build`                 |
| Sincronizar plataformas  | `yarn cap:sync`              |
| Ejecutar Android         | `yarn android:run`           |
| Abrir iOS                | `yarn ios`                   |

### Adicional para Android

- Android Studio y Android SDK Platform 36 (el proyecto compila y apunta a API 36).
- JDK 21 (`android/app/capacitor.build.gradle`).
- Un emulador Android API 24 o superior, o un dispositivo con depuración USB; `minSdkVersion` es 24.
- Variables `JAVA_HOME` y `ANDROID_HOME` correctamente configuradas por su instalación.

```bash
java -version           # Java 21
echo "$JAVA_HOME"
echo "$ANDROID_HOME"
$ANDROID_HOME/platform-tools/adb version
```

El wrapper versionado descarga Gradle 8.14.3; no instale Gradle globalmente.

### Adicional para iOS

- Una Mac con Xcode y sus Command Line Tools. Xcode no está disponible en Windows/Linux.
- Un simulador o dispositivo iOS 15 o posterior; el proyecto fija iOS 15 como mínimo.

```bash
xcodebuild -version
xcrun simctl list devices available
```

Capacitor integra plugins mediante Swift Package Manager; este repositorio no requiere CocoaPods para su configuración actual. Para firmar/instalar en un iPhone real también necesita configurar un equipo de desarrollo en Xcode.

## Instalación inicial

### 1. Obtener y ubicar los repositorios

```bash
git clone <URL-DEL-BACKEND> canchago
git clone <URL-DEL-FRONTEND> canchago-ionic
cd canchago-ionic
```

Las carpetas hermanas permiten que los enlaces funcionen, pero no son un requisito de ejecución. Los comandos siguientes se ejecutan desde `canchago-ionic/`.

### 2. Instalar dependencias

```bash
yarn install
yarn cap --version
yarn typecheck
```

Yarn restaura el lockfile e instala Ionic React, Capacitor y el resto de las dependencias dentro del proyecto. `yarn cap --version` comprueba que Capacitor CLI local está disponible y `typecheck` confirma que TypeScript puede resolver la instalación.

### 3. Configurar la API

El repositorio versiona valores no secretos por modo:

- `.env.development`: `VITE_API_BASE_URL=/api`; Vite lo proxya a `http://localhost:3000`.
- `.env.production`: `http://10.0.2.2:3000/api`, apropiado solo para un emulador Android local.
- `.env.example`: plantilla genérica para otros entornos.

`VITE_API_TIMEOUT_MS` es opcional y vale 15000 ms en los ejemplos. Toda variable `VITE_*` queda pública dentro del bundle: nunca coloque tokens, contraseñas ni secretos OAuth allí.

Para una URL personal sin modificar los archivos compartidos, cree el archivo local ignorado correspondiente, por ejemplo:

```bash
cp .env.example .env.local
```

Edite `VITE_API_BASE_URL` de acuerdo con el destino descrito en la sección nativa. `src/config/env.ts` valida la URL base y el timeout al iniciar.

## Desarrollo en navegador

### 1. Levantar el sistema en orden

Antes de iniciar el cliente por primera vez, el backend debe tener aplicadas sus migraciones y semillas. Desde `canchago/`, ejecute al menos una vez:

```bash
yarn migrate-dev
yarn seed
yarn seed-dev
```

Las semillas crean permisos y roles, pero el primer Administrador requiere además iniciar sesión una vez, ejecutar `yarn asignar-rol` y volver a autenticarse. Siga el procedimiento completo en [“Aplicar migraciones y ejecutar las semillas obligatorias”](../canchago/README.md#6-aplicar-migraciones-y-ejecutar-las-semillas-obligatorias). Sin este bootstrap, el login puede funcionar pero las operaciones administrativas responderán `403`.

```bash
# Terminal 1, desde canchago/
docker compose up -d
yarn dev

# Terminal 2, desde canchago-ionic/
yarn dev
```

### 2. Verificar

```bash
curl -s -o /dev/null -w 'backend: %{http_code}\n' http://localhost:3000/api/docs/spec
curl -s -o /dev/null -w 'frontend: %{http_code}\n' http://localhost:5173/
```

Ambos deben responder `200`. Abra `http://localhost:5173`. El botón de login redirige a Keycloak; puede usar una cuenta didáctica documentada en el README backend. Vite exige el puerto 5173 (`strictPort: true`), por lo que falla en vez de elegir otro si está ocupado.

Detenga cada servidor con `Ctrl+C`; Keycloak puede detenerse desde el backend con `docker compose stop`.

## Android

### Elegir la URL correcta

`localhost` siempre significa “esta máquina” desde el proceso que lo interpreta:

| Ejecución                  | URL del backend local                   |
| -------------------------- | --------------------------------------- |
| Navegador en el computador | `/api` mediante proxy Vite              |
| Emulador Android estándar  | `http://10.0.2.2:3000/api`              |
| Dispositivo Android físico | `http://IP-LAN-DEL-COMPUTADOR:3000/api` |

Para un dispositivo físico, computador y teléfono deben estar en la misma red y el firewall debe permitir el puerto 3000. No use `0.0.0.0` como URL del cliente: es una dirección de escucha, no de destino. En producción use HTTPS.

### Ejecutar la app: por qué usamos solo `yarn android:run`

Con el backend y un emulador/dispositivo activos:

```bash
yarn android:run
```

Este es el comando habitual y único para ejecutar Android durante el laboratorio porque realiza el flujo completo en orden:

1. `vite build` genera el bundle web actualizado en `dist/` usando el entorno de producción local.
2. `cap sync android` copia ese bundle y la configuración al proyecto nativo, y sincroniza los plugins.
3. `cap run android` compila, instala y abre la aplicación en el emulador o dispositivo detectado.

Usar siempre `yarn android:run` evita tres errores frecuentes: ejecutar una versión antigua de `dist/`, olvidar sincronizar un plugin y abrir Android Studio sin haber reconstruido la aplicación. Además, produce el mismo procedimiento reproducible para todos los estudiantes y permite detectar fallos desde la terminal.

El script `yarn android` también existe, pero termina abriendo Android Studio y exige seleccionar y ejecutar manualmente la configuración `app`; no se usa en el flujo normal del laboratorio. Android Studio sigue siendo obligatorio para instalar el SDK, crear/administrar emuladores e investigar errores nativos. `yarn android:open` se reserva únicamente para ese diagnóstico manual.

Para comprobar conexión:

```bash
$ANDROID_HOME/platform-tools/adb devices
```

El proyecto permite HTTP local mediante `androidScheme: 'http'` y `usesCleartextTraffic`; son excepciones de desarrollo. Un backend desplegado debe usar HTTPS.

## iOS

El simulador iOS puede alcanzar el backend del Mac mediante `localhost`, a diferencia de Android. Cree `.env.production.local` para sobreescribir el valor Android sin editar el archivo compartido:

```bash
cp .env.example .env.production.local
# Edite VITE_API_BASE_URL y déjela como http://localhost:3000/api
yarn ios
```

El script construye, sincroniza y abre Xcode. Elija un simulador/equipo y ejecute `App`. Para ejecución directa:

```bash
yarn ios:run
```

En un iPhone físico use la IP LAN del Mac, configure la firma y confirme que el backend escucha en una interfaz alcanzable. `Info.plist` permite HTTP para laboratorio mediante `NSAllowsArbitraryLoads`; elimine esa excepción al desplegar con HTTPS.

## Flujo diario

Para UI web: levante backend/Keycloak y ejecute `yarn dev`. Antes de integrar:

```bash
yarn lint
yarn typecheck
yarn test
yarn build
```

Tras cambiar código o plugins que deben llegar a las plataformas nativas:

```bash
yarn build
yarn cap:sync
```

### Estado de validación conocido

En la revisión documental del 21 de agosto de 2026, `yarn lint`, `yarn typecheck`, `yarn test` (27/27 pruebas) y `yarn build` terminaron correctamente. Vite advirtió que los bundles principales superan 500 kB, lo cual no bloquea el build. `yarn test:e2e` no pudo iniciar Cypress 13.17.0 en el macOS ARM usado para validar (`bad option: --no-sandbox/--smoke-test`); existen `cypress.config.ts` y una prueba E2E, así que es un problema de compatibilidad local del binario, no la ausencia del script.

No edite archivos generados dentro de `android/app/src/main/assets/public/` o `ios/App/App/public/`; Capacitor los reemplaza al sincronizar. Siga el proceso spec-driven definido en `AGENTS.md` y `spec/`.

## Estructura

| Ruta                                   | Responsabilidad                    |
| -------------------------------------- | ---------------------------------- |
| `src/features/`                        | Funcionalidad agrupada por dominio |
| `src/pages/` y `src/routes/`           | Pantallas y navegación             |
| `src/services/api/`                    | Única puerta HTTP hacia backend    |
| `src/services/storage/`                | Preferencias y token seguro        |
| `src/config/env.ts`                    | Validación de variables Vite       |
| `src/store/`                           | Estado de sesión Zustand           |
| `android/` / `ios/`                    | Proyectos nativos Capacitor        |
| `spec/constitution/api-integration.md` | Contratos backend verificados      |
| `spec/features/`                       | Spec, plan y tareas por feature    |

## Comandos

| Comando                               | Función                                                      |
| ------------------------------------- | ------------------------------------------------------------ |
| `yarn dev`                            | Vite en 5173 con recarga y proxy API                         |
| `yarn build`                          | TypeScript + bundle Vite en `dist/`                          |
| `yarn preview`                        | Previsualiza el bundle; no reemplaza pruebas nativas         |
| `yarn lint`                           | ESLint                                                       |
| `yarn typecheck`                      | TypeScript sin emisión                                       |
| `yarn format` / `yarn format:check`   | Escribe / comprueba Prettier                                 |
| `yarn test` / `yarn test:watch`       | Vitest una vez / observación                                 |
| `yarn test:e2e`                       | Suite Cypress configurada por el proyecto                    |
| `yarn cap:sync`                       | Copia bundle/config y actualiza plugins nativos              |
| `yarn android:run`                    | Flujo habitual: build, sync, compila, instala y abre Android |
| `yarn android` / `yarn android:open`  | Uso diagnóstico: abre Android Studio                         |
| `yarn ios` / `yarn ios:run`           | Abre Xcode / ejecuta iOS                                     |
| `yarn android:open` / `yarn ios:open` | Abre el proyecto sin reconstruir                             |

## Solución de problemas

### Vite dice que 5173 está ocupado

Use `lsof -i :5173`, detenga el proceso anterior y reintente. No cambie el puerto silenciosamente: el proxy y las redirecciones dependen del entorno esperado.

### `Network Error`, timeout o `ERR_CONNECTION_REFUSED`

Pruebe primero `http://localhost:3000/api/docs/spec` en el computador. Luego confirme la URL por plataforma, `adb devices` o el simulador, red/firewall y que la IP LAN no cambió.

### CORS o preflight falla

En navegador use `/api` y el proxy, no una URL cross-origin. En nativo confirme que el backend actual ejecuta `proxy.ts` y acepta `Authorization`/`X-Correlation-ID`. No habilite cookies (`withCredentials`) junto con origen `*`.

### Login funciona en navegador pero no en Android/iOS

Son flujos distintos: web usa Keycloak/cookie; nativo usa `/auth/mobile/login` y Bearer. Compruebe Keycloak, `OAUTH_MOBILE_CLIENT_ID`, URL absoluta y almacenamiento seguro; reconstruya y sincronice tras cambiar entorno.

### Android solicita SDK/JDK incompatible

Instale SDK Platform 36 y use JDK 21. Revise `java -version`, `JAVA_HOME`, `ANDROID_HOME` y el SDK configurado por Android Studio. No edite `android/local.properties` con rutas de otra máquina.

### iOS no compila o no firma

Abra el proyecto con `yarn ios:open`, seleccione un equipo de firma para dispositivo real y deje que Swift Package Manager resuelva dependencias. Confirme Xcode y un target iOS ≥15.

### El cambio no aparece en la app nativa

`yarn dev` solo actualiza el navegador. Para Android ejecute nuevamente `yarn android:run`; para iOS use `yarn ios:run`. Si solo necesita sincronizar sin ejecutar, use `yarn build && yarn cap:sync`.

## Seguridad y límites

- Nunca almacene sesión en `localStorage`/`sessionStorage` ni secretos en `VITE_*`.
- Las excepciones HTTP nativas son solo para desarrollo; producción debe usar HTTPS y políticas de transporte restrictivas.
- El flujo móvil ROPC fue aceptado para esta feature, pero requiere reevaluación de seguridad antes de producción.
- No invente endpoints: contraste `spec/constitution/api-integration.md` con el backend real.
