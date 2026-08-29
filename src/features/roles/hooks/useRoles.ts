import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRole, getPermissions, getRole, getRoles, updateRole } from '../../../services/api/endpoints/roles';
import type { CreateRoleRequest, RoleListQuery, UpdateRoleRequest } from '../../../types/api/roles';

export const roleKeys = {
  all: ['roles'] as const,
  list: (query: RoleListQuery) => ['roles', 'list', query] as const,
  detail: (organizationId: string, roleId: string) => ['roles', 'detail', organizationId, roleId] as const,
  permissions: ['permissions'] as const,
};

export const useRoles = (organizationId: string | undefined, page = 1, pageSize = 50) =>
  useQuery({
    queryKey: roleKeys.list({ organizationId: organizationId ?? '', page, pageSize }),
    queryFn: () => getRoles({ organizationId: organizationId as string, page, pageSize }),
    enabled: Boolean(organizationId),
    staleTime: 5 * 60 * 1000,
  });

export const useAdminRoles = (query: RoleListQuery) =>
  useQuery({
    queryKey: roleKeys.list(query),
    queryFn: () => getRoles(query),
    enabled: Boolean(query.organizationId),
    staleTime: 30 * 1000,
  });

export const useRole = (roleId: string, organizationId: string) =>
  useQuery({
    queryKey: roleKeys.detail(organizationId, roleId),
    queryFn: () => getRole(roleId, organizationId),
    enabled: Boolean(roleId && organizationId),
    staleTime: 15 * 1000,
  });

export const usePermissions = () =>
  useInfiniteQuery({
    queryKey: roleKeys.permissions,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getPermissions({ page: pageParam, pageSize: 100 }),
    getNextPageParam: lastPage => (lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined),
    staleTime: 5 * 60 * 1000,
  });

export const useCreateRole = (organizationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRoleRequest) => createRole(organizationId, body),
    onSuccess: async role => {
      queryClient.setQueryData(roleKeys.detail(organizationId, role.id), role);
      await queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
};

export const useUpdateRole = (roleId: string, organizationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateRoleRequest) => updateRole(roleId, organizationId, body),
    onSuccess: async role => {
      queryClient.setQueryData(roleKeys.detail(organizationId, roleId), role);
      await queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
};
