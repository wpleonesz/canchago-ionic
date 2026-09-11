import type { PaginationMeta } from './common';

export interface ResourceDto {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  venue: { id: string; name: string; organization: { id: string; name: string } };
}
export interface AvailabilitySlotDto {
  id: string;
  resourceId: string;
  startsAt: string;
  endsAt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'WITHDRAWN';
  updatedAt: string;
  isBooked?: boolean;
}
export interface BookingDto {
  id: string;
  userId: string;
  resourceId: string;
  availabilitySlotId: string;
  status: 'CONFIRMED' | 'CANCELLED';
  cancelledAt: string | null;
  createdAt: string;
  resource?: ResourceDto;
  availabilitySlot?: AvailabilitySlotDto;
}
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
export interface AvailabilityQuery {
  from: string;
  to: string;
  page?: number;
  pageSize?: number;
  includeAll?: 'true';
}
export interface CreateBookingRequest {
  availabilitySlotId: string;
  idempotencyKey: string;
}
export interface CreateSlotRequest {
  startsAt: string;
  endsAt: string;
  publish?: boolean;
}
export interface CreateResourceRequest {
  name: string;
  description?: string;
}
export interface UpdateSlotRequest {
  startsAt?: string;
  endsAt?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'WITHDRAWN';
  expectedUpdatedAt: string;
}
