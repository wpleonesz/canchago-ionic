import { useMemo } from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonPage,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { homeOutline } from 'ionicons/icons';
import AdminNavigation from '../features/admin/components/AdminNavigation';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage';
import AdminModulePendingPage from '../features/admin/pages/AdminModulePendingPage';
import AdminNotFoundPage from '../features/admin/pages/AdminNotFoundPage';
import { filterAdminNavigation, findActiveAdminItem } from '../features/admin/navigation/admin-capabilities';
import { ADMIN_NAVIGATION } from '../features/admin/navigation/admin-navigation';
import UsersModule from '../features/users/pages/UsersModule';
import AdminRoute from '../routes/AdminRoute';
import { useSessionStore } from '../store/sessionStore';
import '../features/admin/admin-layout.css';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const permissions = useSessionStore(state => state.user?.permissions);
  const groups = useMemo(() => filterAdminNavigation(ADMIN_NAVIGATION, permissions), [permissions]);
  const activeItem = findActiveAdminItem(groups, location.pathname);
  const pageTitle = location.pathname === '/admin' ? 'Inicio administrativo' : (activeItem?.label ?? 'Administración');

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
            <IonButtons slot="end">
              <IonButton routerLink="/home" routerDirection="root" aria-label="Volver al inicio">
                <IonIcon slot="icon-only" icon={homeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div className="admin-content__inner">
            <Switch>
              <AdminRoute
                exact
                path="/admin"
                requiredPermissions={ADMIN_NAVIGATION.flatMap(group =>
                  group.items.flatMap(item => item.requiredPermissions),
                )}
              >
                <AdminDashboardPage groups={groups} />
              </AdminRoute>
              <Route path="/admin/users">
                <UsersModule />
              </Route>
              <AdminRoute path="/admin/roles" requiredPermissions={['roles.read']}>
                <AdminModulePendingPage moduleName="Gestión de roles" />
              </AdminRoute>
              <AdminRoute path="/admin/permissions" requiredPermissions={['permisos.read']}>
                <AdminModulePendingPage moduleName="Catálogo de permisos" />
              </AdminRoute>
              <AdminRoute path="/admin/organizations" requiredPermissions={['organizaciones.read']}>
                <AdminModulePendingPage moduleName="Organizaciones y sedes" />
              </AdminRoute>
              <AdminNotFoundPage />
            </Switch>
          </div>
        </IonContent>
      </IonPage>
    </IonSplitPane>
  );
};

export default AdminLayout;
