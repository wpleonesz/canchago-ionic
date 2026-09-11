import { apiClient } from '../apiClient';
import type {
  AvailabilityQuery,
  AvailabilitySlotDto,
  BookingDto,
  CreateBookingRequest,
  CreateResourceRequest,
  CreateSlotRequest,
  Paginated,
  ResourceDto,
  UpdateSlotRequest,
} from '../../../types/api/reservas';

export const getResources = async (page = 1, pageSize = 20): Promise<Paginated<ResourceDto>> =>
  (await apiClient.get<Paginated<ResourceDto>>('/resources', { params: { page, pageSize } })).data;
export const getAvailability = async (
  resourceId: string,
  query: AvailabilityQuery,
): Promise<Paginated<AvailabilitySlotDto>> =>
  (await apiClient.get<Paginated<AvailabilitySlotDto>>(`/resources/${resourceId}/availability`, { params: query }))
    .data;
export const createSlot = async (resourceId: string, body: CreateSlotRequest): Promise<AvailabilitySlotDto> =>
  (await apiClient.post<{ data: AvailabilitySlotDto }>(`/resources/${resourceId}/availability`, body)).data.data;
export const createResource = async (
  organizationId: string,
  venueId: string,
  body: CreateResourceRequest,
): Promise<ResourceDto> =>
  (
    await apiClient.post<{ data: ResourceDto }>(
      `/organizaciones/${organizationId}/sedes/${venueId}/resources`,
      body,
    )
  ).data.data;
export const updateSlot = async (
  resourceId: string,
  slotId: string,
  body: UpdateSlotRequest,
): Promise<AvailabilitySlotDto> =>
  (await apiClient.patch<{ data: AvailabilitySlotDto }>(`/resources/${resourceId}/availability/${slotId}`, body))
    .data.data;
export const createBooking = async (body: CreateBookingRequest): Promise<BookingDto> =>
  (await apiClient.post<{ data: BookingDto }>('/bookings', body)).data.data;
export const getOwnBookings = async (page = 1, pageSize = 20): Promise<Paginated<BookingDto>> =>
  (await apiClient.get<Paginated<BookingDto>>('/bookings', { params: { page, pageSize } })).data;
export const cancelOwnBooking = async (bookingId: string): Promise<void> => {
  await apiClient.delete(`/bookings/${bookingId}`);
};
