import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { IonInputPasswordToggle } from '@ionic/react';
import AppButton from '../../../components/common/AppButton';
import AppInteractionAlert from '../../../components/feedback/AppInteractionAlert';
import AppInput from '../../../components/forms/AppInput';
import { managerRegisterFormSchema, type ManagerRegisterFormValues } from '../../../validation/register';

interface ManagerRegisterFormProps {
  onSubmit: (values: ManagerRegisterFormValues) => Promise<void>;
  submitError?: string | null;
  defaultValues?: Partial<ManagerRegisterFormValues>;
}

const ManagerRegisterForm: React.FC<ManagerRegisterFormProps> = ({ onSubmit, submitError, defaultValues }) => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ManagerRegisterFormValues>({
    resolver: zodResolver(managerRegisterFormSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      organization: { name: '', legalName: '', taxIdentification: '', email: '', phone: '', domain: '' },
      venue: { name: '', address: '', phone: '', email: '' },
      ...defaultValues,
    },
  });

  return (
    <form className="auth-form manager-register-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <fieldset className="manager-register-form__section">
        <legend>Tu cuenta</legend>

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
      </fieldset>

      <fieldset className="manager-register-form__section">
        <legend>Tu organización</legend>

        <Controller
          name="organization.name"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Nombre de la organización"
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            />
          )}
        />

        <Controller
          name="organization.legalName"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Razón social (opcional)"
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            />
          )}
        />

        <Controller
          name="organization.taxIdentification"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="RUC / identificación fiscal (opcional)"
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            />
          )}
        />

        <Controller
          name="organization.email"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Correo de la organización (opcional)"
              type="email"
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            />
          )}
        />

        <Controller
          name="organization.phone"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Teléfono de la organización (opcional)"
              type="tel"
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            />
          )}
        />

        <Controller
          name="organization.domain"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Dominio (opcional)"
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            />
          )}
        />
      </fieldset>

      <fieldset className="manager-register-form__section">
        <legend>Tu primera sede</legend>

        <Controller
          name="venue.name"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Nombre de la sede"
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            />
          )}
        />

        <Controller
          name="venue.address"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Dirección (opcional)"
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            />
          )}
        />

        <Controller
          name="venue.phone"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Teléfono de la sede (opcional)"
              type="tel"
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            />
          )}
        />

        <Controller
          name="venue.email"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Correo de la sede (opcional)"
              type="email"
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            />
          )}
        />
      </fieldset>

      <AppInteractionAlert
        isOpen={Boolean(submitError)}
        kind="error"
        header="No se pudo enviar la solicitud"
        message={submitError ?? ''}
      />

      <AppButton expand="block" type="submit" isLoading={isSubmitting}>
        Crear cuenta y solicitar acceso
      </AppButton>
    </form>
  );
};

export default ManagerRegisterForm;
