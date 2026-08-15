import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getSession, logout as logoutRequest } from '../../../services/api/endpoints/auth';
import { clearSessionToken } from '../../../services/storage/secureToken';
import { useSessionStore } from '../../../store/sessionStore';

export const SESSION_QUERY_KEY = ['auth', 'session'] as const;

export const useSession = () => {
  const setSession = useSessionStore(state => state.setSession);
  const clearSession = useSessionStore(state => state.clearSession);

  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getSession,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setSession(query.data);
    } else if (query.isError) {
      clearSession();
    }
  }, [query.data, query.isError, setSession, clearSession]);

  return query;
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const clearSession = useSessionStore(state => state.clearSession);

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: async () => {
      clearSession();
      // No-op inofensivo en web (nunca se escribió nada ahí) — limpia el Bearer en nativo.
      await clearSessionToken();
      // Limpia todo lo demás (datos de negocio cacheados), pero la sesión se maneja aparte:
      // queryClient.clear() no fuerza un refetch de las queries activas, así que un
      // ProtectedRoute ya montado nunca se enteraría del logout. resetQueries sí refetch-ea
      // las queries activas — es lo que realmente dispara la redirección a /login.
      queryClient.removeQueries({ predicate: query => query.queryKey[0] !== 'auth' });
      await queryClient.resetQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
};
