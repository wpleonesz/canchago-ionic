import { apiClient } from '../apiClient';
import type {
  OrganizationListRawResponse,
  OrganizationListResponse,
} from '../../../types/api/organizaciones';

// GET /api/organizaciones responde {organizations, meta}, no {data, meta} — envelope no
// estándar documentado en api-integration.md §7. Se normaliza aquí (capa services/api/), no en
// el interceptor global ni en el hook — ver spec 005 "Decisiones".
export const getOrganizations = async (
  page = 1,
  pageSize = 50,
): Promise<OrganizationListResponse> => {
  const { data } = await apiClient.get<OrganizationListRawResponse>('/organizaciones', {
    params: { page, pageSize },
  });

  return { data: data.organizations, meta: data.meta };
};
