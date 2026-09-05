import { Fragment, type ReactNode } from 'react';
import { IonButtons, IonIcon, IonLabel, IonList, IonToolbar } from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import type { PaginationMeta } from '../../types/api/common';
import AppEmptyState from '../feedback/AppEmptyState';
import AppErrorState from '../feedback/AppErrorState';
import AppSkeleton from '../feedback/AppSkeleton';
import AppButton from './AppButton';

interface AppDataListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription?: string;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
}

// Lista/tabla paginada genérica (tech-stack.md §3) — cubre loading/error/empty/success una
// sola vez para reutilizar en 005 (usuarios) y features futuras (006 organizaciones, 007 roles).
const AppDataList = <T,>({
  items,
  keyExtractor,
  renderItem,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  emptyTitle,
  emptyDescription,
  meta,
  onPageChange,
}: AppDataListProps<T>): ReactNode => {
  if (isLoading) {
    return <AppSkeleton />;
  }

  if (isError) {
    return <AppErrorState message={errorMessage ?? 'No se pudo cargar la información.'} onRetry={onRetry} />;
  }

  if (items.length === 0) {
    return <AppEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Fragment>
      <IonList className="app-data-list">
        {items.map(item => (
          <Fragment key={keyExtractor(item)}>{renderItem(item)}</Fragment>
        ))}
      </IonList>

      {meta && meta.totalPages > 1 && onPageChange && (
        <IonToolbar className="app-data-list__pagination" aria-label="Paginación">
          <IonButtons slot="start">
            <AppButton
              fill="clear"
              size="small"
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              aria-label="Página anterior"
            >
              <IonIcon icon={chevronBackOutline} slot="icon-only" />
            </AppButton>
          </IonButtons>

          <IonLabel aria-live="polite">
            Página {meta.page} de {meta.totalPages}
          </IonLabel>

          <IonButtons slot="end">
            <AppButton
              fill="clear"
              size="small"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
              aria-label="Página siguiente"
            >
              <IonIcon icon={chevronForwardOutline} slot="icon-only" />
            </AppButton>
          </IonButtons>
        </IonToolbar>
      )}
    </Fragment>
  );
};

export default AppDataList;
