import { zodResolver } from '@hookform/resolvers/zod';
import { IonCheckbox, IonText, IonTextarea } from '@ionic/react';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import AppButton from '../../../components/common/AppButton';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppInput from '../../../components/forms/AppInput';
import { roleFormSchema, type RoleFormValues } from '../../../validation/roles';
import { usePermissions } from '../hooks/useRoles';

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
  const modules = useMemo(
    () =>
      Object.entries(
        permissions.reduce<Record<string, typeof permissions>>((grouped, permission) => {
          (grouped[permission.module] ??= []).push(permission);
          return grouped;
        }, {}),
      ),
    [permissions],
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
              className={fieldState.error ? 'ion-invalid ion-touched' : ''}
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

        {permissionsQuery.isLoading && <p role="status">Cargando permisos…</p>}
        {permissionsQuery.isError && (
          <AppErrorState
            message="No se pudo cargar el catálogo de permisos."
            onRetry={() => void permissionsQuery.refetch()}
          />
        )}
        {modules.map(([moduleName, modulePermissions]) => (
          <fieldset key={moduleName} className="role-form__permission-group" disabled={isSubmitting}>
            <legend>{moduleName}</legend>
            {modulePermissions.map(permission => (
              <IonCheckbox
                key={permission.id}
                checked={selectedPermissionIds.includes(permission.id)}
                onIonChange={event => togglePermission(permission.id, event.detail.checked)}
              >
                <strong>{permission.code}</strong>
                {permission.description && <small>{permission.description}</small>}
              </IonCheckbox>
            ))}
          </fieldset>
        ))}
        {permissionsQuery.hasNextPage && (
          <AppButton
            type="button"
            fill="outline"
            isLoading={permissionsQuery.isFetchingNextPage}
            onClick={() => void permissionsQuery.fetchNextPage()}
          >
            Cargar más permisos
          </AppButton>
        )}
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
