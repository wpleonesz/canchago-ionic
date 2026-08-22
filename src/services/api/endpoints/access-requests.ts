import { apiClient } from '../apiClient';
import type { ApiSuccessEnvelope } from '../../../types/api/common';
import type {
  AccessRequestListQuery,
  AccessRequestListResponse,
  ApproveAccessRequestResponse,
  RejectAccessRequestResponse,
} from '../../../types/api/access-requests';

// Requiere el permiso organizaciones.manage (validado por el backend, no aquí — mission.md).
export const getAccessRequests = async (
  query: AccessRequestListQuery,
): Promise<AccessRequestListResponse> => {
  const { data } = await apiClient.get<AccessRequestListResponse>('/organizaciones/access-requests', {
    params: query,
  });
  return data;
};

export const approveAccessRequest = async (requestId: string): Promise<ApproveAccessRequestResponse> => {
  const { data } = await apiClient.post<ApiSuccessEnvelope<ApproveAccessRequestResponse>>(
    `/organizaciones/access-requests/${requestId}/approve`,
  );
  return data.data;
};

export const rejectAccessRequest = async (
  requestId: string,
  reason?: string,
): Promise<RejectAccessRequestResponse> => {
  const { data } = await apiClient.post<ApiSuccessEnvelope<RejectAccessRequestResponse>>(
    `/organizaciones/access-requests/${requestId}/reject`,
    reason ? { reason } : {},
  );
  return data.data;
};
