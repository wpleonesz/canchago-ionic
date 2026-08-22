import { businessOutline, personCircleOutline } from 'ionicons/icons';
import AppButton from '../components/common/AppButton';
import AppPage from '../components/layout/AppPage';
import { getFirstAdminPath } from '../features/admin/navigation/admin-capabilities';
import { ADMIN_NAVIGATION } from '../features/admin/navigation/admin-navigation';
import { useLogoutMutation } from '../features/auth/hooks/useSession';
import HomeActionCard from '../features/home/components/HomeActionCard';
import ProfileSummary from '../features/home/components/ProfileSummary';
import { useSessionStore } from '../store/sessionStore';
import './home.css';

const Home: React.FC = () => {
  const user = useSessionStore(state => state.user);
  const logoutMutation = useLogoutMutation();
  const adminPath = getFirstAdminPath(ADMIN_NAVIGATION, user?.permissions);

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

                {adminPath && (
                  <HomeActionCard
                    icon={businessOutline}
                    title="Acceso administrativo"
                    description="Gestiona únicamente los módulos habilitados para tu cuenta."
                  >
                    <AppButton fill="clear" routerLink={adminPath} routerDirection="forward">
                      Abrir administración
                    </AppButton>
                  </HomeActionCard>
                )}
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
