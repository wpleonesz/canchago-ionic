import { useQuery } from '@tanstack/react-query';
import { getUser, getUsers } from '../../../services/api/endpoints/users';
import type { UserListQuery } from '../../../types/api/users';

export const USERS_QUERY_KEY = 'users' as const;

// staleTime corto: a diferencia de un catálogo (roles/permisos), la lista de usuarios es un
// dato administrativo que otros admins pueden modificar en paralelo — se prioriza frescura
// (ver spec 005 "Decisiones").
export const useUsers = (query: UserListQuery) =>
  useQuery({
    queryKey: [USERS_QUERY_KEY, query],
    queryFn: () => getUsers(query),
    staleTime: 30 * 1000,
  });

export const useUser = (userId: string | undefined) =>
  useQuery({
    queryKey: [USERS_QUERY_KEY, userId],
    queryFn: () => getUser(userId as string),
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });
