import type { PropsWithChildren } from 'react';
import { IonIcon } from '@ionic/react';
import { footballOutline } from 'ionicons/icons';

interface AuthShellProps {
  title: string;
  description: string;
}

const AuthShell: React.FC<PropsWithChildren<AuthShellProps>> = ({ title, description, children }) => (
  <main className="auth-shell">
    <section className="auth-shell__intro" aria-labelledby="auth-brand-title">
      <div className="auth-shell__brand-mark" aria-hidden="true">
        <IonIcon icon={footballOutline} />
      </div>
      <p className="auth-shell__eyebrow">Tu cancha, a un toque</p>
      <h1 id="auth-brand-title" className="auth-shell__brand-name">
        CanchaGO
      </h1>
      <p className="auth-shell__brand-copy">Gestiona tus espacios deportivos desde cualquier lugar.</p>
    </section>

    <section className="auth-shell__card" aria-labelledby="auth-form-title">
      <header className="auth-shell__card-header">
        <h2 id="auth-form-title">{title}</h2>
        <p>{description}</p>
      </header>
      {children}
    </section>
  </main>
);

export default AuthShell;
