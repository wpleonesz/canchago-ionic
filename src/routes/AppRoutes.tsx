import { Redirect } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import LoginPage from '../features/auth/pages/LoginPage';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// /admin es ahora el único destino post-login (fusión de la antigua /home con el panel
// administrativo): todo usuario autenticado aterriza ahí, tenga o no capacidades
// administrativas — ver AdminDashboardPage.
const AppRoutes: React.FC = () => (
  <IonRouterOutlet>
    <PublicRoute exact path="/login">
      <LoginPage />
    </PublicRoute>
    <ProtectedRoute path="/admin">
      <AdminLayout />
    </ProtectedRoute>
    <Redirect exact from="/" to="/admin" />
  </IonRouterOutlet>
);

export default AppRoutes;
