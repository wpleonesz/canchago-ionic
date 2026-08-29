import { useRef, useState } from 'react';
import { Prompt, useHistory, useLocation, useParams } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppConfirmDialog from '../../../components/feedback/AppConfirmDialog';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import { AppClientError, BusinessRuleError } from '../../../services/api/errorMapper';
import type { RoleFormValues } from '../../../validation/roles';
import RoleForm from '../components/RoleForm';
import { useCreateRole, useRole, useUpdateRole } from '../hooks/useRoles';
import '../roles.css';

interface RoleFormPageProps {
  mode: 'create' | 'edit';
}

const RoleFormPage: React.FC<RoleFormPageProps> = ({ mode }) => {
  const { roleId = '' } = useParams<{ roleId?: string }>();
  const location = useLocation();
  const history = useHistory();
  const organizationId = new URLSearchParams(location.search).get('organizationId') ?? '';
  const roleQuery = useRole(roleId, mode === 'edit' ? organizationId : '');
  const createMutation = useCreateRole(organizationId);
  const updateMutation = useUpdateRole(roleId, organizationId);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const allowNavigationRef = useRef(false);

  const goBack = (): void => {
    allowNavigationRef.current = true;
    if (mode === 'edit' && roleId) {
      history.push(`/admin/roles/${roleId}?organizationId=${organizationId}`);
      return;
    }
    history.push('/admin/roles');
  };

  const cancel = (): void => {
    if (hasUnsavedChanges) setShowCancelConfirmation(true);
    else goBack();
  };

  if (!organizationId) return <AppErrorState message="Selecciona una organización antes de continuar." />;
  if (mode === 'edit' && roleQuery.isLoading) return <AppSkeleton rows={6} />;
  if (mode === 'edit' && (roleQuery.isError || !roleQuery.data)) {
    return <AppErrorState message="No se pudo cargar el rol." onRetry={() => void roleQuery.refetch()} />;
  }
  if (mode === 'edit' && roleQuery.data?.isSystem) {
    return <AppErrorState message="Los roles de sistema son de solo lectura." />;
  }

  const defaultValues: RoleFormValues | undefined = roleQuery.data
    ? {
        name: roleQuery.data.name,
        description: roleQuery.data.description ?? '',
        permissionIds: roleQuery.data.permissions.map(permission => permission.id),
      }
    : undefined;

  const submit = async (values: RoleFormValues): Promise<boolean> => {
    setSubmitError(null);
    try {
      const role =
        mode === 'create'
          ? await createMutation.mutateAsync({
              name: values.name,
              description: values.description || null,
              permissionIds: values.permissionIds,
            })
          : await updateMutation.mutateAsync({
              name: values.name,
              description: values.description || null,
              permissionIds: values.permissionIds,
              expectedUpdatedAt: roleQuery.data?.updatedAt ?? '',
            });

      allowNavigationRef.current = true;
      history.replace(`/admin/roles/${role.id}?organizationId=${organizationId}`);
      return true;
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        setSubmitError('El nombre ya existe o el rol cambió. Recarga los datos antes de guardar.');
        return false;
      }
      setSubmitError(error instanceof AppClientError ? error.message : 'No se pudo guardar el rol.');
      return false;
    }
  };

  return (
    <section className="role-form-page" aria-labelledby="role-form-title">
      <header className="roles-page-header">
        <div>
          <p className="roles-page-header__eyebrow">Administración de roles</p>
          <h1 id="role-form-title">{mode === 'create' ? 'Nuevo rol' : 'Editar rol'}</h1>
          <p>Separa la información general de las capacidades concedidas.</p>
        </div>
        <AppButton fill="clear" onClick={cancel}>
          Volver
        </AppButton>
      </header>

      <RoleForm
        mode={mode}
        defaultValues={defaultValues}
        submitError={submitError}
        onSubmit={submit}
        onCancel={cancel}
        onDirtyChange={setHasUnsavedChanges}
      />

      {submitError && updateMutation.error instanceof BusinessRuleError && (
        <AppButton fill="outline" onClick={() => void roleQuery.refetch()}>
          Recargar datos actuales
        </AppButton>
      )}

      <Prompt
        when={hasUnsavedChanges}
        message={() => allowNavigationRef.current || 'Tienes cambios sin guardar. Si sales, se perderán.'}
      />
      <AppConfirmDialog
        isOpen={showCancelConfirmation}
        header="Descartar cambios"
        message="Tienes cambios sin guardar. ¿Quieres salir y descartarlos?"
        confirmText="Descartar"
        isDestructive
        onConfirm={() => {
          setShowCancelConfirmation(false);
          goBack();
        }}
        onCancel={() => setShowCancelConfirmation(false)}
      />
    </section>
  );
};

export default RoleFormPage;
