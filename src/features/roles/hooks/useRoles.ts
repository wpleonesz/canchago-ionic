import { useQuery } from '@tanstack/react-query';
import { getRoles } from '../../../services/api/endpoints/roles';

// staleTime más largo que useUsers: el catálogo de roles de una organización cambia poco
// dentro de una sesión (ver spec 005 "Decisiones"). Habilitado solo cuando hay organizationId
// — GET /api/roles lo exige (400 si falta).
export const useRoles = (organizationId: string | undefined, page = 1, pageSize = 50) =>
  useQuery({
    queryKey: ['roles', organizationId, page, pageSize],
    queryFn: () => getRoles({ organizationId: organizationId as string, page, pageSize }),
    enabled: Boolean(organizationId),
    staleTime: 5 * 60 * 1000,
  });
