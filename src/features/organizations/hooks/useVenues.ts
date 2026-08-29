import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createVenue, getVenue, getVenues, updateVenue } from '../../../services/api/endpoints/organizaciones';
import type { CreateVenueRequest, UpdateVenueRequest, VenueListQuery } from '../../../types/api/organizaciones';
import { organizationKeys } from './useOrganizations';

export const venueKeys = {
  list: (organizationId: string, query: VenueListQuery) => ['venues', organizationId, 'list', query] as const,
  detail: (organizationId: string, venueId: string) => ['venues', organizationId, 'detail', venueId] as const,
};

export const useVenues = (organizationId: string, query: VenueListQuery = {}) =>
  useQuery({
    queryKey: venueKeys.list(organizationId, query),
    queryFn: () => getVenues(organizationId, query),
    enabled: Boolean(organizationId),
    staleTime: 30 * 1000,
  });

export const useVenue = (organizationId: string, venueId: string) =>
  useQuery({
    queryKey: venueKeys.detail(organizationId, venueId),
    queryFn: () => getVenue(organizationId, venueId),
    enabled: Boolean(organizationId && venueId),
    staleTime: 15 * 1000,
  });

export const useCreateVenue = (organizationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateVenueRequest) => createVenue(organizationId, body),
    onSuccess: async venue => {
      queryClient.setQueryData(venueKeys.detail(organizationId, venue.id), venue);
      await queryClient.invalidateQueries({ queryKey: ['venues', organizationId] });
      // El listado de organizaciones muestra venuesCount: debe refrescarse tras crear una sede.
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
};

export const useUpdateVenue = (organizationId: string, venueId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateVenueRequest) => updateVenue(organizationId, venueId, body),
    onSuccess: async venue => {
      queryClient.setQueryData(venueKeys.detail(organizationId, venueId), venue);
      await queryClient.invalidateQueries({ queryKey: ['venues', organizationId] });
    },
  });
};
