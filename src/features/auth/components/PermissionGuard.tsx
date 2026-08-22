import type { PropsWithChildren } from 'react';
import { hasAnyPermission } from '../../admin/navigation/admin-capabilities';
import { useSessionStore } from '../../../store/sessionStore';

interface PermissionGuardProps {
  permission: string | string[];
}

// Solo oculta/muestra UI — la autorización real siempre la decide el backend (mission.md).
const PermissionGuard: React.FC<PropsWithChildren<PermissionGuardProps>> = ({ permission, children }) => {
  const permissions = useSessionStore(state => state.user?.permissions ?? []);
  const required = Array.isArray(permission) ? permission : [permission];

  return hasAnyPermission(permissions, required) ? <>{children}</> : null;
};

export default PermissionGuard;
