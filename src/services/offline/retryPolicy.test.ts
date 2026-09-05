import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthenticationError,
  AuthorizationError,
  BusinessRuleError,
  NetworkError,
  ServerError,
  TimeoutError,
  ValidationError,
} from '../api/errorMapper';
import { computeNextAttempt, isRetryableError, MAX_AUTO_ATTEMPTS } from './retryPolicy';

describe('services/offline/retryPolicy', () => {
  describe('isRetryableError', () => {
    it('treats network, timeout and server errors as retryable', () => {
      expect(isRetryableError(new NetworkError('offline'))).toBe(true);
      expect(isRetryableError(new TimeoutError('slow'))).toBe(true);
      expect(isRetryableError(new ServerError('boom'))).toBe(true);
    });

    it('treats conflict, validation and auth errors as terminal (not retryable)', () => {
      expect(isRetryableError(new BusinessRuleError('conflict'))).toBe(false);
      expect(isRetryableError(new ValidationError('bad input'))).toBe(false);
      expect(isRetryableError(new AuthenticationError('no session'))).toBe(false);
      expect(isRetryableError(new AuthorizationError('forbidden'))).toBe(false);
    });
  });

  describe('computeNextAttempt', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('never exceeds the 5 minute cap even at the max attempt count', () => {
      vi.spyOn(Math, 'random').mockReturnValue(1 - Number.EPSILON);
      const { delayMs } = computeNextAttempt(MAX_AUTO_ATTEMPTS);
      expect(delayMs).toBeLessThanOrEqual(5 * 60_000);
    });

    it('grows with the attempt count (exponential backoff)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(1 - Number.EPSILON);
      const first = computeNextAttempt(0).delayMs;
      const second = computeNextAttempt(1).delayMs;
      const third = computeNextAttempt(2).delayMs;
      expect(second).toBeGreaterThan(first);
      expect(third).toBeGreaterThan(second);
    });

    it('returns an ISO timestamp consistent with the computed delay', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const { delayMs, nextAttemptAt } = computeNextAttempt(0);
      expect(new Date(nextAttemptAt).getTime()).toBe(Date.now() + delayMs);
    });

    it('can return zero delay (full jitter allows immediate retry)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const { delayMs } = computeNextAttempt(3);
      expect(delayMs).toBe(0);
    });
  });
});
