import { IonAlert } from '@ionic/react';

interface AppConfirmDialogProps {
  isOpen: boolean;
  header: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Confirmación explícita para acciones sensibles (desactivar usuario, remover un rol) —
// requerida por la feature 005 antes de ejecutar cualquier mutación destructiva.
const AppConfirmDialog: React.FC<AppConfirmDialogProps> = ({
  isOpen,
  header,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => (
  <IonAlert
    isOpen={isOpen}
    header={header}
    message={message}
    onDidDismiss={onCancel}
    buttons={[
      { text: cancelText, role: 'cancel', handler: onCancel },
      {
        text: confirmText,
        role: isDestructive ? 'destructive' : undefined,
        cssClass: isDestructive ? 'app-confirm-dialog__destructive' : undefined,
        handler: onConfirm,
      },
    ]}
  />
);

export default AppConfirmDialog;
