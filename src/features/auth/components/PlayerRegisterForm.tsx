import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { IonInputPasswordToggle, IonText } from '@ionic/react';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/forms/AppInput';
import { playerRegisterFormSchema, type PlayerRegisterFormValues } from '../../../validation/register';

interface PlayerRegisterFormProps {
  onSubmit: (values: PlayerRegisterFormValues) => Promise<void>;
  submitError?: string | null;
  defaultValues?: Partial<PlayerRegisterFormValues>;
}

const PlayerRegisterForm: React.FC<PlayerRegisterFormProps> = ({ onSubmit, submitError, defaultValues }) => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PlayerRegisterFormValues>({
    resolver: zodResolver(playerRegisterFormSchema),
    defaultValues: { email: '', password: '', firstName: '', lastName: '', ...defaultValues },
  });

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Controller
        name="firstName"
        control={control}
        render={({ field, fieldState }) => (
          <AppInput
            label="Nombre"
            autocomplete="given-name"
            value={field.value}
            disabled={isSubmitting}
            error={fieldState.error?.message}
            onIonInput={event => field.onChange(event.detail.value)}
            onIonBlur={field.onBlur}
          />
        )}
      />

      <Controller
        name="lastName"
        control={control}
        render={({ field, fieldState }) => (
          <AppInput
            label="Apellido"
            autocomplete="family-name"
            value={field.value}
            disabled={isSubmitting}
            error={fieldState.error?.message}
            onIonInput={event => field.onChange(event.detail.value)}
            onIonBlur={field.onBlur}
          />
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <AppInput
            label="Correo electrónico"
            type="email"
            autocomplete="email"
            value={field.value}
            disabled={isSubmitting}
            error={fieldState.error?.message}
            onIonInput={event => field.onChange(event.detail.value)}
            onIonBlur={field.onBlur}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <AppInput
            label="Contraseña"
            type="password"
            autocomplete="new-password"
            value={field.value}
            disabled={isSubmitting}
            error={fieldState.error?.message}
            onIonInput={event => field.onChange(event.detail.value)}
            onIonBlur={field.onBlur}
          >
            <IonInputPasswordToggle slot="end" />
          </AppInput>
        )}
      />

      {submitError && (
        <IonText className="auth-message auth-message--error" role="alert" aria-live="polite">
          <p>{submitError}</p>
        </IonText>
      )}

      <AppButton expand="block" type="submit" isLoading={isSubmitting}>
        Crear cuenta
      </AppButton>
    </form>
  );
};

export default PlayerRegisterForm;
