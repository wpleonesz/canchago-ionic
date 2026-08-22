import type { PaginationMeta } from './common';

// Verificado en canchago/database/roles-permisos/role.db.ts — el select de GET /api/roles NO
// incluye organizationId en cada fila (solo se filtra por él en el query); el response tampoco
// devuelve roles globales (organizationId: null, como Administrador/Futbolista): el backend
// exige organizationId como query param y hace coincidencia estricta. Ver spec 005 "Quiebres
// reales encontrados" — no se agrega un campo organizationId aquí porque el backend no lo envía.
export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
  code: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissionsCount: number;
}

export interface RoleListQuery {
  organizationId: string;
  page?: number;
  pageSize?: number;
}

export interface RoleListResponse {
  data: RoleDto[];
  meta: PaginationMeta;
}
