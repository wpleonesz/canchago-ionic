import type { ComponentProps } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { useSession } from '../features/auth/hooks/useSession';

type PublicRouteProps = ComponentProps<typeof Route>;

// Usada en /login: si ya hay sesión válida, no tiene sentido volver a mostrar el login.
const PublicRoute: React.FC<PublicRouteProps> = ({ children, ...routeProps }) => {
  const { isSuccess } = useSession();

  if (isSuccess) {
    return (
      <Route {...routeProps}>
        <Redirect to="/admin" />
      </Route>
    );
  }

  return <Route {...routeProps}>{children}</Route>;
};

export default PublicRoute;
