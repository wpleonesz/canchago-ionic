import { zodResolver } from '@hookform/resolvers/zod';
import { IonText, IonTextarea } from '@ionic/react';
import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/forms/AppInput';
import { venueFormSchema, type VenueFormValues } from '../../../validation/organizaciones';

interface VenueFormProps {
  mode: 'create' | 'edit';
  defaultValues?: VenueFormValues;
  submitError?: string | null;
  onSubmit: (values: VenueFormValues) => Promise<boolean>;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

const EMPTY_VALUES: VenueFormValues = { name: '', address: '', phone: '', email: '' };

const VenueForm: React.FC<VenueFormProps> = ({
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
  } = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    mode: 'onChange',
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const submit = async (values: VenueFormValues): Promise<void> => {
    const succeeded = await onSubmit(values);
    if (succeeded) reset(values);
  };

  return (
    <form className="venue-form" onSubmit={handleSubmit(submit)} noValidate>
      <section className="venue-form__section" aria-labelledby="venue-general-title">
        <div>
          <h2 id="venue-general-title">Datos de la sede</h2>
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
          name="address"
          control={control}
          render={({ field, fieldState }) => (
            <IonTextarea
              label="Dirección"
              labelPlacement="stacked"
              fill="outline"
              value={field.value}
              maxlength={500}
              autoGrow
              disabled={isSubmitting}
              className={fieldState.error ? 'ion-invalid ion-touched' : ''}
              errorText={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value ?? '')}
              onIonBlur={field.onBlur}
            />
          )}
        />
      </section>

      <section className="venue-form__section" aria-labelledby="venue-contact-title">
        <div>
          <h2 id="venue-contact-title">Contacto</h2>
        </div>
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

      <div className="venue-form__actions">
        <AppButton type="button" fill="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancelar
        </AppButton>
        <AppButton type="submit" isLoading={isSubmitting} disabled={!isDirty || !isValid || isSubmitting}>
          {mode === 'create' ? 'Crear sede' : 'Guardar cambios'}
        </AppButton>
      </div>
    </form>
  );
};

export default VenueForm;
