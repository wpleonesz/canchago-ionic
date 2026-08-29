import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createOrganization,
  getOrganization,
  getOrganizations,
  updateOrganization,
} from '../../../services/api/endpoints/organizaciones';
import type {
  CreateOrganizationRequest,
  OrganizationListQuery,
  UpdateOrganizationRequest,
} from '../../../types/api/organizaciones';

export const organizationKeys = {
  all: ['organizations'] as const,
  list: (query: OrganizationListQuery) => ['organizations', 'list', query] as const,
  detail: (organizationId: string) => ['organizations', 'detail', organizationId] as const,
};

export const useOrganizations = (query: OrganizationListQuery = {}) =>
  useQuery({
    queryKey: organizationKeys.list(query),
    queryFn: () => getOrganizations(query),
    staleTime: 30 * 1000,
  });

export const useOrganization = (organizationId: string) =>
  useQuery({
    queryKey: organizationKeys.detail(organizationId),
    queryFn: () => getOrganization(organizationId),
    enabled: Boolean(organizationId),
    staleTime: 15 * 1000,
  });

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrganizationRequest) => createOrganization(body),
    onSuccess: async organization => {
      queryClient.setQueryData(organizationKeys.detail(organization.id), organization);
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
};

export const useUpdateOrganization = (organizationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateOrganizationRequest) => updateOrganization(organizationId, body),
    onSuccess: async organization => {
      queryClient.setQueryData(organizationKeys.detail(organizationId), organization);
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
};
