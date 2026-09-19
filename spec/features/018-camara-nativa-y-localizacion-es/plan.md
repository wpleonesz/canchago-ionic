# 018 · Cámara nativa y localización en español — Plan

_Cómo se implementa lo descrito en `spec.md`. Respeta `tech-stack.md` (capas types → validation → services → hooks → componentes)._

## Enfoque

Capacidad nativa aislada en un módulo de servicio (`services/native/camera.ts`) que envuelve `@capacitor/camera`, de modo que `ProfilePhotoEditor` no importe el plugin directamente y sea simple de simular en pruebas. La imagen se redimensiona/comprime por el propio plugin (`width`, `quality`, `correctOrientation`) y se valida el tamaño resultante antes de reutilizar `onUpload`. Los campos de fecha se centralizan en un único componente `AppDatePicker` para no repetir configuración de idioma. La localización se declara en los puntos que sí controla la app.

## Implementación

1. **Dependencia.** Agregar `@capacitor/camera` (versión compatible con Capacitor 8) y `yarn cap:sync`. Sin `@ionic/pwa-elements`: en web se conserva el `<input type="file">` actual.
2. **Servicio nativo — `src/services/native/camera.ts`.** `pickProfilePhoto(source: 'camera' | 'gallery')` → `{ base64, mimeType }` o `null` si el usuario cancela. Usa `Camera.getPhoto({ resultType: Base64, source, quality: 80, width: 1024, correctOrientation: true })`; clasifica errores (permiso denegado, cancelación, no disponible) en un tipo propio; comprueba tamaño ≤ 2 MiB y `mimeType` permitido.
3. **`ProfilePhotoEditor.tsx`.** Reemplazar el botón único por una hoja de acciones (`IonActionSheet`) en español: "Tomar foto", "Elegir de la galería", "Cancelar". En plataforma nativa usa el servicio; en web mantiene el input de archivo. Errores por `AppInteractionAlert` con mensajes en español, incluida la vía alternativa si se deniega el permiso.
4. **`AppDatePicker` — `src/components/forms/AppDatePicker.tsx`.** `IonDatetimeButton` + `IonModal` + `IonDatetime` (`presentation="date"`, `locale="es-EC"`, `firstDayOfWeek={1}`, `min`/`max`, botones "Cancelar"/"Aceptar"). Entrada y salida `YYYY-MM-DD` para no cambiar los formularios. Sustituir los `type="date"` de `AiAssistantPage`, `CourtsPage` y `AvailabilityManagementPage`.
5. **Idioma.** `index.html` → `lang="es"`. Android: `res/values-es/strings.xml` y `res/xml/locales_config.xml` con `android:localeConfig` en el manifest. iOS: `CFBundleDevelopmentRegion=es`, `CFBundleLocalizations=[es]`, y `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`, `NSLocationWhenInUseUsageDescription` en español.
6. **Mensajes previos de permiso.** Texto breve en español antes de solicitar cámara (perfil) y ubicación (`LocationPickerModal`), reutilizando los mensajes de la feature `016`; sin bloquear la vía alternativa.
7. **Verificación.** `yarn lint && yarn typecheck && yarn test && yarn build`, `yarn cap:sync`, build Android (`gradlew assembleDebug`) y prueba manual en emulador (cámara virtual) / dispositivo.
8. **Cierre.** Actualizar `roadmap.md` (Siguiente → Hecho solo tras la verificación manual) y nota cruzada en la feature `009`.

## Estrategia de pruebas

- Servicio de cámara con el plugin simulado: foto, galería, cancelación (devuelve `null`), permiso denegado, imagen > 2 MiB, tipo no permitido.
- `ProfilePhotoEditor`: hoja de acciones, subida por ambas vías, cancelación sin error, fallback web.
- `AppDatePicker`: valor `YYYY-MM-DD` de entrada y salida, `min` respetado, etiquetas en español.
- Manual: cámara real/virtual, permiso denegado y reactivado desde Ajustes, dispositivo con idioma inglés para confirmar que la app sigue en español (salvo diálogos del SO).

## Decisiones

- **`IonDatetime` en vez de `<input type="date">`:** el input nativo hereda el formato del sistema/WebView; `IonDatetime` acepta `locale` y es consistente entre plataformas.
- **Servicio nativo aislado:** facilita pruebas y sustitución; los componentes no conocen Capacitor.
- **Sin i18n completo:** la app es monolingüe; `react-i18next` sería una dependencia sin necesidad comprobada.
- **Reducir en el plugin (no en canvas):** menos código, orientación corregida por el propio plugin.

## Riesgos

- Los cuadros de permiso del SO seguirán en el idioma del dispositivo (documentado en `spec.md`).
- Algunos emuladores no traen cámara funcional: configurar cámara virtual o probar en dispositivo.
- `IonDatetime` dentro de modales anidados (`LocationPickerModal` no lo usa, pero sí otras pantallas): verificar apilado y foco.
- El plugin puede devolver un `format` distinto del `mimeType` esperado (p. ej. `heic`): convertir a JPEG vía `quality` o rechazar con mensaje claro.
