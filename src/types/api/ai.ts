export type PreferredTimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface SlotRecommendationsRequest {
  from: string;
  to: string;
  preferredTimeOfDay?: PreferredTimeOfDay;
  maxHourlyPrice?: number;
}

export interface SlotRecommendationDto {
  availabilitySlotId: string;
  resourceId: string;
  resourceName: string;
  venueName: string;
  address: string;
  hourlyPrice: string;
  currency: 'USD';
  startsAt: string;
  endsAt: string;
  reason: string;
}

export interface SlotRecommendationsDto {
  generated: boolean;
  explanation: string;
  recommendations: SlotRecommendationDto[];
}

export interface UpcomingBookingsSummaryRequest {
  horizonDays: number;
}

export interface UpcomingBookingsSummaryDto {
  generated: boolean;
  summary: string;
  bookingsCount: number;
}
