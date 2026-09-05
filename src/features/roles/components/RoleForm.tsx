import { zodResolver } from '@hookform/resolvers/zod';
import { IonText, IonTextarea } from '@ionic/react';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import AppButton from '../../../components/common/AppButton';
import AppInteractionAlert from '../../../components/feedback/AppInteractionAlert';
import AppInput from '../../../components/forms/AppInput';
import { roleFormSchema, type RoleFormValues } from '../../../validation/roles';
import { usePermissions } from '../hooks/useRoles';
import RolePermissionSelector from './RolePermissionSelector';

interface RoleFormProps {
  mode: 'create' | 'edit';
  defaultValues?: RoleFormValues;
  submitError?: string | null;
  onSubmit: (values: RoleFormValues) => Promise<boolean>;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

const RoleForm: React.FC<RoleFormProps> = ({ mode, defaultValues, submitError, onSubmit, onCancel, onDirtyChange }) => {
  const permissionsQuery = usePermissions();
  const permissions = useMemo(
    () => permissionsQuery.data?.pages.flatMap(page => page.data) ?? [],
    [permissionsQuery.data],
  );

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting, isValid },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    mode: 'onChange',
    defaultValues: defaultValues ?? { name: '', description: '', permissionIds: [] },
  });
  const selectedPermissionIds = watch('permissionIds');

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const togglePermission = (permissionId: string, checked: boolean): void => {
    const next = checked
      ? [...new Set([...selectedPermissionIds, permissionId])]
      : selectedPermissionIds.filter(id => id !== permissionId);
    setValue('permissionIds', next, { shouldDirty: true, shouldValidate: true });
  };

  const submit = async (values: RoleFormValues): Promise<void> => {
    const succeeded = await onSubmit(values);
    if (succeeded) reset(values);
  };

  return (
    <form className="role-form" onSubmit={handleSubmit(submit)} noValidate>
      <section className="role-form__section" aria-labelledby="role-general-title">
        <div>
          <h2 id="role-general-title">Información general</h2>
          <p>El nombre es visible; el código técnico se genera al crear y permanece inmutable.</p>
        </div>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Nombre del rol"
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
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <IonTextarea
              label="Descripción"
              labelPlacement="stacked"
              fill="outline"
              value={field.value}
              maxlength={500}
              autoGrow
              disabled={isSubmitting}
              className={`app-textarea${fieldState.error ? ' ion-invalid ion-touched' : ''}`}
              errorText={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value ?? '')}
              onIonBlur={field.onBlur}
            />
          )}
        />
      </section>

      <section className="role-form__section" aria-labelledby="role-permissions-title">
        <div>
          <h2 id="role-permissions-title">Permisos asociados</h2>
          <p>Solo se muestran capacidades reales del catálogo del backend.</p>
        </div>

        <RolePermissionSelector
          permissions={permissions}
          selectedIds={selectedPermissionIds}
          disabled={isSubmitting}
          isLoading={permissionsQuery.isLoading}
          isError={permissionsQuery.isError}
          hasNextPage={permissionsQuery.hasNextPage}
          isFetchingNextPage={permissionsQuery.isFetchingNextPage}
          onToggle={togglePermission}
          onRetry={() => void permissionsQuery.refetch()}
          onLoadMore={() => void permissionsQuery.fetchNextPage()}
        />
      </section>

      <AppInteractionAlert
        isOpen={Boolean(submitError)}
        kind="error"
        header="No se pudo guardar el rol"
        message={submitError ?? ''}
      />
      {Object.keys(errors).length > 0 && !submitError && (
        <IonText color="danger" role="alert">
          <p>Revisa los campos marcados antes de continuar.</p>
        </IonText>
      )}

      <div className="role-form__actions">
        <AppButton type="button" fill="outline" disabled={isSubmitting} onClick={onCancel}>
          Cancelar
        </AppButton>
        <AppButton type="submit" isLoading={isSubmitting} disabled={!isDirty || !isValid || isSubmitting}>
          {mode === 'create' ? 'Crear rol' : 'Guardar cambios'}
        </AppButton>
      </div>
    </form>
  );
};

export default RoleForm;
