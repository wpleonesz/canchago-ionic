# 019 · Mapa de la cancha con mi ubicación y cómo llegar — Tareas

- [x] `src/utils/geo.ts` (`distanceMeters`, `formatDistance`) y pruebas.
- [x] `resourceCoordinates` en `features/bookings/utils/maps.ts`.
- [x] `CourtMapModal.tsx` + `CourtMapModal.css` (mapa, marcadores, línea, encuadre, recuadro de detalles, "Cómo llegar", "Mi ubicación").
- [x] Pruebas de `CourtMapModal` (detalles y enlace, marcadores + línea + distancia, permiso denegado, reintento, solo lectura, sin coordenadas) — 6 verdes con Leaflet y geolocalización simulados.
- [x] Hallazgo de las pruebas: el callback ref dependía de la posición del usuario y recreaba el mapa al llegar la ubicación; se estabilizó con dependencias primitivas.
- [x] Botón "Ver en el mapa" en `CourtsPage` solo si hay coordenadas.
- [x] `yarn lint && yarn typecheck && yarn test && yarn build` y `yarn cap:sync`.
- [ ] Verificación manual en dispositivo/emulador (ubicación real o simulada, permiso denegado, GPS apagado).
- [ ] Validar los criterios de `spec.md` y actualizar `../../constitution/roadmap.md`.
