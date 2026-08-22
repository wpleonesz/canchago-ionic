import { useQuery } from '@tanstack/react-query';
import { getOrganizations } from '../../../services/api/endpoints/organizaciones';

// Solo lectura, mínimo necesario para el picker de organización de la feature 005 — no la
// feature completa de organizaciones (backlog 006). Sin "mi organización": SessionUser no
// expone el alcance de organización del admin actual (gap documentado en api-integration.md).
export const useOrganizations = (page = 1, pageSize = 50) =>
  useQuery({
    queryKey: ['organizations', page, pageSize],
    queryFn: () => getOrganizations(page, pageSize),
    staleTime: 5 * 60 * 1000,
  });
