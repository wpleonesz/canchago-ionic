import { describe, expect, it } from 'vitest';

import { aiRecommendationFormSchema } from './ai';

const date = (days: number): string => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
};

describe('AI assistant form validation', () => {
  it('accepts structured preferences without arbitrary prompt text', () => {
    expect(
      aiRecommendationFormSchema.safeParse({
        fromDate: date(1),
        toDate: date(2),
        preferredTimeOfDay: 'EVENING',
        maxHourlyPrice: '25',
      }).success,
    ).toBe(true);
  });

  it('rejects past and overlong ranges', () => {
    expect(
      aiRecommendationFormSchema.safeParse({
        fromDate: date(-1),
        toDate: date(1),
        preferredTimeOfDay: '',
        maxHourlyPrice: '',
      }).success,
    ).toBe(false);
    expect(
      aiRecommendationFormSchema.safeParse({
        fromDate: date(1),
        toDate: date(9),
        preferredTimeOfDay: '',
        maxHourlyPrice: '',
      }).success,
    ).toBe(false);
  });
});
