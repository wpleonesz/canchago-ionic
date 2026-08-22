import type { PaginationMeta } from './common';

// Roles[] tal como los devuelve /api/users*: el objeto Role completo, distinto del
// RoleSummary {id, code, name} que trae SessionUser — ver spec 005 "Contrato de API consumido".
export interface UserRoleDto {
  id: string;
  organizationId: string | null;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  active: boolean;
  roles: UserRoleDto[];
  createdAt: string;
  // Ausente en la respuesta de POST /api/users (ver spec 005) — presente en GET/PATCH.
  updatedAt?: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roleIds?: string[];
}

export type UpdateUserRequest = Partial<CreateUserRequest>;

// orderBy se limita a 'email' | 'createdAt' — 'name' no existe como columna real, dispararía
// un 500 (ver spec 005, quiebre documentado). active solo admite 'true' u omitirse: 'false'
// no filtra a inactivos, es equivalente a omitir el parámetro.
export interface UserListQuery {
  page?: number;
  pageSize?: number;
  organizationId?: string;
  active?: true;
  search?: string;
  orderBy?: 'email' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface UserListResponse {
  data: UserDto[];
  meta: PaginationMeta;
}

export interface AdminUserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  active: boolean;
  profileUpdatedAt: string;
}

export interface UpdateAdminUserProfileRequest {
  firstName?: string;
  lastName?: string;
  expectedProfileUpdatedAt: string;
}
