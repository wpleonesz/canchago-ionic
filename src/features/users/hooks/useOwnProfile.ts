import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getOwnAvatar,
  getOwnProfile,
  removeOwnAvatar,
  updateOwnAvatar,
  updateOwnProfile,
} from '../../../services/api/endpoints/users';

export const OWN_PROFILE_QUERY_KEY = ['profile', 'own'] as const;

export const useOwnProfile = () => useQuery({ queryKey: OWN_PROFILE_QUERY_KEY, queryFn: getOwnProfile });

export const useOwnAvatar = (enabled: boolean, version?: string | null) =>
  useQuery({
    queryKey: [...OWN_PROFILE_QUERY_KEY, 'avatar', version ?? 'none'],
    queryFn: getOwnAvatar,
    enabled,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

export const useUpdateOwnProfile = () => {
  const client = useQueryClient();
  return useMutation({ mutationFn: updateOwnProfile, onSuccess: profile => client.setQueryData(OWN_PROFILE_QUERY_KEY, profile) });
};

export const useUpdateOwnAvatar = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateOwnAvatar,
    onSuccess: async () => client.invalidateQueries({ queryKey: OWN_PROFILE_QUERY_KEY }),
  });
};

export const useRemoveOwnAvatar = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: removeOwnAvatar,
    onSuccess: async () => client.invalidateQueries({ queryKey: OWN_PROFILE_QUERY_KEY }),
  });
};
