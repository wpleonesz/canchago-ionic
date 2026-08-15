import { Capacitor } from '@capacitor/core';
import axios, { type AxiosError } from 'axios';
import { env } from '../../config/env';
import { useSessionStore } from '../../store/sessionStore';
import { clearSessionToken, getSessionToken } from '../storage/secureToken';
import type { ApiErrorBody } from '../../types/api/common';
import { logger } from '../telemetry/logger';
import { AuthenticationError, mapApiError } from './errorMapper';

// withCredentials solo en web: la sesión vive en una cookie HttpOnly (ver tech-stack.md §6).
// En nativo el backend responde con CORS abierto (Access-Control-Allow-Origin: "*") porque no
// hay credenciales de cookie que proteger — pero un origen "*" es incompatible con
// withCredentials: true (el navegador rechaza la combinación), así que en nativo va en false;
// la sesión ahí viaja como Authorization: Bearer, no como cookie.
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  withCredentials: !Capacitor.isNativePlatform(),
});

apiClient.interceptors.request.use(async config => {
  config.headers.set('X-Correlation-ID', crypto.randomUUID());

  // En nativo no hay cookie utilizable (feature 003): el token de sesión viaja como Bearer,
  // leído de storage seguro. En web no se toca — sigue siendo cookie pura (feature 002).
  if (Capacitor.isNativePlatform()) {
    const sessionToken = await getSessionToken();
    if (sessionToken) {
      config.headers.set('Authorization', `Bearer ${sessionToken}`);
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError<ApiErrorBody>) => {
    const mappedError = mapApiError(error);
    logger.error('Solicitud a la API falló', {
      code: mappedError.code,
      httpStatus: mappedError.httpStatus,
      url: error.config?.url,
      method: error.config?.method,
    });

    // Imperativo (no hook): limpia la sesión aunque nadie esté escuchando la query de sesión
    // en ese momento — ver store/sessionStore.ts.
    if (mappedError instanceof AuthenticationError) {
      useSessionStore.getState().clearSession();
      if (Capacitor.isNativePlatform()) {
        void clearSessionToken();
      }
    }

    return Promise.reject(mappedError);
  },
);
