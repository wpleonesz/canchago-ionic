# 016 · Selección de ubicación de la cancha en un mapa — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

- [x] Agregar `leaflet`, `@types/leaflet` y `@capacitor/geolocation` a `package.json`.
- [x] Agregar permisos de ubicación a `android/app/src/main/AndroidManifest.xml`.
- [x] Agregar `NSLocationWhenInUseUsageDescription` a `ios/App/App/Info.plist`.
- [x] Crear `src/components/maps/LocationPickerModal.tsx`: mapa Leaflet + OSM, marcador por click, botón "Usar mi ubicación" con `@capacitor/geolocation`, manejo de permiso denegado sin bloquear el marcado manual, botones Cancelar/Confirmar.
- [x] Integrar el botón "Elegir en el mapa" y el modal en `AvailabilityManagementPage.tsx`, en las dos secciones que comparten `resourceLatitude`/`resourceLongitude` (crear y editar cancha).
- [x] `yarn cap:sync`.
- [x] Build nativo Android (`gradlew assembleDebug`) — `BUILD SUCCESSFUL`, `@capacitor/geolocation` empaquetado junto al resto de plugins.
- [x] Pruebas de `LocationPickerModal` (mockeando `leaflet` y `@capacitor/geolocation`): abre con marcador inicial si hay coordenadas previas, "Confirmar" deshabilitado sin marcador, click en el mapa habilita confirmar, error/permiso denegado en geolocalización no bloquea el flujo manual, "Cancelar" no modifica nada. 6 pruebas, todas verdes.

## Contratos y tipos (obligatorio)

- [x] No aplica — sin cambios de contrato de API (ver `spec.md`).

## Cierre

- [ ] Validar contra los criterios de aceptación de `spec.md` — pendiente el criterio de verificación manual interactiva (detectar ubicación real y marcar en el mapa en un dispositivo/emulador), no ejecutado en esta sesión.
- [x] `yarn lint && yarn typecheck && yarn test && yarn build` — todos limpios (test acotado a los archivos tocados; la suite completa tiene el OOM preexistente ya documentado en el roadmap).
- [x] `yarn cap:sync` sin errores.
- [ ] Verificación manual: al menos un build/ejecución nativa real (Android) probando detectar ubicación y marcar manualmente — pendiente, requiere emulador/dispositivo con Google Play Services o GPS simulado.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md` — pendiente hasta la verificación manual interactiva de arriba.

## Hallazgo real durante la implementación

Se detectó y corrigió un bug real (no solo un artefacto de pruebas): el mapa se inicializaba en un `useEffect` disparado una sola vez al montar (`[isOpen]`), pero `IonModal` monta su contenido de forma asíncrona según su propio ciclo de presentación. Si el `<div>` del mapa aún no existía en el DOM cuando el efecto corría, el mapa nunca se creaba (sin fallar visiblemente: el modal se veía bien, pero tocar el mapa no hacía nada). Se corrigió reemplazando el `useEffect` por un *callback ref*, que se dispara exactamente cuando el nodo real aparece o desaparece del DOM, sin depender del timing de montaje de Ionic.
