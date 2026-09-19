# 018 · Cámara nativa y localización en español

**Estado:** propuesta

## Qué hace

1. **Foto de perfil con la cámara.** En "Mi perfil", el botón de fotografía abre una hoja de opciones en español — **Tomar foto**, **Elegir de la galería**, **Cancelar** — respaldada por el plugin nativo `@capacitor/camera`. La imagen se reduce y comprime en el dispositivo antes de subirla para cumplir el límite existente (JPEG/PNG/WebP, máx. 2 MiB) y se sube por el mismo flujo actual (`PATCH`/`PUT` de avatar de la feature `009`). En navegador (solo desarrollo) se conserva el selector de archivos actual como respaldo.
2. **Calendario y reloj: se mantienen los selectores nativos (decisión 2026-09-18).** Se probó reemplazar `<input type="date|time|month">` por un selector propio con `IonDatetime` en español y se descartó por preferencia de producto; se volvió a los inputs nativos. Su idioma y formato dependen del dispositivo (límite de plataforma). `AppSelect` sí fija `cancelText="Cancelar"`.
3. **Idioma y permisos nativos.** La app se declara en español (`<html lang="es">`, recursos Android `values-es`, `CFBundleDevelopmentRegion=es` y textos de uso de permisos en español en iOS) y, antes de solicitar cámara/fotos/ubicación, muestra un texto propio en español que explica para qué se usa el permiso y cómo activarlo si fue denegado.

## Por qué

Ejemplifica el uso de una capacidad nativa del dispositivo (cámara) integrada en la arquitectura real, con permisos, degradación elegante y pruebas. Además elimina mezclas de idioma visibles para el usuario (formato de fecha en inglés, textos de permisos en inglés).

## Límites de la plataforma (verificados, no supuestos)

- Los cuadros de permiso de Android/iOS (p. ej. "¿Permitir que Canchago acceda a la ubicación del dispositivo?") los dibuja el sistema operativo en el **idioma del dispositivo**; la app no puede forzarlos. Lo que sí controla: textos de uso en iOS (`Info.plist`), etiquetas de la hoja de la cámara, el idioma de sus propios recursos y el mensaje previo en español.
- Android: la cámara por intent y el selector de fotos del sistema no requieren declarar permisos de almacenamiento; se evita declarar `CAMERA` salvo que la verificación lo exija.

## Contrato de API consumido

_Sin cambios de contrato._ Reutiliza el endpoint de avatar propio de la feature `009` (`UpdateOwnAvatarRequest`: `imageBase64` + `mimeType`, ver `src/types/api/users.ts`). No se agrega ni cambia ningún campo.

## Criterios de aceptación

- [ ] "Mi perfil" ofrece Tomar foto / Elegir de la galería / Cancelar en español y ambas vías suben la foto por el flujo existente.
- [ ] La imagen enviada nunca supera 2 MiB ni usa un tipo fuera de JPEG/PNG/WebP; si no se puede reducir bajo el límite se muestra un error claro.
- [ ] Cancelar la cámara o la galería no muestra error ni modifica la foto actual.
- [ ] Permiso de cámara denegado: mensaje en español con la vía alternativa (galería) y cómo activarlo en Ajustes; la app no se bloquea.
- [ ] En navegador de desarrollo sigue funcionando el selector de archivos.
- [ ] `<html lang="es">` y textos nativos (iOS `NS*UsageDescription`, `values-es`) en español.
- [ ] Antes de pedir ubicación o cámara se explica el motivo en español (sin reemplazar el diálogo del sistema).
- [ ] Accesibilidad básica: etiquetas, foco y objetivos táctiles ≥ 44 px en la hoja de foto; modo oscuro correcto.
- [ ] Pruebas automatizadas con `@capacitor/camera` simulado (foto, galería, cancelación, permiso denegado, tamaño excedido) 
- [ ] Verificación manual en dispositivo/emulador Android real (cámara real o virtual) y, si hay entorno, iOS.

### Contratos y tipos (obligatorio)

- [ ] No aplica cambio de contrato de API; se deja constancia de que se verificó.

## Fuera de alcance

- Internacionalización completa (i18n con múltiples idiomas, `react-i18next`): la app sigue siendo solo en español.
- Recorte/edición avanzada de la foto, filtros o cámara personalizada con vista previa propia.
- Traducir los cuadros de permiso del sistema operativo.
- Cambios de backend.
