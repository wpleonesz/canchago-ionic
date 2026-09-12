import type {
  SlotRecommendationsDto,
  SlotRecommendationsRequest,
  UpcomingBookingsSummaryDto,
  UpcomingBookingsSummaryRequest,
} from '../../../types/api/ai';
import { apiClient } from '../apiClient';

export const getAiSlotRecommendations = async (
  body: SlotRecommendationsRequest,
): Promise<SlotRecommendationsDto> =>
  (await apiClient.post<{ data: SlotRecommendationsDto }>('/ai/slot-recommendations', body)).data.data;

export const getAiUpcomingBookingsSummary = async (
  body: UpcomingBookingsSummaryRequest,
): Promise<UpcomingBookingsSummaryDto> =>
  (await apiClient.post<{ data: UpcomingBookingsSummaryDto }>('/ai/upcoming-bookings-summary', body)).data.data;
