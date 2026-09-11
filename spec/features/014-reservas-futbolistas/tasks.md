# 014 · Experiencia móvil de reservas para futbolistas — Tareas

- [ ] Esperar aprobación e implementación estable del contrato backend 022.
- [ ] Verificar contratos y permisos leyendo rutas, validaciones y OpenAPI reales.
- [ ] Crear tipos y validaciones de recursos/reservas.
- [ ] Crear endpoints del cliente API y pruebas de mapping de errores.
- [ ] Crear hooks de catálogo, detalle, disponibilidad y reservas propias.
- [ ] Implementar catálogo y detalle con estados loading/empty/error/success.
- [ ] Implementar selección y confirmación de franja sin doble envío.
- [ ] Manejar 409 con mensaje contextual y actualización de disponibilidad.
- [ ] Implementar mis reservas, detalle y cancelación propia.
- [ ] Adaptar navegación y guards por permisos efectivos.
- [ ] Adaptar `UserForm` para roles globales sin organización y tenant con alcance.
- [ ] Añadir pruebas de rol, rutas, formularios, red, 401, 403, 409 y regresiones.

## Contratos y tipos (obligatorio)

- [ ] Definir `src/types/api/resources.ts` y `src/types/api/bookings.ts` desde el backend real.
- [ ] Actualizar `../../constitution/api-integration.md` con endpoints y envelopes verificados.
- [ ] Verificar manualmente contra backend real que las respuestas coinciden con los tipos.

## Cierre

- [ ] Validar todos los criterios de aceptación de `spec.md`.
- [ ] Ejecutar `yarn lint && yarn typecheck && yarn test && yarn build`.
- [ ] Ejecutar `yarn cap:sync` y la validación nativa disponible.
- [ ] Actualizar `../../constitution/roadmap.md`.

