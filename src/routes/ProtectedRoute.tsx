import type { ComponentProps } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useSession } from '../features/auth/hooks/useSession';

type ProtectedRouteProps = ComponentProps<typeof Route>;

// Sin sesión válida no se entra — el backend es la autoridad final, esto solo evita el
// parpadeo de UI protegida antes de que el 401 real llegue (tech-stack.md §6).
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, ...routeProps }) => {
  const { isPending, isError } = useSession();

  if (isPending) {
    return (
      <Route {...routeProps}>
        <IonSpinner name="dots" />
      </Route>
    );
  }

  if (isError) {
    return (
      <Route {...routeProps}>
        <Redirect to="/login" />
      </Route>
    );
  }

  return <Route {...routeProps}>{children}</Route>;
};

export default ProtectedRoute;
