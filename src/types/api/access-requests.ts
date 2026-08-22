import type { PaginationMeta } from './common';

// Espejo de selectAccessRequestFields en
// canchago/database/organizaciones-sedes/access-request.db.ts (feature 016).
export interface AccessRequestOrganizationVenue {
  id: string;
  name: string;
  status: string;
}

export interface AccessRequestOrganization {
  id: string;
  name: string;
  status: string;
  venues: AccessRequestOrganizationVenue[];
}

export interface AccessRequestRequester {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

export interface AccessRequestDto {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  organization: AccessRequestOrganization;
  requester: AccessRequestRequester;
}

export interface AccessRequestListQuery {
  page?: number;
  pageSize?: number;
  status?: AccessRequestDto['status'];
}

export interface AccessRequestListResponse {
  data: AccessRequestDto[];
  meta: PaginationMeta;
}

export interface ApproveAccessRequestResponse {
  organizationId: string;
  status: AccessRequestDto['status'];
}

export interface RejectAccessRequestResponse {
  requestId: string;
  status: AccessRequestDto['status'];
}
