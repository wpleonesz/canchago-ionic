# 015 · Estado de organizaciones y sedes

**Estado:** propuesta

## Qué hace

En el detalle de una organización (`/admin/organizations/:organizationId`) y en el listado de sus sedes, un Administrador ve un control para desactivar o reactivar la organización, y otro control equivalente por cada sede. El cambio usa los mismos `PATCH` de edición que ya existen, ahora con el campo `status` que el backend expone en la feature `canchago` `023-estado-organizaciones-sedes`.

## Por qué

Hoy `OrganizationForm.tsx` y `VenueForm.tsx` solo editan datos de contacto; no existe ninguna forma de dar de baja una organización o sede ya aprobada, ni de reactivarla. El backend tampoco lo permitía hasta la feature `023` de `canchago`. Con el contrato ya extendido, falta la parte visible: un Administrador necesita poder hacerlo sin usar `curl` o Prisma Studio directamente.

## Contrato de API consumido

_Verificado leyendo `canchago` directamente (feature `023-estado-organizaciones-sedes`, aún en implementación en paralelo a esta feature)._

- `PATCH /api/organizaciones/:organizationId` — permiso requerido: `organizaciones.manage`. Body ahora acepta `status?: 'ACTIVE' | 'INACTIVE'` junto a `expectedUpdatedAt` (obligatorio). El backend responde 403 si quien llama no es Administrador global, incluso si tiene `organizaciones.manage` y scope real sobre esa organización.
- `PATCH /api/organizaciones/:organizationId/sedes/:sedeId` — mismo patrón, mismo campo `status`, misma restricción a Administrador.
- Si el contrato real difiere de esto al momento de implementar (por ejemplo, otro nombre de campo o código de error), no se implementa sobre el supuesto: se relee `canchago` y se corrige aquí primero.

## Criterios de aceptación

- [ ] Un Administrador puede desactivar una organización activa desde su detalle, y el badge de estado y el listado reflejan `Inactivo` tras recargar.
- [ ] Un Administrador puede reactivar una organización inactiva de la misma forma.
- [ ] Un Administrador puede desactivar/reactivar una sede individual desde el listado de sedes de una organización, de forma independiente al estado de la organización.
- [ ] Antes de desactivar (no antes de reactivar) se muestra una confirmación (`AppConfirmDialog`) explicando que la organización/sede dejará de aparecer para nuevas reservas, pero no cancela reservas existentes.
- [ ] El control de cambio de estado solo se muestra dentro de `PermissionGuard permission="organizaciones.manage"`, igual que el resto de acciones de administración de esta sección; la decisión real de quién puede ejecutar el cambio siempre es del backend (403 si no corresponde).
- [ ] Un conflicto de concurrencia (409, la organización/sede cambió desde que se cargó) muestra un mensaje claro y ofrece recargar, igual que el resto de ediciones de esta sección.
- [ ] Estados `loading`/`error`/`success` de la mutación son visibles (botón deshabilitado mientras está en curso, alerta de error si falla).

### Contratos y tipos (obligatorio)

- [ ] `UpdateOrganizationRequest` y `UpdateVenueRequest` en `src/types/api/organizaciones.ts` incluyen `status?: 'ACTIVE' | 'INACTIVE'`, reflejando exactamente el contrato real verificado en `canchago`.
- [ ] `../../constitution/api-integration.md` documenta el campo `status` en ambos `PATCH`, incluida la restricción a Administrador.

## Fuera de alcance

- Un estado `Suspendido` distinto de `Inactivo` (no existe en el backend de la feature `023`).
- Cascada visual o automática entre el estado de una organización y el de sus sedes.
- Cambios al flujo existente de aprobación/rechazo de solicitudes de acceso (`008`/`canchago` `016`).
- Mostrar u ocultar reservas existentes como consecuencia de este cambio de estado (el backend no las modifica).
