import { useRef, useState } from 'react';
import { Prompt, useHistory, useParams } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppConfirmDialog from '../../../components/feedback/AppConfirmDialog';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import { AppClientError, BusinessRuleError, NotFoundError } from '../../../services/api/errorMapper';
import type { AdminUserProfileFormValues } from '../../../validation/user-profile';
import AdminUserProfileForm from '../components/AdminUserProfileForm';
import { useUpdateUserProfile, useUserProfile } from '../hooks/useUserProfile';
import '../users.css';

const UserProfileEditPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const history = useHistory();
  const profileQuery = useUserProfile(userId);
  const updateMutation = useUpdateUserProfile(userId);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCancelConfirmationOpen, setIsCancelConfirmationOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const allowNavigationRef = useRef(false);

  const goToDetail = (): void => {
    allowNavigationRef.current = true;
    history.push(`/admin/users/${userId}`);
  };

  const handleCancel = (): void => {
    if (hasUnsavedChanges) {
      setIsCancelConfirmationOpen(true);
      return;
    }

    goToDetail();
  };

  if (profileQuery.isLoading) {
    return <AppSkeleton rows={4} />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    const message =
      profileQuery.error instanceof NotFoundError
        ? 'El usuario solicitado no existe.'
        : 'No se pudo cargar el perfil del usuario.';
    return (
      <AppErrorState
        message={message}
        isRetrying={profileQuery.isFetching}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const handleSubmit = async (values: AdminUserProfileFormValues): Promise<boolean> => {
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      await updateMutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        expectedProfileUpdatedAt: profileQuery.data.profileUpdatedAt,
      });
      setSuccessMessage('El perfil se actualizó correctamente.');
      return true;
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        setSubmitError('El perfil cambió o ya no puede editarse. Recarga los datos antes de intentarlo nuevamente.');
        return false;
      }

      setSubmitError(
        error instanceof AppClientError ? error.message : 'No se pudo actualizar el perfil. Intenta de nuevo.',
      );
      return false;
    }
  };

  return (
    <section className="user-profile-edit-page" aria-labelledby="user-profile-edit-title">
      <header className="user-profile-edit-page__header">
        <div>
          <p className="user-profile-edit-page__eyebrow">Administración de usuarios</p>
          <h1 id="user-profile-edit-title">Editar perfil</h1>
          <p>Actualiza la información personal sin modificar identidad, estado ni acceso.</p>
        </div>
        <AppButton fill="clear" onClick={handleCancel}>
          Volver al detalle
        </AppButton>
      </header>

      <AdminUserProfileForm
        profile={profileQuery.data}
        submitError={submitError}
        successMessage={successMessage}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onDirtyChange={setHasUnsavedChanges}
      />

      {submitError && updateMutation.error instanceof BusinessRuleError && (
        <AppButton fill="outline" onClick={() => void profileQuery.refetch()}>
          Recargar datos actuales
        </AppButton>
      )}

      <Prompt
        when={hasUnsavedChanges}
        message={() =>
          allowNavigationRef.current || 'Tienes cambios sin guardar. Si sales ahora, perderás esos cambios.'
        }
      />

      <AppConfirmDialog
        isOpen={isCancelConfirmationOpen}
        header="Descartar cambios"
        message="Tienes cambios sin guardar. ¿Quieres salir y descartarlos?"
        confirmText="Descartar"
        isDestructive
        onConfirm={() => {
          setIsCancelConfirmationOpen(false);
          goToDetail();
        }}
        onCancel={() => setIsCancelConfirmationOpen(false)}
      />
    </section>
  );
};

export default UserProfileEditPage;
