# 015 · Estado de organizaciones y sedes — Tareas

_Checklist accionable derivada del `plan.md`. Tareas pequeñas y concretas; marca `[x]` al completarlas._

- [x] Extender `UpdateOrganizationRequest`/`UpdateVenueRequest` con `status?: 'ACTIVE' | 'INACTIVE'` en `src/types/api/organizaciones.ts`.
- [x] Agregar etiqueta y color de `INACTIVE` en `src/features/organizations/organizationStatus.ts`.
- [x] Agregar botón activar/desactivar organización en `OrganizationDetailPage.tsx`, gateado con `PermissionGuard permission="organizaciones.manage"`, con `AppConfirmDialog` solo al desactivar.
- [x] Agregar botón equivalente por sede en `VenueListItem.tsx`.
- [x] Manejar 409/403 con el mismo patrón de mensaje (`AppInteractionAlert`) que el resto de ediciones de esta sección.
- [x] Pruebas: `VenueListItem.test.tsx` cubre mostrar el botón correcto según `status`, confirmar antes de desactivar, activar sin confirmación, y manejo de error (403).

## Contratos y tipos (obligatorio)

_Debe completarse en paralelo con la integración del endpoint, no como paso final._

- [x] Definir/actualizar `src/types/api/organizaciones.ts` a partir del contrato real verificado en `canchago` (feature `023`, ya implementada del lado backend).
- [x] Actualizar `../../constitution/api-integration.md` con el campo `status` en ambos `PATCH`.
- [ ] Verificar manualmente contra el backend real (Postgres/Keycloak levantados) que la respuesta coincide con lo tipado — pendiente, no verificado end-to-end en esta sesión.

## Cierre

- [x] Validar contra los criterios de aceptación de `spec.md` (verificación de código y pruebas; falta la verificación manual end-to-end contra backend real, ver punto de arriba).
- [x] `yarn lint && yarn typecheck` sin errores.
- [x] `yarn test` sin regresiones atribuibles a esta feature (el OOM del worker de Vitest en la suite completa es deuda preexistente ya documentada en el roadmap).
- [x] `yarn build` limpio (solo warnings preexistentes de tamaño de chunk, ajenos a esta feature).
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md` — pendiente hasta la verificación manual end-to-end contra backend real.
