import { Switch } from 'react-router-dom';
import AdminRoute from '../../../routes/AdminRoute';
import UserDetailPage from './UserDetailPage';
import UserFormPage from './UserFormPage';
import UserProfileEditPage from './UserProfileEditPage';
import UsersListPage from './UsersListPage';

// Router interno del módulo de usuarios, montado por AdminLayout bajo /admin/users (feature 006).
// /admin/users/new debe listarse antes de /admin/users/:userId para no ser interpretado como
// un userId literal "new" por React Router 5.
const UsersModule: React.FC = () => (
  <Switch>
    <AdminRoute exact path="/admin/users" requiredPermissions={['users.read']}>
      <UsersListPage />
    </AdminRoute>
    <AdminRoute exact path="/admin/users/new" requiredPermissions={['users.create']}>
      <UserFormPage mode="create" />
    </AdminRoute>
    <AdminRoute exact path="/admin/users/:userId/edit" requiredPermissions={['users.update']}>
      <UserProfileEditPage />
    </AdminRoute>
    <AdminRoute exact path="/admin/users/:userId" requiredPermissions={['users.read']}>
      <UserDetailPage />
    </AdminRoute>
  </Switch>
);

export default UsersModule;
