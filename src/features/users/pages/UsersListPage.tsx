import { useState } from 'react';
import { addOutline } from 'ionicons/icons';
import { IonIcon, IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppDataList from '../../../components/common/AppDataList';
import AppSearchInput from '../../../components/forms/AppSearchInput';
import AppConfirmDialog from '../../../components/feedback/AppConfirmDialog';
import PermissionGuard from '../../auth/components/PermissionGuard';
import { useDeactivateUser } from '../hooks/useUserMutations';
import { useUsers } from '../hooks/useUsers';
import UserListItem from '../components/UserListItem';
import type { UserDto } from '../../../types/api/users';
import '../users.css';

type StatusFilter = 'active' | 'all';

const UsersListPage: React.FC = () => {
  const history = useHistory();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [userToDeactivate, setUserToDeactivate] = useState<UserDto | null>(null);

  const { data, isLoading, isError, refetch } = useUsers({
    page,
    pageSize: 20,
    search: search || undefined,
    // 'active' solo admite true u omitirse — 'false' no filtra a inactivos en el backend real
    // (ver spec 005, quiebre documentado). No se ofrece "solo inactivos" a propósito.
    active: statusFilter === 'active' ? true : undefined,
    orderBy: 'createdAt',
    order: 'desc',
  });

  const deactivateMutation = useDeactivateUser();

  const handleSearch = (value: string): void => {
    setSearch(value);
    setPage(1);
  };

  const handleConfirmDeactivate = (): void => {
    if (!userToDeactivate) return;
    deactivateMutation.mutate(userToDeactivate.id, {
      onSettled: () => setUserToDeactivate(null),
    });
  };

  return (
    <section className="users-list-page" aria-labelledby="users-list-title">
      <div className="users-list-page__toolbar">
        <AppSearchInput placeholder="Buscar por nombre o correo" onSearch={handleSearch} />

        <IonSegment
          value={statusFilter}
          onIonChange={event => {
            setStatusFilter((event.detail.value as StatusFilter) ?? 'active');
            setPage(1);
          }}
        >
          <IonSegmentButton value="active">
            <IonLabel>Activos</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="all">
            <IonLabel>Todos</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <PermissionGuard permission="users.create">
          <AppButton onClick={() => history.push('/admin/users/new')}>
            <IonIcon icon={addOutline} slot="start" />
            Nuevo usuario
          </AppButton>
        </PermissionGuard>
      </div>

      <AppDataList
        items={data?.data ?? []}
        keyExtractor={user => user.id}
        renderItem={user => <UserListItem user={user} onDeactivate={setUserToDeactivate} />}
        isLoading={isLoading}
        isError={isError}
        errorMessage="No se pudo cargar el listado de usuarios."
        onRetry={() => void refetch()}
        emptyTitle="No hay usuarios para mostrar"
        emptyDescription={search ? 'Intenta con otra búsqueda.' : 'Aún no hay usuarios registrados.'}
        meta={data?.meta}
        onPageChange={setPage}
      />

      <AppConfirmDialog
        isOpen={Boolean(userToDeactivate)}
        header="Desactivar usuario"
        message={
          userToDeactivate
            ? `¿Seguro que quieres desactivar a ${userToDeactivate.firstName} ${userToDeactivate.lastName}? Podrá reactivarse más adelante.`
            : ''
        }
        confirmText="Desactivar"
        isDestructive
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setUserToDeactivate(null)}
      />
    </section>
  );
};

export default UsersListPage;
