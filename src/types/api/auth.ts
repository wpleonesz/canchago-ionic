export interface RoleSummary {
  id: string;
  code: string;
  name: string;
}

export interface PermissionSummary {
  id: string;
  code: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roles: RoleSummary[];
  permissions: PermissionSummary[];
}

// POST /api/auth/mobile/token (canchago feature 014) — auth nativa, ver feature 003.
export interface MobileTokenResponse {
  sessionToken: string;
  expiresAt: string;
}
