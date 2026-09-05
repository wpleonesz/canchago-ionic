import { Switch } from 'react-router-dom';
import AdminRoute from '../../../routes/AdminRoute';
import RoleDetailPage from './RoleDetailPage';
import RoleFormPage from './RoleFormPage';
import RolesListPage from './RolesListPage';
import PermissionManagementPage from './PermissionManagementPage';

const RolesModule: React.FC = () => (
  <Switch>
    <AdminRoute
      exact
      path="/admin/roles"
      requiredPermissions={['roles.read', 'organizaciones.read']}
      requireAllPermissions
    >
      <RolesListPage />
    </AdminRoute>
    <AdminRoute
      exact
      path="/admin/roles/new"
      requiredPermissions={['roles.manage', 'permisos.read']}
      requireAllPermissions
    >
      <RoleFormPage mode="create" />
    </AdminRoute>
    <AdminRoute
      exact
      path="/admin/roles/:roleId/edit"
      requiredPermissions={['roles.manage', 'permisos.read']}
      requireAllPermissions
    >
      <RoleFormPage mode="edit" />
    </AdminRoute>
    <AdminRoute
      exact
      path="/admin/roles/:roleId/permissions"
      requiredPermissions={['roles.read', 'roles.manage', 'permisos.read']}
      requireAllPermissions
    >
      <PermissionManagementPage />
    </AdminRoute>
    <AdminRoute exact path="/admin/roles/:roleId" requiredPermissions={['roles.read']}>
      <RoleDetailPage />
    </AdminRoute>
  </Switch>
);

export default RolesModule;
