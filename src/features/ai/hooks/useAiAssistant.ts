import { useMutation } from '@tanstack/react-query';

import {
  getAiSlotRecommendations,
  getAiUpcomingBookingsSummary,
} from '../../../services/api/endpoints/ai';
import type { SlotRecommendationsRequest, UpcomingBookingsSummaryRequest } from '../../../types/api/ai';

export const useAiSlotRecommendations = () =>
  useMutation({ mutationFn: (body: SlotRecommendationsRequest) => getAiSlotRecommendations(body), retry: false });

export const useAiUpcomingBookingsSummary = () =>
  useMutation({ mutationFn: (body: UpcomingBookingsSummaryRequest) => getAiUpcomingBookingsSummary(body), retry: false });
