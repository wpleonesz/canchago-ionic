# 015 · Estado de organizaciones y sedes — Plan

_Cómo se implementa lo descrito en `spec.md`. Debe respetar la `constitution/`._

## Enfoque

Reutilizar las mutaciones ya existentes `useUpdateOrganization`/`useUpdateVenue` (`src/features/organizations/hooks/`) en vez de crear hooks o endpoints nuevos. El control de estado se agrega como una acción independiente del formulario general de edición (`OrganizationForm`/`VenueForm`), con su propio botón y `AppConfirmDialog`, en vez de meter `status` como un campo más del formulario: solo Administrador debe verlo, y mezclarlo con los campos de contacto complicaría el `isDirty`/`isValid` de un formulario pensado para cualquiera con `organizaciones.manage`.

La fuente de verdad de quién puede ejecutar el cambio sigue siendo el backend (403 si no es Administrador); `PermissionGuard` en Ionic es solo UX, igual que el resto de acciones de esta sección.

## Implementación

1. **`src/types/api/organizaciones.ts`** — extender `UpdateOrganizationRequest` y `UpdateVenueRequest` con `status?: 'ACTIVE' | 'INACTIVE'`, reflejando el contrato real verificado en `canchago` (feature `023`).
2. **`src/features/organizations/organizationStatus.ts`** — agregar `'INACTIVE': 'Inactivo'` a `ORGANIZATION_STATUS_LABELS` y un color distintivo (p. ej. `'danger'`) en `getOrganizationStatusColor`, distinto de `Pendiente` (`'medium'`) para que no se confundan visualmente.
3. **`src/features/organizations/pages/OrganizationDetailPage.tsx`** — dentro del `PermissionGuard permission="organizaciones.manage"` que ya envuelve "Editar organización", agregar un botón "Desactivar organización" / "Activar organización" (según `organization.status`) que abre `AppConfirmDialog` solo al desactivar y llama a `useUpdateOrganization(organization.id).mutateAsync({ status: siguienteEstado, expectedUpdatedAt: organization.updatedAt })`.
4. **`src/features/organizations/components/VenueListItem.tsx`** — junto al botón de editar ya existente (gateado igual con `PermissionGuard permission="organizaciones.manage"`), agregar un botón equivalente para la sede, usando `useUpdateVenue(venue.organizationId, venue.id)`.
5. **`../../constitution/api-integration.md`** — documentar el campo `status` en el contrato de ambos `PATCH`, incluida la restricción a Administrador, apenas se verifique contra el backend real.

## Decisiones

- **Botón de acción dedicado en vez de campo del formulario** — evita mezclar una acción restringida a Administrador con un formulario que edita datos de contacto y que cualquier `organizaciones.manage` puede usar.
- **Reutilizar `useUpdateOrganization`/`useUpdateVenue` en vez de mutaciones nuevas** — el `PATCH` es el mismo endpoint, solo cambia qué campos se envían.
- **Confirmación solo al desactivar, no al reactivar** — desactivar tiene efecto visible inmediato (deja de aparecer en catálogos); reactivar es la operación "segura" de deshacer.

## Riesgos

- **Que el contrato real de `canchago` difiera del descrito aquí** (nombre de campo, código de error) al momento de implementar, si la feature `023` del backend cambia algo durante su propia implementación — mitigado releyendo el código real de `canchago` antes de escribir los tipos, no antes de este documento.
- **Confundir visualmente `Inactivo` con `Pendiente`** — mitigado con colores/etiquetas distintos en `organizationStatus.ts`.
