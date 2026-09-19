# 018 · Cámara nativa y localización en español — Tareas

_Checklist accionable derivada del `plan.md`._

## Preparación

- [ ] Aprobar `spec.md`, `plan.md` y este checklist antes de escribir código.
- [x] Confirmar la versión de `@capacitor/camera` compatible con Capacitor 8 (8.2.4) y su comportamiento de permisos: en Android no requiere permisos si no se usa `saveToGallery`; en iOS requiere `NSCameraUsageDescription`/`NSPhotoLibraryUsageDescription`. `getPhoto`/`pickImages` están deprecados desde 8.1: se usan `takePhoto` y `chooseFromGallery`.

## Cámara

- [x] Agregar `@capacitor/camera` y ejecutar `yarn cap:sync`.
- [x] Crear `src/services/native/camera.ts` con `pickPhoto('camera' | 'gallery')` → `File | null` (reducida a 1024 px, JPEG 80 %), cancelación → `null`, errores clasificados por código estructurado del plugin. La validación de tamaño/tipo se reutiliza del flujo existente de `ProfilePhotoEditor`.
- [x] Pruebas del servicio con el plugin simulado (foto, galería, cancelación, permiso denegado, sin cámara, resultado sin ruta) — 5 verdes.
- [x] Crear `src/utils/image-compress.ts` (`fitAvatarImage`): sin cambios si ya cumple (≤ 2 MiB y JPEG/PNG/WebP); si no, decodifica con `createImageBitmap` (respetando la orientación EXIF), redimensiona (1600 → 1024 → 640 px) y recodifica a JPEG con calidad 0.85 → 0.45 hasta ≤ 2 MiB; fondo blanco para PNG/WebP con transparencia; error tipado si no se puede decodificar o reducir.
- [x] Pruebas de `image-compress` (sin cambios si cumple, reduce lo grande, reintenta con menor calidad/tamaño, convierte otros formatos, no decodificable, no imagen) — 7 verdes con canvas simulado (jsdom no lo implementa; la reducción real requiere verificación manual en dispositivo).
- [x] Integrar `fitAvatarImage` en `ProfilePhotoEditor` para las tres vías, con estado de carga durante el procesamiento.
- [x] Reemplazar el botón de `ProfilePhotoEditor` por `IonActionSheet` en español con Tomar foto / Elegir de la galería / Elegir un archivo (selector de documentos del sistema) / Cancelar; en web abre directamente el selector de archivos.
- [x] Mensajes de error/permiso denegado en español con la vía alternativa.
- [x] Pruebas de `ProfilePhotoEditor` (hoja en español, cámara, cancelación sin error, permiso denegado, > 2 MiB, fallback web) — 6 verdes.

## Backend (bug hallado en prueba nativa)

- [x] `canchago/proxy.ts`: el preflight CORS no anunciaba `PUT`, así que la app nativa bloqueaba `PUT /api/profile/avatar` (y `PUT …/weekday-discounts`) con "No se pudo conectar con el servidor". Añadido `PUT` a `Access-Control-Allow-Methods` y prueba `tests/unit/proxy-cors.test.ts`. El navegador de desarrollo no lo mostraba porque el proxy de Vite es same-origin.

## Calendario

- [x] Se probó un `AppDatePicker` propio (`IonDatetime`, es-EC) y se **revirtió por decisión del usuario**: los formularios vuelven a los inputs nativos `type="date|time|month"`.
- [x] `AppSelect` con `cancelText="Cancelar"` (se conserva).

## Idioma y permisos

- [x] `index.html` con `lang="es"`.
- [ ] Android: `values-es/strings.xml`, `xml/locales_config.xml` y `android:localeConfig`. _(Añadido el servicio del selector de fotos moderno en el manifest; falta lo de recursos de idioma.)_
- [x] iOS: `CFBundleDevelopmentRegion`/`CFBundleLocalizations` y `NS*UsageDescription` (cámara, fotos, ubicación) en español.
- [ ] Texto previo en español antes de solicitar cámara y ubicación.

## Verificación y cierre

- [ ] `yarn lint && yarn typecheck && yarn test && yarn build` (comparar fallos con la línea base preexistente: OOM del runner y `UserForm.test.tsx`).
- [x] `yarn cap:sync` y `gradlew assembleDebug` (BUILD exitoso con `@capacitor/camera` empaquetado).
- [ ] Verificación manual en Android real/emulador: tomar foto, elegir de galería, cancelar, permiso denegado.
- [ ] Validar uno a uno los criterios de aceptación de `spec.md`.
- [ ] Actualizar `../../constitution/roadmap.md` (mover a "Hecho" solo tras la verificación manual).
