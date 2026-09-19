# 018 · Cámara nativa y localización en español — Tareas

_Checklist accionable derivada del `plan.md`._

## Preparación

- [ ] Aprobar `spec.md`, `plan.md` y este checklist antes de escribir código.
- [ ] Confirmar la versión de `@capacitor/camera` compatible con Capacitor 8 y su comportamiento de permisos en Android/iOS.

## Cámara

- [ ] Agregar `@capacitor/camera` y ejecutar `yarn cap:sync`.
- [ ] Crear `src/services/native/camera.ts` con `pickProfilePhoto('camera' | 'gallery')`, cancelación → `null`, clasificación de errores y validación de tamaño/tipo.
- [ ] Pruebas del servicio con el plugin simulado (foto, galería, cancelación, permiso denegado, > 2 MiB, tipo no permitido).
- [ ] Reemplazar el botón de `ProfilePhotoEditor` por `IonActionSheet` en español, manteniendo el fallback de archivo en web.
- [ ] Mensajes de error/permiso denegado en español con la vía alternativa.
- [ ] Pruebas de `ProfilePhotoEditor` (ambas vías, cancelación sin error, fallback web).

## Calendario

- [ ] Crear `AppDatePicker` (`IonDatetimeButton` + `IonDatetime`, `es-EC`, lunes, `min`/`max`, `YYYY-MM-DD`).
- [ ] Sustituir `type="date"` en `AiAssistantPage`, `CourtsPage` y `AvailabilityManagementPage`.
- [ ] Pruebas de `AppDatePicker` y ajuste de las pruebas de las tres pantallas.

## Idioma y permisos

- [ ] `index.html` con `lang="es"`.
- [ ] Android: `values-es/strings.xml`, `xml/locales_config.xml` y `android:localeConfig`.
- [ ] iOS: `CFBundleDevelopmentRegion`/`CFBundleLocalizations` y `NS*UsageDescription` (cámara, fotos, ubicación) en español.
- [ ] Texto previo en español antes de solicitar cámara y ubicación.

## Verificación y cierre

- [ ] `yarn lint && yarn typecheck && yarn test && yarn build` (comparar fallos con la línea base preexistente: OOM del runner y `UserForm.test.tsx`).
- [ ] `yarn cap:sync` y `gradlew assembleDebug`.
- [ ] Verificación manual en Android real/emulador: tomar foto, elegir de galería, cancelar, permiso denegado, calendario en español con dispositivo en inglés.
- [ ] Validar uno a uno los criterios de aceptación de `spec.md`.
- [ ] Actualizar `../../constitution/roadmap.md` (mover a "Hecho" solo tras la verificación manual).
