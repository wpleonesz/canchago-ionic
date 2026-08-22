import { IonIcon } from '@ionic/react';
import { businessOutline, chevronForwardOutline, footballOutline } from 'ionicons/icons';
import type { RegisterAccountType } from '../../../types/api/register';

interface AccountTypeStepProps {
  onSelect: (accountType: RegisterAccountType) => void;
}

// Paso propio, no un <select> más — es la decisión que determina el resto del formulario
// (ver spec 008 "Decisiones"): un Gestor de Cancha está a punto de crear una organización real.
const AccountTypeStep: React.FC<AccountTypeStepProps> = ({ onSelect }) => (
  <div className="account-type-step" role="group" aria-label="¿Cómo quieres usar Canchago?">
    <button
      type="button"
      className="account-type-card"
      onClick={() => onSelect('futbolista')}
    >
      <span className="account-type-card__icon" aria-hidden="true">
        <IonIcon icon={footballOutline} />
      </span>
      <span className="account-type-card__copy">
        <strong>Jugar y reservar canchas</strong>
        <small>Encuentra sedes, reserva horarios y gestiona tus partidos.</small>
      </span>
      <IonIcon icon={chevronForwardOutline} className="account-type-card__arrow" aria-hidden="true" />
    </button>

    <button
      type="button"
      className="account-type-card"
      onClick={() => onSelect('gestor-de-cancha')}
    >
      <span className="account-type-card__icon" aria-hidden="true">
        <IonIcon icon={businessOutline} />
      </span>
      <span className="account-type-card__copy">
        <strong>Gestionar una cancha</strong>
        <small>Registra tu organización y tus sedes deportivas.</small>
      </span>
      <IonIcon icon={chevronForwardOutline} className="account-type-card__arrow" aria-hidden="true" />
    </button>
  </div>
);

export default AccountTypeStep;
