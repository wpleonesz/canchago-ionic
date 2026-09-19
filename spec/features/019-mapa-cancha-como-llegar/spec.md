# 019 · Mapa de la cancha con mi ubicación y cómo llegar

**Estado:** propuesta

## Qué hace

En "Reserva una cancha" (`CourtsPage`), cuando la cancha elegida tiene coordenadas, aparece un botón **Ver en el mapa** junto a "Cómo llegar". Abre un mapa a pantalla completa (OpenStreetMap vía Leaflet, el mismo motor de la feature `016`) de **solo lectura** que muestra:

- La **cancha** (marcador rojo) y **tu ubicación** (punto azul), detectada con `@capacitor/geolocation` al abrir el mapa.
- Una **línea recta** entre ambos y el encuadre automático para que se vean los dos.
- Un **recuadro de detalles** sobre el mapa con: nombre de la cancha, sede y organización, dirección, precio por hora, la **distancia en línea recta** hasta la cancha y el botón **Cómo llegar** (abre la navegación en Google Maps, como hoy).
- Un botón **Mi ubicación** para volver a detectarla o reintentar si falló.

Si no se puede detectar la ubicación (permiso denegado, GPS apagado, timeout), el mapa muestra igualmente la cancha, el recuadro explica el motivo en español (mensajes de la feature `016`) y "Cómo llegar" sigue disponible.

## Por qué

Hoy "Cómo llegar" solo lanza Google Maps: el Futbolista no ve dónde está la cancha respecto a él antes de decidir. Un mapa con su posición y la distancia le da contexto inmediato, sin servicios de terceros ni claves.

## Contrato de API consumido

_Sin cambios de contrato._ Usa `latitude`, `longitude`, `name`, `address`, `hourlyPrice` y `venue` de `ResourceDto` (`src/types/api/reservas.ts`), ya devueltos por `GET /api/resources`. No se agrega ni cambia ningún campo.

## Criterios de aceptación

- [ ] Con una cancha con coordenadas, "Ver en el mapa" abre el mapa centrado para mostrar cancha y usuario; sin coordenadas el botón no aparece y "Cómo llegar" sigue funcionando por dirección.
- [ ] Al abrir se solicita/usa la ubicación del dispositivo y se marca con un punto azul distinguible del marcador de la cancha.
- [ ] Se dibuja una línea entre usuario y cancha y el mapa encuadra ambos.
- [ ] El recuadro muestra nombre, sede/organización, dirección, precio por hora y la distancia en línea recta formateada en español (`850 m`, `3,2 km`), indicando que es en línea recta.
- [ ] "Cómo llegar" abre la navegación externa con el mismo enlace actual.
- [ ] Ubicación no disponible (permiso, GPS, timeout): la cancha y el recuadro se siguen mostrando, hay un aviso en español y "Mi ubicación" permite reintentar; nunca se bloquea el flujo de reserva.
- [ ] El mapa es de solo lectura: tocar el mapa no modifica ninguna coordenada ni dato.
- [ ] Pruebas automatizadas (distancia, formato, modal con Leaflet y geolocalización simulados) y verificación manual en dispositivo/emulador con ubicación real o simulada.
- [ ] Layout móvil con panel fijo respetando la barra de gestos, modo oscuro y textos accesibles.

### Contratos y tipos (obligatorio)

- [ ] No aplica cambio de contrato de API; verificado.

## Fuera de alcance

- Ruta real por calles, tiempo estimado, o servicios de rutas de terceros (OSRM, Google Directions).
- Navegación paso a paso dentro de la app (se delega a Google Maps).
- Cambios al selector de ubicación del Gestor (`LocationPickerModal`, feature `016`).
- Seguimiento continuo de la posición (`watchPosition`) o guardado de ubicaciones.
- Cambios de backend.
