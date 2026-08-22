import { Redirect } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import LoginPage from '../features/auth/pages/LoginPage';
import AdminLayout from '../layouts/AdminLayout';
import Home from '../pages/Home';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

const AppRoutes: React.FC = () => (
  <IonRouterOutlet>
    <PublicRoute exact path="/login">
      <LoginPage />
    </PublicRoute>
    <ProtectedRoute exact path="/home">
      <Home />
    </ProtectedRoute>
    <ProtectedRoute path="/admin">
      <AdminLayout />
    </ProtectedRoute>
    <Redirect exact from="/" to="/home" />
  </IonRouterOutlet>
);

export default AppRoutes;
