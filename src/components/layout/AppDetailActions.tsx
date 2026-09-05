import type { PropsWithChildren } from 'react';
import { IonButtons } from '@ionic/react';

// Fila de acciones de una pantalla de detalle (Editar/Volver/Desactivar) — unifica el
// `<div className="…__actions">` repetido en users/roles/organizations *DetailPage.tsx.
// Reutiliza el className ya estilizado en cada `*.css` de módulo, solo cambia el elemento host.
const AppDetailActions: React.FC<PropsWithChildren<{ className: string }>> = ({ className, children }) => (
  <IonButtons className={className}>{children}</IonButtons>
);

export default AppDetailActions;
