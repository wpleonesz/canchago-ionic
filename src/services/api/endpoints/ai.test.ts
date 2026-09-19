import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../apiClient';
import { AI_REQUEST_TIMEOUT_MS, getAiSlotRecommendations, getAiUpcomingBookingsSummary } from './ai';

vi.mock('../apiClient', () => ({ apiClient: { post: vi.fn() } }));

describe('AI endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses a timeout longer than the default API timeout and the backend provider maximum', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { generated: false } } });

    await getAiSlotRecommendations({ from: '2030-01-01T00:00:00.000Z', to: '2030-01-02T00:00:00.000Z' });
    await getAiUpcomingBookingsSummary({ horizonDays: 7 });

    expect(AI_REQUEST_TIMEOUT_MS).toBeGreaterThan(120_000);
    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/ai/slot-recommendations', expect.anything(), {
      timeout: AI_REQUEST_TIMEOUT_MS,
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/ai/upcoming-bookings-summary', expect.anything(), {
      timeout: AI_REQUEST_TIMEOUT_MS,
    });
  });
});
