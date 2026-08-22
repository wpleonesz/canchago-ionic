import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SESSION_QUERY_KEY } from '../../auth/hooks/useSession';
import { useSessionStore } from '../../../store/sessionStore';
import { getAdminUserProfile, updateAdminUserProfile } from '../../../services/api/endpoints/users';
import type { AdminUserProfileDto, UpdateAdminUserProfileRequest, UserDto } from '../../../types/api/users';
import { USERS_QUERY_KEY } from './useUsers';

export const useUserProfile = (userId: string | undefined) =>
  useQuery({
    queryKey: [USERS_QUERY_KEY, userId, 'profile'],
    queryFn: () => getAdminUserProfile(userId as string),
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });

export const useUpdateUserProfile = (userId: string) => {
  const queryClient = useQueryClient();
  const sessionUserId = useSessionStore(state => state.user?.id);

  return useMutation({
    mutationFn: (body: UpdateAdminUserProfileRequest) => updateAdminUserProfile(userId, body),
    onSuccess: async profile => {
      queryClient.setQueryData<AdminUserProfileDto>([USERS_QUERY_KEY, userId, 'profile'], profile);
      queryClient.setQueryData<UserDto>([USERS_QUERY_KEY, userId], current =>
        current
          ? {
              ...current,
              firstName: profile.firstName,
              lastName: profile.lastName,
            }
          : current,
      );
      await queryClient.invalidateQueries({
        queryKey: [USERS_QUERY_KEY],
        predicate: query => query.queryKey.length === 2 && typeof query.queryKey[1] === 'object',
      });

      if (sessionUserId === userId) {
        await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      }
    },
  });
};
