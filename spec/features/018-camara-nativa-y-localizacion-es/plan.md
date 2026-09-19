# 018 · Cámara nativa y localización en español — Plan

_Cómo se implementa lo descrito en `spec.md`. Respeta `tech-stack.md` (capas types → validation → services → hooks → componentes)._

## Enfoque

Capacidad nativa aislada en un módulo de servicio (`services/native/camera.ts`) que envuelve `@capacitor/camera`, de modo que `ProfilePhotoEditor` no importe el plugin directamente y sea simple de simular en pruebas. La imagen se redimensiona/comprime por el propio plugin (`width`, `quality`, `correctOrientation`) y se valida el tamaño resultante antes de reutilizar `onUpload`. Los selectores de fecha/hora se dejan nativos (se probó un componente propio y se revirtió por decisión de producto). La localización se declara en los puntos que sí controla la app.

## Implementación

1. **Dependencia.** Agregar `@capacitor/camera` (versión compatible con Capacitor 8) y `yarn cap:sync`. Sin `@ionic/pwa-elements`: en web se conserva el `<input type="file">` actual.
2. **Servicio nativo — `src/services/native/camera.ts`.** `pickProfilePhoto(source: 'camera' | 'gallery')` → `{ base64, mimeType }` o `null` si el usuario cancela. Usa `Camera.getPhoto({ resultType: Base64, source, quality: 80, width: 1024, correctOrientation: true })`; clasifica errores (permiso denegado, cancelación, no disponible) en un tipo propio; comprueba tamaño ≤ 2 MiB y `mimeType` permitido.
3. **`ProfilePhotoEditor.tsx`.** Reemplazar el botón único por una hoja de acciones (`IonActionSheet`) en español: "Tomar foto", "Elegir de la galería", "Cancelar". En plataforma nativa usa el servicio; en web mantiene el input de archivo. Errores por `AppInteractionAlert` con mensajes en español, incluida la vía alternativa si se deniega el permiso.
4. **Fecha y hora.** Sin cambios: se mantienen los `<input type="date|time|month">` nativos. `AppSelect` fija `cancelText="Cancelar"`.
5. **Idioma.** `index.html` → `lang="es"`. Android: `res/values-es/strings.xml` y `res/xml/locales_config.xml` con `android:localeConfig` en el manifest. iOS: `CFBundleDevelopmentRegion=es`, `CFBundleLocalizations=[es]`, y `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`, `NSLocationWhenInUseUsageDescription` en español.
6. **Mensajes previos de permiso.** Texto breve en español antes de solicitar cámara (perfil) y ubicación (`LocationPickerModal`), reutilizando los mensajes de la feature `016`; sin bloquear la vía alternativa.
7. **Verificación.** `yarn lint && yarn typecheck && yarn test && yarn build`, `yarn cap:sync`, build Android (`gradlew assembleDebug`) y prueba manual en emulador (cámara virtual) / dispositivo.
8. **Cierre.** Actualizar `roadmap.md` (Siguiente → Hecho solo tras la verificación manual) y nota cruzada en la feature `009`.

## Estrategia de pruebas

- Servicio de cámara con el plugin simulado: foto, galería, cancelación (devuelve `null`), permiso denegado, imagen > 2 MiB, tipo no permitido.
- `ProfilePhotoEditor`: hoja de acciones, subida por ambas vías, cancelación sin error, fallback web.
- Manual: cámara real/virtual, permiso denegado y reactivado desde Ajustes, dispositivo con idioma inglés para confirmar que la app sigue en español (salvo diálogos del SO).

## Decisiones

- **Servicio nativo aislado:** facilita pruebas y sustitución; los componentes no conocen Capacitor.
- **Sin i18n completo:** la app es monolingüe; `react-i18next` sería una dependencia sin necesidad comprobada.
- **Reducir en el plugin (no en canvas):** menos código, orientación corregida por el propio plugin.

## Riesgos

- Los cuadros de permiso del SO seguirán en el idioma del dispositivo (documentado en `spec.md`).
- Algunos emuladores no traen cámara funcional: configurar cámara virtual o probar en dispositivo.
- El plugin puede devolver un `format` distinto del `mimeType` esperado (p. ej. `heic`): convertir a JPEG vía `quality` o rechazar con mensaje claro.
