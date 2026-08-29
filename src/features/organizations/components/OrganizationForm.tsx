import { zodResolver } from '@hookform/resolvers/zod';
import { IonText } from '@ionic/react';
import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/forms/AppInput';
import { organizationFormSchema, type OrganizationFormValues } from '../../../validation/organizaciones';

interface OrganizationFormProps {
  mode: 'create' | 'edit';
  defaultValues?: OrganizationFormValues;
  submitError?: string | null;
  onSubmit: (values: OrganizationFormValues) => Promise<boolean>;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

const EMPTY_VALUES: OrganizationFormValues = {
  name: '',
  legalName: '',
  taxIdentification: '',
  email: '',
  phone: '',
  domain: '',
};

const OrganizationForm: React.FC<OrganizationFormProps> = ({
  mode,
  defaultValues,
  submitError,
  onSubmit,
  onCancel,
  onDirtyChange,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    mode: 'onChange',
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const submit = async (values: OrganizationFormValues): Promise<void> => {
    const succeeded = await onSubmit(values);
    if (succeeded) reset(values);
  };

  return (
    <form className="organization-form" onSubmit={handleSubmit(submit)} noValidate>
      <section className="organization-form__section" aria-labelledby="organization-general-title">
        <div>
          <h2 id="organization-general-title">Información general</h2>
          <p>Datos básicos de la organización.</p>
        </div>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Nombre"
              value={field.value}
              maxlength={150}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            />
          )}
        />
        <Controller
          name="legalName"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Razón social"
              value={field.value}
              maxlength={200}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value ?? '')}
              onIonBlur={field.onBlur}
            />
          )}
        />
        <Controller
          name="taxIdentification"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Identificación tributaria"
              value={field.value}
              maxlength={30}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value ?? '')}
              onIonBlur={field.onBlur}
            />
          )}
        />
      </section>

      <section className="organization-form__section" aria-labelledby="organization-contact-title">
        <div>
          <h2 id="organization-contact-title">Contacto</h2>
        </div>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Correo electrónico"
              type="email"
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value ?? '')}
              onIonBlur={field.onBlur}
            />
          )}
        />
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Teléfono"
              maxlength={20}
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value ?? '')}
              onIonBlur={field.onBlur}
            />
          )}
        />
        <Controller
          name="domain"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Dominio"
              maxlength={255}
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value ?? '')}
              onIonBlur={field.onBlur}
            />
          )}
        />
      </section>

      {submitError && (
        <IonText color="danger" role="alert" aria-live="assertive">
          <p>{submitError}</p>
        </IonText>
      )}
      {Object.keys(errors).length > 0 && !submitError && (
        <IonText color="danger" role="alert">
          <p>Revisa los campos marcados antes de continuar.</p>
        </IonText>
      )}

      <div className="organization-form__actions">
        <AppButton type="button" fill="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancelar
        </AppButton>
        <AppButton type="submit" isLoading={isSubmitting} disabled={!isDirty || !isValid || isSubmitting}>
          {mode === 'create' ? 'Crear organización' : 'Guardar cambios'}
        </AppButton>
      </div>
    </form>
  );
};

export default OrganizationForm;
