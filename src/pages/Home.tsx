import { businessOutline, personCircleOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import AppButton from '../components/common/AppButton';
import AppPage from '../components/layout/AppPage';
import PermissionGuard from '../features/auth/components/PermissionGuard';
import RoleGuard from '../features/auth/components/RoleGuard';
import { useLogoutMutation } from '../features/auth/hooks/useSession';
import HomeActionCard from '../features/home/components/HomeActionCard';
import ProfileSummary from '../features/home/components/ProfileSummary';
import { useSessionStore } from '../store/sessionStore';
import './home.css';

const Home: React.FC = () => {
  const user = useSessionStore(state => state.user);
  const logoutMutation = useLogoutMutation();

  return (
    <AppPage title="Inicio">
      <main className="home-page">
        {user && (
          <>
            <header className="home-hero">
              <p className="home-hero__eyebrow">Bienvenido a Canchago</p>
              <h1>Hola, {user.name.split(' ')[0]}</h1>
              <p>Todo listo para gestionar tu experiencia deportiva.</p>
            </header>

            <ProfileSummary user={user} />

            <section className="home-section" aria-labelledby="home-access-title">
              <div className="home-section__heading">
                <p>Resumen</p>
                <h2 id="home-access-title">Tu acceso</h2>
              </div>

              <div className="home-action-grid">
                <HomeActionCard
                  icon={personCircleOutline}
                  title="Perfil activo"
                  description="Tu sesión está protegida y lista para usar."
                />

                <RoleGuard role="administrador">
                  <HomeActionCard
                    icon={businessOutline}
                    title="Acceso administrativo"
                    description="Tu rol te permite acceder a herramientas de administración cuando estén disponibles."
                  />
                </RoleGuard>

                <PermissionGuard permission="users.read">
                  <HomeActionCard
                    icon={shieldCheckmarkOutline}
                    title="Consulta de usuarios"
                    description="Tu cuenta tiene permiso de lectura de usuarios."
                  />
                </PermissionGuard>
              </div>
            </section>
          </>
        )}

        <footer className="home-footer">
          <AppButton
            fill="outline"
            color="medium"
            isLoading={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            Cerrar sesión
          </AppButton>
        </footer>
      </main>
    </AppPage>
  );
};

export default Home;
