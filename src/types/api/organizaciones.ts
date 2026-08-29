import type { PaginationMeta } from './common';

// Modelo real: Organization (tabla organizations). status es texto libre en el backend
// (VARCHAR sin enum) — solo 'ACTIVE' y 'PENDING_APPROVAL' se escriben hoy, ver
// api-integration.md. venuesCount solo viene poblado en el listado (GET /organizaciones).
export interface OrganizationDto {
  id: string;
  name: string;
  legalName: string | null;
  taxIdentification: string | null;
  email: string | null;
  phone: string | null;
  domain: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  venuesCount?: number;
}

// Solo lo que necesita el picker de organización (features/users, features/roles) — id y name.
export type OrganizationSummary = Pick<OrganizationDto, 'id' | 'name'>;

export interface OrganizationListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  orderBy?: 'name' | 'createdAt';
  order?: 'asc' | 'desc';
}

// Envelope real no estándar de GET /api/organizaciones: {organizations, meta}, no {data, meta}
// (ver api-integration.md §7). Se normaliza en services/api/endpoints/organizaciones.ts.
export interface OrganizationListRawResponse {
  organizations: OrganizationDto[];
  meta: PaginationMeta;
}

export interface OrganizationListResponse {
  data: OrganizationDto[];
  meta: PaginationMeta;
}

export interface CreateOrganizationRequest {
  name: string;
  legalName?: string;
  taxIdentification?: string;
  email?: string;
  phone?: string;
  domain?: string;
}

export interface UpdateOrganizationRequest extends Partial<CreateOrganizationRequest> {
  expectedUpdatedAt: string;
}

// Modelo real: Venue (tabla venues) — "sede" es solo el término en español usado en las rutas
// del backend (/organizaciones/{id}/sedes), el modelo Prisma real se llama Venue.
export interface VenueDto {
  id: string;
  organizationId: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface VenueListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  orderBy?: 'name' | 'createdAt';
  order?: 'asc' | 'desc';
}

// Envelope real no estándar de GET /api/organizaciones/{id}/sedes: {venues, meta}.
export interface VenueListRawResponse {
  venues: VenueDto[];
  meta: PaginationMeta;
}

export interface VenueListResponse {
  data: VenueDto[];
  meta: PaginationMeta;
}

export interface CreateVenueRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface UpdateVenueRequest extends Partial<CreateVenueRequest> {
  expectedUpdatedAt: string;
}
