import type { PaginationMeta } from './common';

// Solo lo que necesita el picker de organización de la feature 005 — no la feature completa
// de organizaciones (eso es el backlog 006).
export interface OrganizationSummary {
  id: string;
  name: string;
}

// Envelope real no estándar de GET /api/organizaciones: {organizations, meta}, no {data, meta}
// (ver api-integration.md §7). Se normaliza en services/api/endpoints/organizaciones.ts.
export interface OrganizationListRawResponse {
  organizations: OrganizationSummary[];
  meta: PaginationMeta;
}

export interface OrganizationListResponse {
  data: OrganizationSummary[];
  meta: PaginationMeta;
}
