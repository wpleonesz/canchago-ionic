import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelOwnBooking,
  createBooking,
  createResource,
  createSlot,
  getAvailability,
  getOwnBookings,
  getResources,
  updateSlot,
} from '../../../services/api/endpoints/reservas';
import type {
  AvailabilityQuery,
  CreateBookingRequest,
  CreateResourceRequest,
  CreateSlotRequest,
  UpdateSlotRequest,
} from '../../../types/api/reservas';

export const bookingKeys = {
  all: ['bookings'] as const,
  resources: (page: number) => ['resources', page] as const,
  availability: (id: string, query: AvailabilityQuery) => ['availability', id, query] as const,
};
export const useResources = (page = 1) =>
  useQuery({ queryKey: bookingKeys.resources(page), queryFn: () => getResources(page) });
export const useAvailability = (resourceId: string, query: AvailabilityQuery) =>
  useQuery({
    queryKey: bookingKeys.availability(resourceId, query),
    queryFn: () => getAvailability(resourceId, query),
    enabled: Boolean(resourceId && query.from && query.to),
    refetchOnWindowFocus: true,
  });
export const useOwnBookings = (page = 1) =>
  useQuery({ queryKey: [...bookingKeys.all, page], queryFn: () => getOwnBookings(page) });
export const useCreateBooking = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBookingRequest) => createBooking(body),
    retry: false,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: bookingKeys.all });
      await client.invalidateQueries({ queryKey: ['availability'] });
    },
  });
};
export const useCancelBooking = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: cancelOwnBooking,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: bookingKeys.all });
      await client.invalidateQueries({ queryKey: ['availability'] });
    },
  });
};
export const useCreateSlot = (resourceId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSlotRequest) => createSlot(resourceId, body),
    onSuccess: async () => client.invalidateQueries({ queryKey: ['availability', resourceId] }),
  });
};
export const useCreateResource = (organizationId: string, venueId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateResourceRequest) => createResource(organizationId, venueId, body),
    onSuccess: async () => client.invalidateQueries({ queryKey: ['resources'] }),
  });
};
export const useUpdateSlot = (resourceId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, body }: { slotId: string; body: UpdateSlotRequest }) =>
      updateSlot(resourceId, slotId, body),
    onSuccess: async () => client.invalidateQueries({ queryKey: ['availability', resourceId] }),
  });
};
