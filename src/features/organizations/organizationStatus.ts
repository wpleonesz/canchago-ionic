// Traducción centralizada del status de Organization/Venue: el backend lo persiste como texto
// libre (VARCHAR sin enum, ver types/api/organizaciones.ts). Escribe 'ACTIVE' y
// 'PENDING_APPROVAL' en el flujo de aprobación de solicitudes, y 'INACTIVE' cuando un
// Administrador desactiva una organización/sede ya aprobada (canchago feature 023). Cualquier
// valor futuro no mapeado se muestra tal cual para no ocultar información, pero nunca debe
// renderizarse el status crudo directamente en JSX.
const ORGANIZATION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  PENDING_APPROVAL: 'Pendiente',
  INACTIVE: 'Inactivo',
};

export const getOrganizationStatusLabel = (status: string): string => ORGANIZATION_STATUS_LABELS[status] ?? status;

export const getOrganizationStatusColor = (status: string): 'success' | 'medium' | 'danger' => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'INACTIVE') return 'danger';
  return 'medium';
};
