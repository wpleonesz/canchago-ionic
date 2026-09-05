import { useState } from 'react';
import { addOutline } from 'ionicons/icons';
import { IonCol, IonGrid, IonIcon, IonLabel, IonRow, IonSegment, IonSegmentButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppDataList from '../../../components/common/AppDataList';
import AppSearchInput from '../../../components/forms/AppSearchInput';
import AppConfirmDialog from '../../../components/feedback/AppConfirmDialog';
import AppInteractionAlert, { type AppInteractionAlertKind } from '../../../components/feedback/AppInteractionAlert';
import PermissionGuard from '../../auth/components/PermissionGuard';
import { useDeactivateUser } from '../hooks/useUserMutations';
import { useUsers } from '../hooks/useUsers';
import UserListItem from '../components/UserListItem';
import type { UserDto } from '../../../types/api/users';
import { AppClientError } from '../../../services/api/errorMapper';
import '../users.css';

type StatusFilter = 'active' | 'all';

const UsersListPage: React.FC = () => {
  const history = useHistory();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [userToDeactivate, setUserToDeactivate] = useState<UserDto | null>(null);
  const [feedback, setFeedback] = useState<{ kind: AppInteractionAlertKind; header: string; message: string } | null>(
    null,
  );

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
    const user = userToDeactivate;
    setUserToDeactivate(null);
    deactivateMutation.mutate(user.id, {
      onSuccess: () =>
        setFeedback({
          kind: 'success',
          header: 'Usuario desactivado',
          message: `${user.firstName} ${user.lastName} fue desactivado correctamente.`,
        }),
      onError: error =>
        setFeedback({
          kind: 'error',
          header: 'No se pudo desactivar el usuario',
          message: error instanceof AppClientError ? error.message : 'Intenta nuevamente.',
        }),
    });
  };

  return (
    <IonGrid fixed className="users-list-page" aria-label="Gestión de usuarios">
      <IonRow className="users-list-page__toolbar ion-align-items-center">
        <IonCol size="12" sizeMd="6">
          <AppSearchInput placeholder="Buscar por nombre o correo" onSearch={handleSearch} />
        </IonCol>
        <IonCol size="12" sizeSm="7" sizeMd="3">
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
        </IonCol>
        <IonCol size="12" sizeSm="5" sizeMd="3" className="users-list-page__create">
          <PermissionGuard permission="users.create">
            <AppButton expand="block" onClick={() => history.push('/admin/users/new')}>
              <IonIcon icon={addOutline} slot="start" />
              Nuevo usuario
            </AppButton>
          </PermissionGuard>
        </IonCol>
      </IonRow>

      <IonRow>
        <IonCol size="12">
          <AppDataList
            items={data?.data ?? []}
            keyExtractor={user => user.id}
            renderItem={user => (
              <UserListItem user={user} onDeactivate={setUserToDeactivate} isBusy={deactivateMutation.isPending} />
            )}
            isLoading={isLoading}
            isError={isError}
            errorMessage="No se pudo cargar el listado de usuarios."
            onRetry={() => void refetch()}
            emptyTitle="No hay usuarios para mostrar"
            emptyDescription={search ? 'Intenta con otra búsqueda.' : 'Aún no hay usuarios registrados.'}
            meta={data?.meta}
            onPageChange={setPage}
          />
        </IonCol>
      </IonRow>

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
      <AppInteractionAlert
        isOpen={Boolean(feedback)}
        kind={feedback?.kind ?? 'info'}
        header={feedback?.header}
        message={feedback?.message ?? ''}
        onDismiss={() => setFeedback(null)}
      />
    </IonGrid>
  );
};

export default UsersListPage;
