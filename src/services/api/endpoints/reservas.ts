import { apiClient } from '../apiClient';
import type {
  AvailabilityQuery,
  AvailabilitySlotDto,
  BookingDto,
  CreateBookingRequest,
  CreateMonthlyScheduleRequest,
  CreateResourceRequest,
  CreateSlotRequest,
  Paginated,
  ManagedBookingDto,
  ResourceDto,
  UpdateSlotRequest,
  UpdateScheduleDayRequest,
  UpdateResourceRequest,
} from '../../../types/api/reservas';
import { isResourceId } from '../../../validation/resource-id';

export const getResources = async (page = 1, pageSize = 20, includeInactive = false): Promise<Paginated<ResourceDto>> =>
  (
    await apiClient.get<Paginated<ResourceDto>>('/resources', {
      params: { page, pageSize, ...(includeInactive ? { includeInactive: 'true' } : {}) },
    })
  ).data;
export const getAvailability = async (
  resourceId: string,
  query: AvailabilityQuery,
): Promise<Paginated<AvailabilitySlotDto>> => {
  if (!isResourceId(resourceId)) throw new Error('No se puede consultar disponibilidad sin una cancha válida.');
  return (
    await apiClient.get<Paginated<AvailabilitySlotDto>>(`/resources/${resourceId}/availability`, { params: query })
  ).data;
};
export const createSlot = async (resourceId: string, body: CreateSlotRequest): Promise<AvailabilitySlotDto> =>
  (await apiClient.post<{ data: AvailabilitySlotDto }>(`/resources/${resourceId}/availability`, body)).data.data;
export const createMonthlySchedule = async (resourceId: string, body: CreateMonthlyScheduleRequest): Promise<number> =>
  (await apiClient.post<{ data: { created: number } }>(`/resources/${resourceId}/availability/batch`, body)).data.data
    .created;
export const updateScheduleDay = async (resourceId: string, body: UpdateScheduleDayRequest): Promise<number> =>
  (await apiClient.patch<{ data: { updated: number } }>(`/resources/${resourceId}/availability/batch`, body)).data.data
    .updated;
export const createResource = async (
  organizationId: string,
  venueId: string,
  body: CreateResourceRequest,
): Promise<ResourceDto> =>
  (await apiClient.post<{ data: ResourceDto }>(`/organizaciones/${organizationId}/sedes/${venueId}/resources`, body))
    .data.data;
export const updateResource = async (resourceId: string, body: UpdateResourceRequest): Promise<ResourceDto> =>
  (await apiClient.patch<{ data: ResourceDto }>(`/resources/${resourceId}`, body)).data.data;
export const getManagedBookings = async (
  resourceId: string,
  page = 1,
  pageSize = 20,
): Promise<Paginated<ManagedBookingDto>> =>
  (
    await apiClient.get<Paginated<ManagedBookingDto>>(`/resources/${resourceId}/bookings`, {
      params: { page, pageSize },
    })
  ).data;
export const updateSlot = async (
  resourceId: string,
  slotId: string,
  body: UpdateSlotRequest,
): Promise<AvailabilitySlotDto> =>
  (await apiClient.patch<{ data: AvailabilitySlotDto }>(`/resources/${resourceId}/availability/${slotId}`, body)).data
    .data;
export const createBooking = async (body: CreateBookingRequest): Promise<BookingDto> =>
  (await apiClient.post<{ data: BookingDto }>('/bookings', body)).data.data;
export const getOwnBookings = async (page = 1, pageSize = 20): Promise<Paginated<BookingDto>> =>
  (await apiClient.get<Paginated<BookingDto>>('/bookings', { params: { page, pageSize } })).data;
export const cancelOwnBooking = async (bookingId: string): Promise<void> => {
  await apiClient.delete(`/bookings/${bookingId}`);
};
