import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelOwnBooking,
  createBooking,
  createMonthlySchedule,
  createResource,
  createSlot,
  getAvailability,
  getOwnBookings,
  getManagedBookings,
  getResources,
  updateSlot,
  updateScheduleDay,
  updateResource,
} from '../../../services/api/endpoints/reservas';
import type {
  AvailabilityQuery,
  CreateBookingRequest,
  CreateMonthlyScheduleRequest,
  CreateResourceRequest,
  CreateSlotRequest,
  UpdateSlotRequest,
  UpdateScheduleDayRequest,
  UpdateResourceRequest,
} from '../../../types/api/reservas';
import { isResourceId } from '../../../validation/resource-id';

export const bookingKeys = {
  all: ['bookings'] as const,
  resources: (page: number, includeInactive = false) => ['resources', page, includeInactive] as const,
  availability: (id: string, query: AvailabilityQuery) => ['availability', id, query] as const,
  managed: (id: string, page: number) => ['bookings', 'managed', id, page] as const,
};
export const useResources = (page = 1, includeInactive = false) =>
  useQuery({
    queryKey: bookingKeys.resources(page, includeInactive),
    queryFn: () => getResources(page, 20, includeInactive),
  });
export const useAvailability = (resourceId: string, query: AvailabilityQuery) =>
  useQuery({
    queryKey: bookingKeys.availability(resourceId, query),
    queryFn: () => getAvailability(resourceId, query),
    enabled: isResourceId(resourceId) && Boolean(query.from && query.to),
    refetchOnWindowFocus: true,
  });
export const useOwnBookings = (page = 1) =>
  useQuery({ queryKey: [...bookingKeys.all, page], queryFn: () => getOwnBookings(page) });
export const useManagedBookings = (resourceId: string, page = 1) =>
  useQuery({
    queryKey: bookingKeys.managed(resourceId, page),
    queryFn: () => getManagedBookings(resourceId, page),
    enabled: isResourceId(resourceId),
  });
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
export const useCreateMonthlySchedule = (resourceId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMonthlyScheduleRequest) => createMonthlySchedule(resourceId, body),
    onSuccess: async () => client.invalidateQueries({ queryKey: ['availability', resourceId] }),
  });
};
export const useUpdateScheduleDay = (resourceId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateScheduleDayRequest) => updateScheduleDay(resourceId, body),
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
export const useUpdateResource = (resourceId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateResourceRequest) => updateResource(resourceId, body),
    onSuccess: async () => client.invalidateQueries({ queryKey: ['resources'] }),
  });
};
export const useUpdateSlot = (resourceId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, body }: { slotId: string; body: UpdateSlotRequest }) => updateSlot(resourceId, slotId, body),
    onSuccess: async () => client.invalidateQueries({ queryKey: ['availability', resourceId] }),
  });
};
