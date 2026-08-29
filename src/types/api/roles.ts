import type { PaginationMeta } from './common';

export interface PermissionDto {
  id: string;
  module: string;
  action: string;
  code: string;
  description: string | null;
  createdAt: string;
}

export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
  code: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissionsCount: number;
}

export interface RoleDetailDto extends Omit<RoleDto, 'permissionsCount'> {
  organizationId: string;
  permissions: PermissionDto[];
}

export interface RoleListQuery {
  organizationId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  isSystem?: boolean;
  orderBy?: 'name' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

export interface RoleListResponse {
  data: RoleDto[];
  meta: PaginationMeta;
}

export interface PermissionListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  module?: string;
}

export interface PermissionListResponse {
  data: PermissionDto[];
  meta: PaginationMeta;
}

export interface CreateRoleRequest {
  name: string;
  description?: string | null;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string | null;
  permissionIds?: string[];
  expectedUpdatedAt: string;
}
