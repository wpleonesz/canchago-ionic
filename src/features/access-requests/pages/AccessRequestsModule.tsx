import { Switch } from 'react-router-dom';
import AdminRoute from '../../../routes/AdminRoute';
import AccessRequestsPage from './AccessRequestsPage';

// Router interno del módulo de solicitudes de acceso, montado por AdminLayout bajo
// /admin/organizations en reemplazo de su placeholder (feature 008/016) — mismo patrón que
// UsersModule (feature 005/006): AdminLayout monta un <Route> plano, el gate de permisos vive
// aquí adentro.
const AccessRequestsModule: React.FC = () => (
  <Switch>
    <AdminRoute exact path="/admin/organizations" requiredPermissions={['organizaciones.manage']}>
      <AccessRequestsPage />
    </AdminRoute>
  </Switch>
);

export default AccessRequestsModule;
