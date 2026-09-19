# 019 · Mapa de la cancha con mi ubicación y cómo llegar — Plan

## Enfoque

Un componente de solo lectura, `CourtMapModal`, independiente del selector de la feature `016` (que edita coordenadas): reutiliza sus mismas convenciones —Leaflet vanilla con callback ref porque `IonModal` monta su contenido de forma asíncrona— y el helper de geolocalización (`detectCurrentPosition` + mensajes en español). La distancia se calcula en el dispositivo (Haversine); no hay servicios externos.

## Implementación

1. **`src/utils/geo.ts`.** `distanceMeters(a, b)` (Haversine) y `formatDistance(meters)` (`es-EC`: `< 1000` → `850 m`; si no, `3,2 km`).
2. **`src/features/bookings/utils/maps.ts`.** `resourceCoordinates(resource)` → `{ latitude, longitude } | null` (números válidos) para decidir si mostrar el mapa y evitar duplicar el parseo.
3. **`src/components/maps/CourtMapModal.tsx` + `.css`.** Props `resource`, `isOpen`, `onClose`. Mapa con marcador de cancha, punto azul de usuario, `L.polyline` discontinua y `fitBounds`; recuadro inferior con los detalles, la distancia y los botones "Cómo llegar" (`directionsUrl`) y "Mi ubicación". Detecta la ubicación al abrir; errores por `classifyGeolocationError`/`GEOLOCATION_MESSAGES` en un aviso en línea.
4. **`CourtsPage.tsx`.** Botón "Ver en el mapa" en la tarjeta de resumen (solo con coordenadas) y estado de apertura del modal.
5. **Pruebas.** `geo.test.ts`; `CourtMapModal.test.tsx` con Leaflet, `IonModal` y geolocalización simulados (ubicación OK → distancia y línea; permiso denegado → aviso, cancha visible; reintento).
6. **Cierre.** Gates (`yarn lint && yarn typecheck && yarn test && yarn build`), `yarn cap:sync`, verificación manual, `roadmap.md`.

## Decisiones

- **Línea recta + distancia** en vez de ruta real: sin claves, sin dependencia y sin depender de un servicio público no apto para producción; la navegación real se delega a Google Maps.
- **Componente separado del selector:** el selector edita datos; este solo muestra. Mezclarlos añadiría modos y condicionales a un componente que ya funciona.
- **Ubicación al abrir (no continua):** una lectura basta para orientar y evita gasto de batería.

## Riesgos

- Sin ubicación (permiso/GPS) el mapa solo muestra la cancha: se comunica y se permite reintentar.
- Distancia en línea recta puede subestimar el trayecto real: el recuadro lo indica explícitamente.
