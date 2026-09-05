import type { ComponentProps } from 'react';
import { IonSelect, IonSelectOption } from '@ionic/react';

export interface AppSelectOption {
  value: string;
  label: string;
}

interface AppSelectProps extends Omit<ComponentProps<typeof IonSelect>, 'label' | 'children'> {
  label: string;
  error?: string;
  options: AppSelectOption[];
  placeholder?: string;
}

// Nunca acepta un valor libre: solo las opciones que se le pasan (requisito de la feature 005 —
// el catálogo de roles/organizaciones siempre viene del backend, nunca hardcodeado ni editable).
const AppSelect: React.FC<AppSelectProps> = ({ label, error, options, placeholder, className, ...rest }) => (
  <IonSelect
    label={label}
    labelPlacement="stacked"
    fill="outline"
    interface="action-sheet"
    placeholder={placeholder}
    className={`app-select${error ? ' ion-invalid ion-touched' : ''}${className ? ` ${className}` : ''}`}
    errorText={error}
    aria-invalid={Boolean(error)}
    {...rest}
  >
    {options.map(option => (
      <IonSelectOption key={option.value} value={option.value}>
        {option.label}
      </IonSelectOption>
    ))}
  </IonSelect>
);

export default AppSelect;
