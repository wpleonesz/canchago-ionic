import type { AxiosError } from 'axios';
import type { ApiErrorBody, ApiErrorDetail } from '../../types/api/common';

export abstract class AppClientError extends Error {
  abstract readonly code: string;
  readonly httpStatus?: number;
  readonly details?: ApiErrorDetail[];

  constructor(message: string, httpStatus?: number, details?: ApiErrorDetail[]) {
    super(message);
    this.name = this.constructor.name;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export class ValidationError extends AppClientError {
  readonly code = 'VALIDATION_ERROR';
}

export class AuthenticationError extends AppClientError {
  readonly code = 'UNAUTHORIZED';
}

export class AuthorizationError extends AppClientError {
  readonly code = 'FORBIDDEN';
}

export class NotFoundError extends AppClientError {
  readonly code = 'NOT_FOUND';
}

export class BusinessRuleError extends AppClientError {
  readonly code = 'CONFLICT';
}

export class ServerError extends AppClientError {
  readonly code = 'INTERNAL_ERROR';
}

export class NetworkError extends AppClientError {
  readonly code = 'NETWORK_ERROR';
}

export class TimeoutError extends AppClientError {
  readonly code = 'TIMEOUT_ERROR';
}

export class UnknownError extends AppClientError {
  readonly code = 'UNKNOWN_ERROR';
}

const GENERIC_MESSAGE = 'Ocurrió un error inesperado. Intenta nuevamente.';

// Solo estos códigos existen hoy en canchago (ver api-integration.md §7); BUSINESS_RULE_ERROR/TOO_MANY_REQUESTS
// están reservados en el backend pero ningún endpoint los lanza todavía.
const buildFromBackendCode = (
  code: string | undefined,
  message: string,
  httpStatus: number,
  details?: ApiErrorDetail[],
): AppClientError => {
  switch (code) {
    case 'VALIDATION_ERROR':
      return new ValidationError(message, httpStatus, details);
    case 'UNAUTHORIZED':
      return new AuthenticationError(message, httpStatus, details);
    case 'FORBIDDEN':
      return new AuthorizationError(message, httpStatus, details);
    case 'NOT_FOUND':
      return new NotFoundError(message, httpStatus, details);
    case 'CONFLICT':
      return new BusinessRuleError(message, httpStatus, details);
    case 'INTERNAL_ERROR':
    case 'METHOD_NOT_ALLOWED':
      return new ServerError(message, httpStatus, details);
    default:
      return new UnknownError(message, httpStatus, details);
  }
};

export const mapApiError = (error: AxiosError<ApiErrorBody>): AppClientError => {
  if (error.code === 'ECONNABORTED') {
    return new TimeoutError('La solicitud tardó demasiado. Verifica tu conexión.');
  }

  if (!error.response) {
    return new NetworkError('No se pudo conectar con el servidor. Verifica tu conexión.');
  }

  const body = error.response.data;
  return buildFromBackendCode(
    body?.error?.code,
    body?.error?.message ?? GENERIC_MESSAGE,
    error.response.status,
    body?.error?.details,
  );
};
