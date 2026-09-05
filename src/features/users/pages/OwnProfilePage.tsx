import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Prompt } from 'react-router-dom';
import AppErrorState from '../../../components/feedback/AppErrorState';
import AppSkeleton from '../../../components/feedback/AppSkeleton';
import { AppClientError, BusinessRuleError, NetworkError, TimeoutError } from '../../../services/api/errorMapper';
import { useSessionStore } from '../../../store/sessionStore';
import type { UpdateOwnUserProfileRequest } from '../../../types/api/users';
import type { OwnProfileFormValues } from '../../../validation/user-profile';
import UserPreferencesSection from '../../preferences/components/UserPreferencesSection';
import OutboxStatusBanner from '../components/OutboxStatusBanner';
import OwnProfileForm from '../components/OwnProfileForm';
import ProfilePhotoEditor from '../components/ProfilePhotoEditor';
import { useOwnProfileOutbox } from '../hooks/useOwnProfileOutbox';
import {
  useOwnAvatar,
  useOwnProfile,
  useRemoveOwnAvatar,
  useUpdateOwnAvatar,
  useUpdateOwnProfile,
} from '../hooks/useOwnProfile';
import '../users.css';

const EMPTY_TO_NULL = (value: string): string | null => value.trim() || null;

const OwnProfilePage: React.FC = () => {
  const user = useSessionStore(state => state.user);
  const profileQuery = useOwnProfile();
  const updateProfile = useUpdateOwnProfile();
  const updateAvatar = useUpdateOwnAvatar();
  const removeAvatar = useRemoveOwnAvatar();
  const outbox = useOwnProfileOutbox();
  const avatarQuery = useOwnAvatar(Boolean(profileQuery.data?.hasAvatar), profileQuery.data?.avatarUpdatedAt);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarQuery.data) {
      setAvatarUrl(null);
      return;
    }
    const url = URL.createObjectURL(avatarQuery.data);
    setAvatarUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarQuery.data]);

  if (profileQuery.isLoading) return <AppSkeleton rows={5} />;
  if (profileQuery.isError || !profileQuery.data || !user) {
    return (
      <AppErrorState
        message="No se pudo cargar tu perfil."
        isRetrying={profileQuery.isFetching}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const submit = async (values: OwnProfileFormValues): Promise<boolean> => {
    setError(null);
    setMessage(null);
    const body: UpdateOwnUserProfileRequest = {
      phone: EMPTY_TO_NULL(values.phone),
      facebookUrl: EMPTY_TO_NULL(values.facebookUrl),
      instagramUrl: EMPTY_TO_NULL(values.instagramUrl),
      linkedinUrl: EMPTY_TO_NULL(values.linkedinUrl),
      xUrl: EMPTY_TO_NULL(values.xUrl),
      githubUrl: EMPTY_TO_NULL(values.githubUrl),
      tiktokUrl: EMPTY_TO_NULL(values.tiktokUrl),
      websiteUrl: EMPTY_TO_NULL(values.websiteUrl),
      expectedProfileUpdatedAt: profileQuery.data.profileUpdatedAt,
    };
    const canQueueOffline = Capacitor.isNativePlatform();

    if (canQueueOffline && !outbox.isOnline) {
      await outbox.enqueue(body);
      setMessage('Sin conexión: tu cambio se guardó y se sincronizará automáticamente.');
      return true;
    }

    try {
      await updateProfile.mutateAsync(body);
      setMessage('Tu perfil se actualizó correctamente.');
      return true;
    } catch (caught) {
      if (canQueueOffline && (caught instanceof NetworkError || caught instanceof TimeoutError)) {
        await outbox.enqueue(body);
        setMessage('No hay conexión estable: tu cambio quedó pendiente y se sincronizará automáticamente.');
        return true;
      }
      setError(
        caught instanceof BusinessRuleError
          ? 'Tu perfil cambió en otra sesión. Recarga los datos.'
          : caught instanceof AppClientError
            ? caught.message
            : 'No se pudo guardar tu perfil.',
      );
      return false;
    }
  };

  const upload = async (body: Parameters<typeof updateAvatar.mutateAsync>[0]): Promise<void> => {
    setError(null);
    setMessage(null);
    try {
      await updateAvatar.mutateAsync(body);
      setMessage('Fotografía actualizada.');
    } catch (caught) {
      throw new Error(caught instanceof AppClientError ? caught.message : 'No se pudo actualizar la fotografía.');
    }
  };

  return (
    <section className="own-profile-page" aria-labelledby="own-profile-title">
      <header>
        <p className="user-profile-edit-page__eyebrow">Tu cuenta</p>
        <h1 id="own-profile-title">Mi perfil</h1>
        <p>Completa solo la información que quieras compartir. Ningún campo de esta pantalla es obligatorio.</p>
      </header>
      <OutboxStatusBanner
        intent={outbox.intent}
        isOnline={outbox.isOnline}
        isSyncing={outbox.isSyncing}
        justSynced={outbox.justSynced}
        onRetryNow={outbox.retryNow}
        onKeepMineAfterConflict={outbox.keepMineAfterConflict}
        onDiscardPending={outbox.discardPending}
      />
      <ProfilePhotoEditor
        name={user.name}
        avatarUrl={avatarUrl}
        hasAvatar={profileQuery.data.hasAvatar}
        isBusy={updateAvatar.isPending || removeAvatar.isPending}
        onUpload={upload}
        onRemove={async () => {
          setError(null);
          setMessage(null);
          try {
            await removeAvatar.mutateAsync();
            setMessage('Fotografía eliminada.');
          } catch {
            setError('No se pudo eliminar la fotografía.');
          }
        }}
      />
      <OwnProfileForm
        profile={profileQuery.data}
        submitError={error}
        successMessage={message}
        onSubmit={submit}
        onDirtyChange={setDirty}
        readOnly={outbox.intent?.status === 'conflict'}
      />
      <UserPreferencesSection />
      <Prompt when={dirty} message="Tienes cambios sin guardar. Si sales ahora, los perderás." />
    </section>
  );
};

export default OwnProfilePage;
