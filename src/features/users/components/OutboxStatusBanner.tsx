import { IonChip, IonIcon, IonLabel, IonSpinner } from '@ionic/react';
import { checkmarkCircleOutline, cloudOfflineOutline, cloudUploadOutline, warningOutline } from 'ionicons/icons';
import AppButton from '../../../components/common/AppButton';
import AppInteractionAlert from '../../../components/feedback/AppInteractionAlert';
import type { OutboxIntentRow } from '../../../services/offline/outboxTypes';

interface Props {
  intent: OutboxIntentRow | null;
  isOnline: boolean;
  isSyncing: boolean;
  justSynced: boolean;
  onRetryNow: () => void;
  onKeepMineAfterConflict: () => void;
  onDiscardPending: () => void;
}

// Estados que exige spec.md: offline / pendiente / sincronizando / sincronizado / error —
// reutiliza AppInteractionAlert (misma pieza que AppConfirmDialog) para el conflicto, sin un
// sistema de notificación paralelo.
const OutboxStatusBanner: React.FC<Props> = ({
  intent,
  isOnline,
  isSyncing,
  justSynced,
  onRetryNow,
  onKeepMineAfterConflict,
  onDiscardPending,
}) => {
  if (!isOnline) {
    return (
      <IonChip color="medium" className="outbox-status-chip" data-testid="outbox-status-offline">
        <IonIcon icon={cloudOfflineOutline} aria-hidden="true" />
        <IonLabel>Sin conexión{intent ? ' — tu cambio se sincronizará al reconectar' : ''}</IonLabel>
      </IonChip>
    );
  }

  if (intent?.status === 'conflict') {
    return (
      <AppInteractionAlert
        isOpen
        kind="warning"
        header="Tu perfil cambió en otra sesión"
        message="No pudimos guardar tu cambio pendiente mientras no tenías conexión porque tu perfil se modificó en otra sesión. ¿Qué quieres hacer?"
        buttons={[
          { text: 'Descartar mi cambio pendiente', role: 'destructive', handler: onDiscardPending },
          { text: 'Usar mis cambios de nuevo', handler: onKeepMineAfterConflict },
        ]}
      />
    );
  }

  if (isSyncing || intent?.status === 'syncing') {
    return (
      <IonChip color="primary" className="outbox-status-chip" data-testid="outbox-status-syncing">
        <IonSpinner name="dots" aria-label="Sincronizando" />
        <IonLabel>Sincronizando…</IonLabel>
      </IonChip>
    );
  }

  if (intent?.status === 'pending') {
    return (
      <IonChip color="warning" className="outbox-status-chip" data-testid="outbox-status-pending">
        <IonIcon icon={cloudUploadOutline} aria-hidden="true" />
        <IonLabel>Pendiente de sincronizar</IonLabel>
      </IonChip>
    );
  }

  if (intent?.status === 'error') {
    return (
      <IonChip color="danger" className="outbox-status-chip" data-testid="outbox-status-error">
        <IonIcon icon={warningOutline} aria-hidden="true" />
        <IonLabel>
          {intent.nextAttemptAt
            ? 'No se pudo sincronizar, reintentando…'
            : (intent.lastErrorMessage ?? 'No se pudo sincronizar tu cambio.')}
        </IonLabel>
        {!intent.nextAttemptAt && (
          <AppButton size="small" fill="clear" onClick={onRetryNow}>
            Reintentar
          </AppButton>
        )}
      </IonChip>
    );
  }

  // La fila se borra apenas sincroniza (outboxRepository.markSynced) — este badge es efímero,
  // vive en outboxStore.justSynced (ver useOwnProfileOutbox), no en la fila del Outbox.
  if (justSynced) {
    return (
      <IonChip color="success" className="outbox-status-chip" data-testid="outbox-status-synced">
        <IonIcon icon={checkmarkCircleOutline} aria-hidden="true" />
        <IonLabel>Sincronizado</IonLabel>
      </IonChip>
    );
  }

  return null;
};

export default OutboxStatusBanner;
