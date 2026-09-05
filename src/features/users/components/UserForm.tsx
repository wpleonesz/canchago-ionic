import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { IonText } from '@ionic/react';
import AppButton from '../../../components/common/AppButton';
import AppInteractionAlert from '../../../components/feedback/AppInteractionAlert';
import AppInput from '../../../components/forms/AppInput';
import { createUserFormSchema, type CreateUserFormValues } from '../../../validation/users';
import OrganizationPicker from './OrganizationPicker';
import UserRolesEditor from './UserRolesEditor';

export type UserFormValues = CreateUserFormValues;

interface UserFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<UserFormValues>;
  onSubmit: (values: UserFormValues) => Promise<void>;
  submitError?: string | null;
  submitLabel: string;
}

// Compartido por creación y edición (PATCH reemplaza todos los roles previos — ver spec 005):
// en edición, defaultValues.roleIds ya trae los roles actuales del usuario, así que enviar el
// formulario sin tocarlos los conserva; el admin puede agregar/quitar antes de guardar.
const UserForm: React.FC<UserFormProps> = ({ mode, defaultValues, onSubmit, submitError, submitLabel }) => {
  // Se valida siempre contra el schema completo: el formulario controlado siempre puebla los
  // campos (vacíos o con los valores actuales), tanto en crear como en editar.
  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      organizationId: '',
      roleIds: [],
      ...defaultValues,
    },
  });

  const organizationId = watch('organizationId');
  const currentRoleIds = defaultValues?.roleIds ?? [];

  return (
    <form className="user-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <section className="user-form__section" aria-labelledby="user-identity-title">
        <div className="user-form__section-heading">
          <h2 id="user-identity-title">Información personal</h2>
          <p>Datos usados para identificar y contactar al usuario.</p>
        </div>
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
      </section>

      <section className="user-form__section" aria-labelledby="user-access-title">
        <div className="user-form__section-heading">
          <h2 id="user-access-title">Organización y acceso</h2>
          <p>Selecciona el ámbito y los roles correspondientes.</p>
        </div>
        <Controller
          name="organizationId"
          control={control}
          render={({ field, fieldState }) => (
            <OrganizationPicker value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
          )}
        />
        <Controller
          name="roleIds"
          control={control}
          render={({ field, fieldState }) => (
            <UserRolesEditor
              organizationId={organizationId}
              value={field.value ?? []}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </section>

      {mode === 'edit' && currentRoleIds.length > 0 && (
        <p className="user-form__hint">
          Los roles actuales ya están seleccionados; quita o agrega roles antes de guardar.
        </p>
      )}

      <AppInteractionAlert
        isOpen={Boolean(submitError)}
        kind="error"
        header={mode === 'create' ? 'No se pudo crear el usuario' : 'No se pudo actualizar el usuario'}
        message={submitError ?? ''}
      />

      {Object.keys(errors).length > 0 && !submitError && (
        <IonText className="user-form__error" role="alert" aria-live="polite">
          <p>Revisa los campos marcados antes de continuar.</p>
        </IonText>
      )}

      <AppButton expand="block" type="submit" isLoading={isSubmitting}>
        {submitLabel}
      </AppButton>
    </form>
  );
};

export default UserForm;
