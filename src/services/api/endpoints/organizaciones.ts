import { apiClient } from '../apiClient';
import type {
  CreateOrganizationRequest,
  CreateVenueRequest,
  OrganizationDto,
  OrganizationListQuery,
  OrganizationListRawResponse,
  OrganizationListResponse,
  UpdateOrganizationRequest,
  UpdateVenueRequest,
  VenueDto,
  VenueListQuery,
  VenueListRawResponse,
  VenueListResponse,
} from '../../../types/api/organizaciones';

// GET /api/organizaciones responde {organizations, meta}, no {data, meta} — envelope no
// estándar documentado en api-integration.md §7. Se normaliza aquí (capa services/api/), no en
// el interceptor global ni en el hook.
export const getOrganizations = async (query: OrganizationListQuery = {}): Promise<OrganizationListResponse> => {
  const { data } = await apiClient.get<OrganizationListRawResponse>('/organizaciones', { params: query });

  return { data: data.organizations, meta: data.meta };
};

export const getOrganization = async (organizationId: string): Promise<OrganizationDto> => {
  const { data } = await apiClient.get<{ data: OrganizationDto }>(`/organizaciones/${organizationId}`);
  return data.data;
};

export const createOrganization = async (body: CreateOrganizationRequest): Promise<OrganizationDto> => {
  const { data } = await apiClient.post<{ data: OrganizationDto }>('/organizaciones', body);
  return data.data;
};

export const updateOrganization = async (
  organizationId: string,
  body: UpdateOrganizationRequest,
): Promise<OrganizationDto> => {
  const { data } = await apiClient.patch<{ data: OrganizationDto }>(`/organizaciones/${organizationId}`, body);
  return data.data;
};

// GET /api/organizaciones/{organizationId}/sedes responde {venues, meta}, mismo criterio que
// arriba.
export const getVenues = async (organizationId: string, query: VenueListQuery = {}): Promise<VenueListResponse> => {
  const { data } = await apiClient.get<VenueListRawResponse>(`/organizaciones/${organizationId}/sedes`, {
    params: query,
  });

  return { data: data.venues, meta: data.meta };
};

export const getVenue = async (organizationId: string, venueId: string): Promise<VenueDto> => {
  const { data } = await apiClient.get<{ data: VenueDto }>(`/organizaciones/${organizationId}/sedes/${venueId}`);
  return data.data;
};

export const createVenue = async (organizationId: string, body: CreateVenueRequest): Promise<VenueDto> => {
  const { data } = await apiClient.post<{ data: VenueDto }>(`/organizaciones/${organizationId}/sedes`, body);
  return data.data;
};

export const updateVenue = async (
  organizationId: string,
  venueId: string,
  body: UpdateVenueRequest,
): Promise<VenueDto> => {
  const { data } = await apiClient.patch<{ data: VenueDto }>(
    `/organizaciones/${organizationId}/sedes/${venueId}`,
    body,
  );
  return data.data;
};
