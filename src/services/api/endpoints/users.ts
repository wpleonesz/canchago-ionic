import { apiClient } from '../apiClient';
import type { ApiSuccessEnvelope } from '../../../types/api/common';
import type {
  AdminUserProfileDto,
  CreateUserRequest,
  UpdateAdminUserProfileRequest,
  UpdateUserRequest,
  UserDto,
  UserListQuery,
  UserListResponse,
  UserRoleDto,
} from '../../../types/api/users';

export const getUsers = async (query: UserListQuery): Promise<UserListResponse> => {
  const { data } = await apiClient.get<UserListResponse>('/users', { params: query });
  return data;
};

export const getUser = async (userId: string): Promise<UserDto> => {
  const { data } = await apiClient.get<ApiSuccessEnvelope<UserDto>>(`/users/${userId}`);
  return data.data;
};

export const getAdminUserProfile = async (userId: string): Promise<AdminUserProfileDto> => {
  const { data } = await apiClient.get<ApiSuccessEnvelope<AdminUserProfileDto>>(`/users/${userId}/profile`);
  return data.data;
};

export const updateAdminUserProfile = async (
  userId: string,
  body: UpdateAdminUserProfileRequest,
): Promise<AdminUserProfileDto> => {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<AdminUserProfileDto>>(`/users/${userId}/profile`, body);
  return data.data;
};

export const createUser = async (body: CreateUserRequest): Promise<UserDto> => {
  const { data } = await apiClient.post<ApiSuccessEnvelope<UserDto>>('/users', body);
  return data.data;
};

export const updateUser = async (userId: string, body: UpdateUserRequest): Promise<UserDto> => {
  const { data } = await apiClient.patch<ApiSuccessEnvelope<UserDto>>(`/users/${userId}`, body);
  return data.data;
};

export const deactivateUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/users/${userId}`);
};

export const getUserRoles = async (userId: string): Promise<UserRoleDto[]> => {
  const { data } = await apiClient.get<{ data: UserRoleDto[]; meta: { total: number } }>(`/users/${userId}/roles`);
  return data.data;
};

export const assignUserRoles = async (userId: string, roleIds: string[]): Promise<UserRoleDto[]> => {
  const { data } = await apiClient.post<{ data: UserRoleDto[] }>(`/users/${userId}/roles`, { roleIds });
  return data.data;
};

export const removeUserRole = async (userId: string, roleId: string): Promise<void> => {
  await apiClient.delete(`/users/${userId}/roles/${roleId}`);
};
