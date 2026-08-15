import type { ComponentProps } from 'react';
import { IonInput } from '@ionic/react';

interface AppInputProps extends Omit<ComponentProps<typeof IonInput>, 'label' | 'errorText'> {
  label: string;
  error?: string;
}

const AppInput: React.FC<AppInputProps> = ({ label, error, ...rest }) => (
  <IonInput
    label={label}
    labelPlacement="stacked"
    fill="outline"
    className={`app-input${error ? ' ion-invalid ion-touched' : ''}`}
    errorText={error}
    aria-invalid={Boolean(error)}
    {...rest}
  />
);

export default AppInput;
