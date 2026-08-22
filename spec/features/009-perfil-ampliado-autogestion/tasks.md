# 009 · Perfil ampliado y autogestión — Tareas

- [x] Implementar/verificar backend 017 antes del cliente.
- [x] Actualizar tipos y validación de perfil propio.
- [x] Añadir endpoints API y hook de perfil propio.
- [x] Crear `AppAvatar` con imagen/fallback.
- [x] Crear formulario opcional de contacto y redes.
- [x] Crear editor de foto con preview, límites y eliminación.
- [x] Crear página y ruta `/admin/profile` sin permiso administrativo.
- [x] Integrar avatar y acción de perfil en `ProfileSummary`.
- [x] Implementar estados, dirty warning y feedback.
- [x] Añadir pruebas unitarias, hooks, rutas y Android.

## Contratos y tipos (obligatorio)

- [x] Reflejar backend real en `src/types/api/users.ts`.
- [x] Actualizar `api-integration.md`.
- [x] Verificar respuesta y errores contra backend/OpenAPI real.

## Cierre

- [x] Validar criterios de aceptación.
- [x] `yarn lint && yarn typecheck && yarn test && yarn build`.
- [x] `yarn cap:sync android` y build/validación en emulador.
- [x] Actualizar roadmap Ionic.

## Mantenimiento (checklist recurrente)

- [ ] Mantener sincronizados formatos/tamaño entre Zod frontend, backend, OpenAPI y UI.
