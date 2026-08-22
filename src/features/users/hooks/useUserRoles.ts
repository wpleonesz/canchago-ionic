import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignUserRoles, getUserRoles, removeUserRole } from '../../../services/api/endpoints/users';
import { USERS_QUERY_KEY } from './useUsers';

export const useUserRoles = (userId: string | undefined) =>
  useQuery({
    queryKey: [USERS_QUERY_KEY, userId, 'roles'],
    queryFn: () => getUserRoles(userId as string),
    enabled: Boolean(userId),
  });

export const useAssignUserRoles = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleIds: string[]) => assignUserRoles(userId, roleIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY, userId] });
    },
  });
};

export const useRemoveUserRole = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => removeUserRole(userId, roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY, userId] });
    },
  });
};
