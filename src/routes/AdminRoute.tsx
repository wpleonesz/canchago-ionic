import type { ComponentProps } from 'react';
import { Route } from 'react-router-dom';
import { hasAnyPermission } from '../features/admin/navigation/admin-capabilities';
import AdminAccessDeniedPage from '../features/admin/pages/AdminAccessDeniedPage';
import { useSessionStore } from '../store/sessionStore';

interface AdminRouteProps extends ComponentProps<typeof Route> {
  requiredPermissions: string[];
  requireAllPermissions?: boolean;
}

const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  requiredPermissions,
  requireAllPermissions = false,
  ...routeProps
}) => {
  const permissions = useSessionStore(state => state.user?.permissions);
  const isAllowed = requireAllPermissions
    ? requiredPermissions.every(required => permissions?.some(permission => permission.code === required))
    : hasAnyPermission(permissions, requiredPermissions);

  return <Route {...routeProps}>{isAllowed ? children : <AdminAccessDeniedPage />}</Route>;
};

export default AdminRoute;
