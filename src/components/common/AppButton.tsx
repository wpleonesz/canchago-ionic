import type { ComponentProps } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';

interface AppButtonProps extends ComponentProps<typeof IonButton> {
  isLoading?: boolean;
}

// Bloquea el botón mientras isLoading es true, para prevenir doble envío en operaciones críticas (tech-stack.md §14).
const AppButton: React.FC<AppButtonProps> = ({ isLoading = false, disabled, children, ...rest }) => (
  <IonButton className="app-button" disabled={disabled || isLoading} aria-busy={isLoading} {...rest}>
    {isLoading ? <IonSpinner name="dots" aria-label="Procesando" /> : children}
  </IonButton>
);

export default AppButton;
