import { useMemo } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import AdminNavigation from '../features/admin/components/AdminNavigation';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage';
import AdminNotFoundPage from '../features/admin/pages/AdminNotFoundPage';
import { filterAdminNavigation, findActiveAdminItem } from '../features/admin/navigation/admin-capabilities';
import { ADMIN_NAVIGATION } from '../features/admin/navigation/admin-navigation';
import OrganizationsModule from '../features/organizations/pages/OrganizationsModule';
import UsersModule from '../features/users/pages/UsersModule';
import OwnProfilePage from '../features/users/pages/OwnProfilePage';
import PermissionsListPage from '../features/roles/pages/PermissionsListPage';
import RolesModule from '../features/roles/pages/RolesModule';
import AdminRoute from '../routes/AdminRoute';
import { useSessionStore } from '../store/sessionStore';
import '../features/admin/admin-layout.css';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const permissions = useSessionStore(state => state.user?.permissions);
  const groups = useMemo(() => filterAdminNavigation(ADMIN_NAVIGATION, permissions), [permissions]);
  const activeItem = findActiveAdminItem(groups, location.pathname);
  const pageTitle =
    location.pathname === '/admin'
      ? 'Inicio'
      : location.pathname === '/admin/profile'
        ? 'Mi perfil'
        : (activeItem?.label ?? 'Administración');

  return (
    <IonSplitPane contentId="admin-content" when="(min-width: 900px)" className="admin-shell">
      <AdminNavigation groups={groups} />
      <IonPage id="admin-content" className="admin-content">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton menu="admin-menu" aria-label="Abrir menú administrativo" />
            </IonButtons>
            <IonTitle>{pageTitle}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div className="admin-content__inner">
            <Switch>
              {/* Sin gate de permisos: /admin es ahora el destino de inicio de todo usuario
                  autenticado (fusión con la antigua /home), tenga o no capacidades
                  administrativas — AdminDashboardPage ya se adapta a ese caso. Los módulos
                  concretos de abajo sí exigen su propio permiso. */}
              <Route exact path="/admin">
                <AdminDashboardPage groups={groups} />
              </Route>
              <Route exact path="/admin/profile">
                <OwnProfilePage />
              </Route>
              <Route path="/admin/users">
                <UsersModule />
              </Route>
              <Route path="/admin/roles">
                <RolesModule />
              </Route>
              <AdminRoute path="/admin/permissions" requiredPermissions={['permisos.read']}>
                <PermissionsListPage />
              </AdminRoute>
              <Route path="/admin/organizations">
                <OrganizationsModule />
              </Route>
              <AdminNotFoundPage />
            </Switch>
          </div>
        </IonContent>
      </IonPage>
    </IonSplitPane>
  );
};

export default AdminLayout;
