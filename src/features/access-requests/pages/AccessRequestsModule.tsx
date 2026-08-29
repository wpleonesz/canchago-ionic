import { Switch } from 'react-router-dom';
import AdminRoute from '../../../routes/AdminRoute';
import AccessRequestsPage from './AccessRequestsPage';

// Router interno del módulo de solicitudes de acceso. Hasta la feature 010 ocupaba en solitario
// /admin/organizations; ahora ese path lo posee OrganizationsModule (listado/CRUD de
// organizaciones y sedes) y este módulo se monta como su subruta
// /admin/organizations/access-requests, evitando duplicar el ítem "Organizaciones" del menú
// vertical. Mismo patrón que UsersModule: el gate de permisos vive aquí adentro.
const AccessRequestsModule: React.FC = () => (
  <Switch>
    <AdminRoute exact path="/admin/organizations/access-requests" requiredPermissions={['organizaciones.manage']}>
      <AccessRequestsPage />
    </AdminRoute>
  </Switch>
);

export default AccessRequestsModule;
