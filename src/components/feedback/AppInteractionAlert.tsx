import { useEffect, useState, type ComponentProps } from 'react';
import { IonAlert } from '@ionic/react';

export type AppInteractionAlertKind = 'error' | 'success' | 'warning' | 'info';

interface AppInteractionAlertProps {
  isOpen: boolean;
  kind: AppInteractionAlertKind;
  message: string;
  header?: string;
  buttonText?: string;
  buttons?: ComponentProps<typeof IonAlert>['buttons'];
  onDismiss?: () => void;
}

const DEFAULT_HEADERS: Record<AppInteractionAlertKind, string> = {
  error: 'No se pudo completar la operación',
  success: 'Operación completada',
  warning: 'Revisa esta acción',
  info: 'Información',
};

const AppInteractionAlert: React.FC<AppInteractionAlertProps> = ({
  isOpen,
  kind,
  message,
  header = DEFAULT_HEADERS[kind],
  buttonText = 'Entendido',
  buttons,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen, message]);

  return (
    <IonAlert
      isOpen={isVisible}
      header={header}
      message={message}
      cssClass={`app-interaction-alert app-interaction-alert--${kind}`}
      buttons={buttons ?? [{ text: buttonText, role: 'cancel' }]}
      backdropDismiss
      keyboardClose
      onDidDismiss={() => {
        setIsVisible(false);
        onDismiss?.();
      }}
    />
  );
};

export default AppInteractionAlert;
