import { apiClient } from '../apiClient';
import type {
  CreateRoleRequest,
  PermissionDto,
  PermissionListQuery,
  PermissionListResponse,
  RoleDetailDto,
  RoleDto,
  RoleListQuery,
  RoleListResponse,
  UpdateRoleRequest,
  UpdateRolePermissionsRequest,
} from '../../../types/api/roles';

interface RawRoleDto extends Omit<RoleDto, 'permissionsCount'> {
  _count: { permissions: number };
}

interface RawRoleDetailDto extends Omit<RoleDetailDto, 'permissions'> {
  permissions: Array<{ granted: boolean; permission: PermissionDto }>;
}

interface RawRoleListResponse {
  data: RawRoleDto[];
  meta: RoleListResponse['meta'];
}

const mapRoleDetail = (role: RawRoleDetailDto): RoleDetailDto => ({
  ...role,
  permissions: role.permissions.filter(item => item.granted).map(item => item.permission),
});

export const getRoles = async (query: RoleListQuery): Promise<RoleListResponse> => {
  const { data } = await apiClient.get<RawRoleListResponse>('/roles', { params: query });

  return {
    data: data.data.map(({ _count, ...role }) => ({
      ...role,
      permissionsCount: _count.permissions,
    })),
    meta: data.meta,
  };
};

export const getRole = async (roleId: string, organizationId: string): Promise<RoleDetailDto> => {
  const { data } = await apiClient.get<{ data: RawRoleDetailDto }>(`/roles/${roleId}`, {
    params: { organizationId },
  });
  return mapRoleDetail(data.data);
};

export const createRole = async (organizationId: string, body: CreateRoleRequest): Promise<RoleDetailDto> => {
  const { data } = await apiClient.post<{ data: RawRoleDetailDto }>('/roles', body, {
    params: { organizationId },
  });
  return mapRoleDetail(data.data);
};

export const updateRole = async (
  roleId: string,
  organizationId: string,
  body: UpdateRoleRequest,
): Promise<RoleDetailDto> => {
  const { data } = await apiClient.patch<{ data: RawRoleDetailDto }>(`/roles/${roleId}`, body, {
    params: { organizationId },
  });
  return mapRoleDetail(data.data);
};

export const updateRolePermissions = async (
  roleId: string,
  organizationId: string,
  body: UpdateRolePermissionsRequest,
): Promise<RoleDetailDto> => {
  const { data } = await apiClient.patch<{ data: RawRoleDetailDto }>(`/roles/${roleId}/permisos`, body, {
    params: { organizationId },
  });
  return mapRoleDetail(data.data);
};

export const getPermissions = async (query: PermissionListQuery): Promise<PermissionListResponse> => {
  const { data } = await apiClient.get<PermissionListResponse>('/permisos', { params: query });
  return data;
};
