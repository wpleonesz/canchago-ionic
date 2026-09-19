import type {
  SlotRecommendationsDto,
  SlotRecommendationsRequest,
  UpcomingBookingsSummaryDto,
  UpcomingBookingsSummaryRequest,
} from '../../../types/api/ai';
import { apiClient } from '../apiClient';

// La generación local tarda mucho más que una llamada CRUD (el modelo puede razonar o cargarse).
// Debe superar AI_PROVIDER_TIMEOUT_MS del backend (máx. 120 s) para que el 504 del servidor llegue
// antes que un corte del cliente, que se vería como "asistente no disponible" con el servidor en 200.
export const AI_REQUEST_TIMEOUT_MS = 130_000;

export const getAiSlotRecommendations = async (
  body: SlotRecommendationsRequest,
): Promise<SlotRecommendationsDto> =>
  (await apiClient.post<{ data: SlotRecommendationsDto }>('/ai/slot-recommendations', body, {
      timeout: AI_REQUEST_TIMEOUT_MS,
    })).data.data;

export const getAiUpcomingBookingsSummary = async (
  body: UpcomingBookingsSummaryRequest,
): Promise<UpcomingBookingsSummaryDto> =>
  (await apiClient.post<{ data: UpcomingBookingsSummaryDto }>('/ai/upcoming-bookings-summary', body, {
      timeout: AI_REQUEST_TIMEOUT_MS,
    })).data.data;
