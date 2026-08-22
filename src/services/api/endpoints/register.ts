import { apiClient } from '../apiClient';
import type { ApiSuccessEnvelope } from '../../../types/api/common';
import type { RegisterRequest, RegisterResponse } from '../../../types/api/register';

// Sin autenticación (feature 016 en canchago) — nunca envía credenciales existentes ni
// depende de una sesión. No crea sesión: la app dirige al flujo de login real tras el 201.
export const register = async (body: RegisterRequest): Promise<RegisterResponse> => {
  const { data } = await apiClient.post<ApiSuccessEnvelope<RegisterResponse>>('/auth/register', body);
  return data.data;
};
