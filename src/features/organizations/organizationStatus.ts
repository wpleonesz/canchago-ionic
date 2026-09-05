// Traducción centralizada del status de Organization/Venue: el backend lo persiste como texto
// libre (VARCHAR sin enum, ver types/api/organizaciones.ts), hoy solo escribe 'ACTIVE' y
// 'PENDING_APPROVAL'. Cualquier valor futuro no mapeado se muestra tal cual para no ocultar
// información, pero nunca debe renderizarse el status crudo directamente en JSX.
const ORGANIZATION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  PENDING_APPROVAL: 'Pendiente',
};

export const getOrganizationStatusLabel = (status: string): string => ORGANIZATION_STATUS_LABELS[status] ?? status;

export const getOrganizationStatusColor = (status: string): 'success' | 'medium' =>
  status === 'ACTIVE' ? 'success' : 'medium';
