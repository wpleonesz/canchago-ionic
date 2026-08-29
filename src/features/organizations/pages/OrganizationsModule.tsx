import { Route, Switch } from 'react-router-dom';
import AdminRoute from '../../../routes/AdminRoute';
import AccessRequestsModule from '../../access-requests/pages/AccessRequestsModule';
import OrganizationDetailPage from './OrganizationDetailPage';
import OrganizationFormPage from './OrganizationFormPage';
import OrganizationsListPage from './OrganizationsListPage';
import VenueFormPage from './VenueFormPage';

// Router interno del módulo de organizaciones, montado por AdminLayout bajo
// /admin/organizations. Reemplaza el placeholder de la feature 008 (solo solicitudes de
// acceso), que ahora se reubica como subruta interna (/admin/organizations/access-requests) en
// vez de duplicar el ítem "Organizaciones" del menú vertical — ver spec 010 "Decisiones".
//
// Las rutas literales (new, access-requests) deben listarse antes que las paramétricas
// (:organizationId), mismo criterio ya documentado en UsersModule.
const OrganizationsModule: React.FC = () => (
  <Switch>
    <AdminRoute exact path="/admin/organizations" requiredPermissions={['organizaciones.read']}>
      <OrganizationsListPage />
    </AdminRoute>
    <AdminRoute exact path="/admin/organizations/new" requiredPermissions={['organizaciones.manage']}>
      <OrganizationFormPage mode="create" />
    </AdminRoute>
    <Route path="/admin/organizations/access-requests">
      <AccessRequestsModule />
    </Route>
    <AdminRoute exact path="/admin/organizations/:organizationId/edit" requiredPermissions={['organizaciones.manage']}>
      <OrganizationFormPage mode="edit" />
    </AdminRoute>
    <AdminRoute
      exact
      path="/admin/organizations/:organizationId/venues/new"
      requiredPermissions={['organizaciones.manage']}
    >
      <VenueFormPage mode="create" />
    </AdminRoute>
    <AdminRoute
      exact
      path="/admin/organizations/:organizationId/venues/:venueId/edit"
      requiredPermissions={['organizaciones.manage']}
    >
      <VenueFormPage mode="edit" />
    </AdminRoute>
    <AdminRoute exact path="/admin/organizations/:organizationId" requiredPermissions={['organizaciones.read']}>
      <OrganizationDetailPage />
    </AdminRoute>
  </Switch>
);

export default OrganizationsModule;
