import { IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import AppButton from '../common/AppButton';

interface AppErrorStateProps {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

// Mensajes de error tal como los produce errorMapper.ts — nunca stack traces ni detalles
// técnicos crudos (tech-stack.md §8).
const AppErrorState: React.FC<AppErrorStateProps> = ({ message, onRetry, isRetrying = false }) => (
  <div className="app-error-state" role="alert">
    <IonIcon icon={alertCircleOutline} aria-hidden="true" />
    <p>{message}</p>
    {onRetry && (
      <AppButton fill="outline" size="small" isLoading={isRetrying} onClick={onRetry}>
        Reintentar
      </AppButton>
    )}
  </div>
);

export default AppErrorState;
