import { apiClient } from '../apiClient';
import type { RoleDto, RoleListQuery, RoleListResponse } from '../../../types/api/roles';

// Shape crudo real de GET /api/roles (ver canchago/database/roles-permisos/role.db.ts):
// _count.permissions en vez de un permissionsCount plano. Se normaliza aquí, no en el hook ni
// en el componente (misma decisión que organizaciones.ts — ver spec 005 "Decisiones").
interface RawRoleDto extends Omit<RoleDto, 'permissionsCount'> {
  _count: { permissions: number };
}

interface RawRoleListResponse {
  data: RawRoleDto[];
  meta: RoleListResponse['meta'];
}

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
