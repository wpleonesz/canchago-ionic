import { zodResolver } from '@hookform/resolvers/zod';
import { IonText } from '@ionic/react';
import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import AppButton from '../../../components/common/AppButton';
import AppInteractionAlert from '../../../components/feedback/AppInteractionAlert';
import AppInput from '../../../components/forms/AppInput';
import type { AdminUserProfileDto } from '../../../types/api/users';
import { adminUserProfileFormSchema, type AdminUserProfileFormValues } from '../../../validation/user-profile';

interface AdminUserProfileFormProps {
  profile: AdminUserProfileDto;
  submitError?: string | null;
  successMessage?: string | null;
  onSubmit: (values: AdminUserProfileFormValues) => Promise<boolean>;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

const AdminUserProfileForm: React.FC<AdminUserProfileFormProps> = ({
  profile,
  submitError,
  successMessage,
  onSubmit,
  onCancel,
  onDirtyChange,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<AdminUserProfileFormValues>({
    resolver: zodResolver(adminUserProfileFormSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
    },
  });

  useEffect(() => {
    reset({ firstName: profile.firstName, lastName: profile.lastName });
  }, [profile.firstName, profile.lastName, reset]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const submit = async (values: AdminUserProfileFormValues): Promise<void> => {
    const succeeded = await onSubmit(values);
    if (succeeded) {
      reset(values);
    }
  };

  return (
    <form className="admin-user-profile-form" onSubmit={handleSubmit(submit)} noValidate>
      <section className="admin-user-profile-form__section" aria-labelledby="profile-personal-title">
        <div>
          <h2 id="profile-personal-title">Información personal</h2>
          <p>Estos nombres se muestran en el listado, el detalle y la sesión del usuario.</p>
        </div>

        <Controller
          name="firstName"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Nombre"
              value={field.value}
              maxlength={100}
              autocomplete="given-name"
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
              value={field.value}
              maxlength={100}
              autocomplete="family-name"
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            />
          )}
        />
      </section>

      <section className="admin-user-profile-form__section" aria-labelledby="profile-account-title">
        <div>
          <h2 id="profile-account-title">Datos de cuenta</h2>
          <p>La identidad y el estado se administran mediante operaciones separadas.</p>
        </div>
        <dl className="admin-user-profile-form__readonly">
          <div>
            <dt>Correo electrónico</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{profile.active ? 'Activo' : 'Inactivo'}</dd>
          </div>
        </dl>
      </section>

      <AppInteractionAlert
        isOpen={Boolean(submitError)}
        kind="error"
        header="No se pudo actualizar el perfil"
        message={submitError ?? ''}
      />
      <AppInteractionAlert
        isOpen={!submitError && Boolean(successMessage)}
        kind="success"
        header="Perfil actualizado"
        message={successMessage ?? ''}
      />
      {Object.keys(errors).length > 0 && !submitError && (
        <IonText className="user-form__error" role="alert">
          <p>Revisa los campos marcados antes de continuar.</p>
        </IonText>
      )}

      <div className="admin-user-profile-form__actions">
        <AppButton fill="outline" type="button" disabled={isSubmitting} onClick={onCancel}>
          Cancelar
        </AppButton>
        <AppButton type="submit" isLoading={isSubmitting} disabled={!isDirty || !isValid || isSubmitting}>
          Guardar cambios
        </AppButton>
      </div>
    </form>
  );
};

export default AdminUserProfileForm;
