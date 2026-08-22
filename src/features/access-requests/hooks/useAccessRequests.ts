import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveAccessRequest,
  getAccessRequests,
  rejectAccessRequest,
} from '../../../services/api/endpoints/access-requests';
import type { AccessRequestListQuery } from '../../../types/api/access-requests';

export const ACCESS_REQUESTS_QUERY_KEY = 'access-requests' as const;

export const useAccessRequests = (query: AccessRequestListQuery) =>
  useQuery({
    queryKey: [ACCESS_REQUESTS_QUERY_KEY, query],
    queryFn: () => getAccessRequests(query),
    staleTime: 30 * 1000,
  });

export const useApproveAccessRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => approveAccessRequest(requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ACCESS_REQUESTS_QUERY_KEY] });
    },
  });
};

export const useRejectAccessRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      rejectAccessRequest(requestId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ACCESS_REQUESTS_QUERY_KEY] });
    },
  });
};
