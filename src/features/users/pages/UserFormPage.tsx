import { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import { BusinessRuleError } from '../../../services/api/errorMapper';
import { useCreateUser, useUpdateUser } from '../hooks/useUserMutations';
import { useUser } from '../hooks/useUsers';
import UserForm, { type UserFormValues } from '../components/UserForm';
import '../users.css';

interface UserFormPageProps {
  mode: 'create' | 'edit';
}

const CreateUserForm: React.FC = () => {
  const history = useHistory();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createUserMutation = useCreateUser();

  const handleSubmit = async (values: UserFormValues): Promise<void> => {
    setSubmitError(null);
    try {
      const user = await createUserMutation.mutateAsync({
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        organizationId: values.organizationId,
        roleIds: values.roleIds,
      });
      history.push(`/admin/users/${user.id}`);
    } catch (error) {
      setSubmitError(
        error instanceof BusinessRuleError
          ? 'Ya existe un usuario con ese correo electrónico.'
          : 'No se pudo crear el usuario. Intenta de nuevo.',
      );
    }
  };

  return <UserForm mode="create" onSubmit={handleSubmit} submitError={submitError} submitLabel="Crear usuario" />;
};

const EditUserForm: React.FC<{ userId: string }> = ({ userId }) => {
  const history = useHistory();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: user, isLoading, isError, refetch } = useUser(userId);
  const updateUserMutation = useUpdateUser(userId);

  if (isLoading) {
    return <AppSkeleton rows={4} />;
  }

  if (isError || !user) {
    return (
      <AppErrorState message="No se pudo cargar este usuario." onRetry={() => void refetch()} />
    );
  }

  const handleSubmit = async (values: UserFormValues): Promise<void> => {
    setSubmitError(null);
    try {
      await updateUserMutation.mutateAsync({
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        organizationId: values.organizationId,
        roleIds: values.roleIds,
      });
      history.push(`/admin/users/${userId}`);
    } catch {
      setSubmitError('No se pudo actualizar el usuario. Intenta de nuevo.');
    }
  };

  return (
    <UserForm
      mode="edit"
      defaultValues={{
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.roles[0]?.organizationId ?? '',
        roleIds: user.roles.map(role => role.id),
      }}
      onSubmit={handleSubmit}
      submitError={submitError}
      submitLabel="Guardar cambios"
    />
  );
};

const UserFormPage: React.FC<UserFormPageProps> = ({ mode }) => {
  const { userId } = useParams<{ userId?: string }>();

  return (
    <section className="user-form-page" aria-labelledby="user-form-title">
      <h1 id="user-form-title">{mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}</h1>
      {mode === 'create' || !userId ? <CreateUserForm /> : <EditUserForm userId={userId} />}
    </section>
  );
};

export default UserFormPage;
