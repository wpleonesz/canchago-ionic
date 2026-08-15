import { apiClient } from '../apiClient';
import { env } from '../../../config/env';
import type { ApiSuccessEnvelope } from '../../../types/api/common';
import type { MobileTokenResponse, SessionUser } from '../../../types/api/auth';

// GET /api/auth/login es una redirección de navegador (Keycloak), nunca una llamada Axios —
// ver spec/constitution/api-integration.md §2.
export const buildLoginUrl = (): string => `${env.apiBaseUrl}/auth/login`;

export const redirectToLogin = (): void => {
  window.location.assign(buildLoginUrl());
};

export const getSession = async (): Promise<SessionUser> => {
  const { data } = await apiClient.get<ApiSuccessEnvelope<SessionUser>>('/auth/session');
  return data.data;
};

export const refreshSession = async (): Promise<void> => {
  await apiClient.post('/auth/refresh');
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

// Auth nativa (feature 003) — formulario propio de usuario/contraseña, sin navegador externo.
// El backend habla con Keycloak por detrás (Resource Owner Password Credentials, solo para el
// cliente público canchago-mobile) — ver canchago/spec/features/014-autenticacion-movil-nativa/.
export const loginWithPassword = async (username: string, password: string): Promise<MobileTokenResponse> => {
  const { data } = await apiClient.post<ApiSuccessEnvelope<MobileTokenResponse>>('/auth/mobile/login', {
    username,
    password,
  });
  return data.data;
};
