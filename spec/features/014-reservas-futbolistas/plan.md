# 014 · Experiencia móvil de reservas para futbolistas — Plan

## Enfoque

Tras aprobar e implementar el contrato backend 022, se integra siguiendo `types → validation → services/api → hooks → components/pages → routes`. La experiencia se habilita por permisos reales de sesión. La app presenta la disponibilidad, pero la confirmación siempre depende de la respuesta atómica del backend.

## Implementación

1. **Contrato verificado** — contrastar rutas, envelopes, campos, permisos y códigos de error directamente con backend 022 y actualizar `api-integration.md`.
2. **`src/types/api/resources.ts` y `bookings.ts`** — modelar DTOs, queries, requests, paginación y estados sin `any`.
3. **`src/validation/bookings.ts`** — validar fecha/franja y payload de confirmación para UX, sin duplicar reglas dinámicas del backend.
4. **`src/services/api/endpoints/`** — añadir funciones Axios para catálogo, disponibilidad y reservas propias.
5. **`src/features/resources/hooks/` y `src/features/bookings/hooks/`** — queries/mutations con claves estables, invalidación focalizada y retry seguro.
6. **Catálogo y detalle** — páginas Ionic con `AppDataList`, estados compartidos, selección de fecha/franja y sin tarjetas anidadas.
7. **Confirmación** — resumen, `IonAlert`/componentes existentes, bloqueo de doble envío y tratamiento específico de 409 con refetch.
8. **Mis reservas** — listado/detalle/cancelación propia con confirmación y estados completos.
9. **Navegación y guards** — incorporar menú del Futbolista por permisos y mantener administración separada para Gestor/Administrador.
10. **`UserForm` administrativo** — adaptar organización/roles al contrato backend corregido; ocultar o exigir alcance según el rol seleccionado.
11. **Pruebas** — componentes, validación, hooks/API mock, rutas/menús por rol, 401/403/409/red/doble envío y regresión del registro.
12. **Validación** — `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build`, `yarn cap:sync` y build/ejecución nativa disponible.

## Decisiones

- **Menús por permisos de sesión** — no se hardcodea confianza en el nombre del rol; el rol orienta UX y los permisos gobiernan acceso.
- **Sin caché optimista al crear reserva** — es una operación crítica y concurrente; la respuesta del backend es la fuente de verdad.
- **409 refresca disponibilidad** — representa la carrera normal entre consulta y confirmación.
- **Componentes Ionic existentes** — se reutilizan estados, botones, alertas, layout y patrones de navegación actuales.

## Riesgos

- **Contrato backend todavía propuesto** — no escribir cliente sobre shapes supuestos.
- **Zona horaria del dispositivo** — convertir explícitamente entre presentación local y UTC del API.
- **Reintentos de red** — no reintentar automáticamente POST críticos sin idempotencia contractual.
- **Roles mixtos** — derivar visibilidad de permisos efectivos y probar usuarios con más de un rol.

