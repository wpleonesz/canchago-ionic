# 016 · Selección de ubicación de la cancha en un mapa — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar la `constitution/`._

## Enfoque

Componente nuevo y reutilizable `LocationPickerModal` (`src/components/maps/`) que envuelve un mapa Leaflet con tiles de OpenStreetMap, montado imperativamente en un `useRef`/`useEffect` (no `react-leaflet`, para no sumar una dependencia con sus propios requisitos de versión de React sobre React 19; Leaflet vanilla es estable y ya cubre exactamente lo que se necesita: tiles, marcador arrastrable/clicable y zoom). La detección de ubicación usa `@capacitor/geolocation`, el plugin oficial, porque el usuario pidió explícitamente el flujo de permiso nativo real en vez de la API de geolocalización del navegador.

El componente es puramente de presentación: recibe `initialLatitude`/`initialLongitude` opcionales y devuelve `{ latitude, longitude }` por callback al confirmar. No conoce recursos, canchas ni Zod — se integra en `AvailabilityManagementPage.tsx` rellenando los mismos `resourceLatitude`/`resourceLongitude` que ya existen, sin tocar el resto del flujo de guardado.

## Implementación

1. **Dependencias** — agregar `leaflet` + `@types/leaflet` (dev) y `@capacitor/geolocation` a `package.json`. Verificar que no colisionan con `resolutions.@types/react` ya fijado (gotcha documentado en `tech-stack.md`).
2. **`android/app/src/main/AndroidManifest.xml`** — agregar `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />` y `ACCESS_COARSE_LOCATION`.
3. **`ios/App/App/Info.plist`** — agregar `NSLocationWhenInUseUsageDescription` con un texto claro de por qué se pide ubicación.
4. **`src/components/maps/LocationPickerModal.tsx`** — modal `IonModal` a pantalla completa: mapa Leaflet (`L.map`, `L.tileLayer` con los tiles públicos de `tile.openstreetmap.org` y su atribución obligatoria), marcador colocado/movido en el evento `click` del mapa, botón "Usar mi ubicación" (`Geolocation.requestPermissions()` → `Geolocation.getCurrentPosition()`, con manejo de permiso denegado/error sin bloquear el marcado manual), botones "Cancelar"/"Confirmar ubicación" (deshabilitado sin marcador).
5. **`src/features/bookings/pages/AvailabilityManagementPage.tsx`** — agregar el botón "Elegir en el mapa" junto a los inputs de latitud/longitud (en las dos secciones que ya comparten `resourceLatitude`/`resourceLongitude`/`resourceLongitude`: editar cancha existente y crear cancha nueva), estado local `showLocationPicker`, y el callback de confirmación que llama a `setResourceLatitude`/`setResourceLongitude` con el resultado.
6. **`yarn cap:sync`** — sincronizar el nuevo plugin nativo con Android/iOS.
7. **Build nativo** — `gradlew assembleDebug` (Android) para confirmar que el plugin y el permiso quedan empaquetados correctamente, igual que se hizo en la feature `003` al agregar un flujo con requisitos nativos nuevos.

## Decisiones

- **Leaflet vanilla en vez de `react-leaflet`** — evita una dependencia adicional con acoplamiento a una versión específica de React; el caso de uso (un mapa, un marcador, un click) no necesita el modelo declarativo de `react-leaflet`.
- **`@capacitor/geolocation` en vez de `navigator.geolocation`** — decisión explícita del usuario: quiere el flujo de permiso nativo real de Android/iOS, no el genérico del navegador.
- **Modal a pantalla completa en vez de mapa embebido** — decisión explícita del usuario: mejor usabilidad en un formulario largo dentro de un acordeón.
- **No se retiran los campos numéricos de latitud/longitud** — se mantienen como alternativa manual y como forma de ver/confirmar el valor exacto elegido en el mapa; el mapa solo los rellena.
- **Sin geocoding por dirección** — no hay backend propio para eso y agregar un proveedor de terceros con API key excede el pedido original ("detectar ubicación o marcarla yo mismo").

## Riesgos

- **Los tiles de `tile.openstreetmap.org` tienen una política de uso pública que exige atribución visible y desaconseja tráfico de producción a gran escala** — se incluye la atribución en el mapa; si el volumen de uso crece, evaluar un proveedor de tiles dedicado en una feature aparte (fuera de alcance aquí).
- **Permisos nativos nuevos requieren rebuild real, no solo `cap sync`** — mitigado ejecutando `gradlew assembleDebug` como parte del cierre, igual que la feature `003`.
- **Leaflet manipula el DOM directamente y puede chocar con el ciclo de vida de React/Ionic (montaje/desmontaje del modal)** — mitigado inicializando el mapa en un `useEffect` que se dispara solo cuando el modal está abierto y destruyéndolo (`map.remove()`) en el cleanup.
- **jsdom (Vitest) no soporta Leaflet realmente (canvas/DOM de tiles)** — las pruebas se enfocan en la lógica del componente que no depende del render real del mapa (mockeando `leaflet` y `@capacitor/geolocation`), no en verificar píxeles del mapa.
