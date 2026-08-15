# canchago-ionic

Cliente móvil oficial de Canchago (Ionic + React + TypeScript + Capacitor). Consume el backend real en [`canchago`](../canchago). Ver `spec/constitution/` para la constitución completa del proyecto (misión, stack, integración con la API) y `spec/features/` para cada feature con su spec/plan/tasks.

## Cómo correr todo en local

Asume que clonaste `canchago` (backend) y `canchago-ionic` (este repo) como carpetas hermanas, dentro de un mismo directorio padre.

### Backend (`canchago`)

```bash
cd ../canchago

# Keycloak (Docker) — si no está corriendo
docker compose up -d

# Backend Next.js
yarn dev          # http://localhost:3000
```

Postgres corre como servicio nativo del sistema (`/Library/PostgreSQL/17`), no necesita comando — ya está siempre disponible.

Si alguna vez cambias algo en `keycloak/realm-canchago.json` (clientes, usuarios, roles), Keycloak no lo relee solo — hay que recrear el contenedor:

```bash
docker compose down && docker compose up -d
```

### Frontend — modo navegador (flujo `002`, cookie)

```bash
yarn dev          # http://localhost:5173 — usa el proxy de Vite hacia el backend
```

Ábrelo en cualquier navegador normal; el login redirige a Keycloak como una web cualquiera.

### Frontend — Android (flujo `003`, formulario nativo)

```bash
# Si el emulador no está corriendo:
$ANDROID_HOME/emulator/emulator -avd Medium_Phone_API_36.0 &

# Build + sync + abrir en Android Studio
yarn android

# — o, para compilar e instalar directo en el emulador/dispositivo sin abrir Android Studio:
yarn android:run
```

Usuario de prueba: **`futbolista`** / **`canchago123`**.

### Frontend — iOS

```bash
yarn ios          # build + sync + abre Xcode
# — o —
yarn ios:run      # build + sync + corre directo en el simulador
```

⚠️ **Antes de correr en iOS**, cambia `.env.production` — hoy apunta a `10.0.2.2` (alias del emulador Android hacia tu Mac), pero el simulador de iOS necesita `localhost` directo:

```bash
# En canchago-ionic/.env.production, cambia:
VITE_API_BASE_URL=http://10.0.2.2:3000/api
# por:
VITE_API_BASE_URL=http://localhost:3000/api
```

(y `yarn build && yarn cap:sync` de nuevo antes de `yarn ios`/`yarn ios:run`).

### Verificar que todo esté arriba

```bash
curl -s -o /dev/null -w "backend: %{http_code}\n" http://localhost:3000/api/docs/spec
curl -s -o /dev/null -w "frontend dev: %{http_code}\n" http://localhost:5173/
docker ps --filter "name=canchago-keycloak" --format "{{.Status}}"
$ANDROID_HOME/platform-tools/adb devices
```

### ¿Por qué hace falta Keycloak sí o sí?

No hay forma de tener login real (usuario/contraseña verificados de verdad) sin Keycloak corriendo — es literalmente donde viven las cuentas y las contraseñas; Postgres solo guarda el perfil ya sincronizado (`User`/`UserSession`), nunca la contraseña. `BYPASS_AUTH=true` en el backend no es una alternativa a Keycloak: finge que ya iniciaste sesión sin validar nada, útil solo para probar otras pantallas asumiendo que ya estás adentro, no para probar el login en sí.

Una vez que el contenedor existe, `docker compose up -d` es idempotente (arranca si estaba detenido, no hace nada si ya está corriendo) — normalmente solo hace falta tras reiniciar la Mac o parar Docker Desktop manualmente.
