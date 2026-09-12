import type { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import {
  AiServiceError,
  AuthenticationError,
  mapApiError,
  NetworkError,
  TimeoutError,
  TooManyRequestsError,
  ValidationError,
} from './errorMapper';
import type { ApiErrorBody } from '../../types/api/common';

const buildAxiosError = (overrides: Partial<AxiosError<ApiErrorBody>>): AxiosError<ApiErrorBody> =>
  ({
    isAxiosError: true,
    name: 'AxiosError',
    message: 'mock',
    toJSON: () => ({}),
    ...overrides,
  }) as AxiosError<ApiErrorBody>;

describe('mapApiError', () => {
  it('maps VALIDATION_ERROR to ValidationError with backend details', () => {
    const error = buildAxiosError({
      response: {
        status: 400,
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: [{ field: 'email', message: 'inválido' }],
          },
        },
      } as AxiosError<ApiErrorBody>['response'],
    });

    const mapped = mapApiError(error);

    expect(mapped).toBeInstanceOf(ValidationError);
    expect(mapped.httpStatus).toBe(400);
    expect(mapped.details?.[0].field).toBe('email');
  });

  it('maps UNAUTHORIZED to AuthenticationError', () => {
    const error = buildAxiosError({
      response: {
        status: 401,
        data: { error: { code: 'UNAUTHORIZED', message: 'Sesión requerida' } },
      } as AxiosError<ApiErrorBody>['response'],
    });

    expect(mapApiError(error)).toBeInstanceOf(AuthenticationError);
  });

  it('maps a missing response to NetworkError', () => {
    const error = buildAxiosError({ response: undefined });

    expect(mapApiError(error)).toBeInstanceOf(NetworkError);
  });

  it('maps ECONNABORTED to TimeoutError', () => {
    const error = buildAxiosError({ code: 'ECONNABORTED', response: undefined });

    expect(mapApiError(error)).toBeInstanceOf(TimeoutError);
  });

  it('maps AI provider and rate-limit errors without exposing transport details', () => {
    const aiError = buildAxiosError({
      response: {
        status: 503,
        data: { error: { code: 'AI_PROVIDER_UNAVAILABLE', message: 'Asistente no disponible' } },
      } as AxiosError<ApiErrorBody>['response'],
    });
    const rateError = buildAxiosError({
      response: {
        status: 429,
        data: { error: { code: 'TOO_MANY_REQUESTS', message: 'Intenta más tarde' } },
      } as AxiosError<ApiErrorBody>['response'],
    });

    expect(mapApiError(aiError)).toBeInstanceOf(AiServiceError);
    expect(mapApiError(rateError)).toBeInstanceOf(TooManyRequestsError);
  });
});
