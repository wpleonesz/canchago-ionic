# 016 · Selección de ubicación de la cancha en un mapa

**Estado:** propuesta

## Qué hace

En la sección "Ubicación, precio y estado de la cancha" (crear o editar una cancha, `AvailabilityManagementPage.tsx`), el Gestor puede tocar "Elegir en el mapa" y elegir la latitud/longitud de la cancha en un mapa a pantalla completa (OpenStreetMap vía Leaflet), sin escribir coordenadas a mano. Dentro del mapa puede: detectar su ubicación actual con el permiso nativo de geolocalización, o hacer zoom/pan y tocar el punto exacto para marcarlo. Al confirmar, la latitud y longitud elegidas llenan los mismos campos que hoy ya existen y ya viajan al backend sin cambios.

## Por qué

Hoy la latitud y longitud de una cancha se escriben a mano en dos campos numéricos (`AvailabilityManagementPage.tsx`). Es propenso a error (invertir lat/lng, un decimal de más) y obliga al Gestor a buscar sus propias coordenadas en otra app y copiarlas. Un mapa interactivo con detección de ubicación resuelve ambos problemas sin tocar el backend: `latitude`/`longitude` ya existen y se validan en pareja (`validateCoordinates`) desde la feature de agendamiento de canchas.

## Contrato de API consumido

_Sin cambios de contrato._ Esta feature es exclusivamente de UI: reutiliza `latitude`/`longitude` ya existentes en `CreateResourceRequest`/`UpdateResourceRequest` (`src/types/api/reservas.ts`) y en los endpoints `POST /api/organizaciones/{organizationId}/sedes/{venueId}/resources` y `PATCH /api/resources/{resourceId}` ya implementados. No se agrega, quita ni renombra ningún campo de request/response.

## Criterios de aceptación

- [ ] Un botón "Elegir en el mapa" junto a los campos de latitud/longitud (tanto al crear como al editar una cancha) abre un modal a pantalla completa con un mapa de OpenStreetMap.
- [ ] Un botón "Usar mi ubicación" dentro del modal solicita el permiso nativo de geolocalización (Android/iOS) y, si se concede, centra el mapa y coloca el marcador en la posición actual del dispositivo.
- [ ] Si el permiso de ubicación se niega o falla la detección, se muestra un mensaje claro y el usuario puede seguir marcando el punto manualmente en el mapa; no se bloquea el flujo.
- [ ] Tocar cualquier punto del mapa coloca o mueve un marcador a esa posición; se puede hacer zoom y pan libremente antes de tocar.
- [ ] Si la cancha ya tiene latitud/longitud guardadas, el mapa abre centrado en esa posición con el marcador ya colocado.
- [ ] "Confirmar ubicación" solo está habilitado cuando hay un punto marcado, y al confirmar llena los campos de latitud/longitud existentes con el valor elegido (mismo formato numérico que ya validan `validateCoordinates`/Zod).
- [ ] "Cancelar" cierra el modal sin modificar los campos de latitud/longitud existentes.
- [ ] Los campos numéricos de latitud/longitud existentes se mantienen editables manualmente como alternativa al mapa (nunca se retira esa vía).
- [ ] El mapa funciona en un build nativo real de Android (y iOS si hay entorno disponible para verificarlo), no solo en el navegador de desarrollo.

### Contratos y tipos (obligatorio)

- [ ] No aplica: sin cambios de contrato de API. Se documenta explícitamente aquí para dejar constancia de que se verificó que no hacía falta.

## Fuera de alcance

- Buscar una dirección por texto y centrar el mapa ahí (geocoding) — no hay backend de geocoding en `canchago` y agregar uno de terceros con API key queda fuera de esta feature.
- Mostrar el mapa en el catálogo del Futbolista o en el flujo de "Cómo llegar" (ya resuelto con un deep link externo a Google Maps, `utils/maps.ts`, sin cambios).
- Dibujar polígonos, radios o cualquier geometría distinta de un único punto.
- Guardar o cachear ubicaciones recientes/favoritas.
