import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OutboxIntentRow } from '../../../services/offline/outboxTypes';

vi.mock('@ionic/react', () => ({
  IonChip: ({ children, 'data-testid': testId }: React.PropsWithChildren<{ 'data-testid'?: string }>) => (
    <div data-testid={testId}>{children}</div>
  ),
  IonIcon: () => <span />,
  IonLabel: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
  IonSpinner: () => <span>spinner</span>,
  IonButton: ({ children, onClick }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  IonAlert: ({
    header,
    message,
    buttons,
  }: {
    header: string;
    message: string;
    buttons: Array<{ text: string; handler?: () => void }>;
  }) => (
    <div role="alertdialog" aria-label={header}>
      <p>{message}</p>
      {buttons.map(button => (
        <button key={button.text} type="button" onClick={button.handler}>
          {button.text}
        </button>
      ))}
    </div>
  ),
}));

import OutboxStatusBanner from './OutboxStatusBanner';

const baseIntent: OutboxIntentRow = {
  id: 'intent-1',
  status: 'pending',
  phone: null,
  facebookUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  xUrl: null,
  githubUrl: null,
  tiktokUrl: null,
  websiteUrl: null,
  expectedProfileUpdatedAt: '2026-01-01T00:00:00.000Z',
  attemptCount: 0,
  nextAttemptAt: null,
  lastErrorCode: null,
  lastErrorMessage: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const noop = () => {};

describe('OutboxStatusBanner', () => {
  it('renders nothing when online with no pending intent and nothing just synced', () => {
    const { container } = render(
      <OutboxStatusBanner
        intent={null}
        isOnline
        isSyncing={false}
        justSynced={false}
        onRetryNow={noop}
        onKeepMineAfterConflict={noop}
        onDiscardPending={noop}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the offline state', () => {
    render(
      <OutboxStatusBanner
        intent={null}
        isOnline={false}
        isSyncing={false}
        justSynced={false}
        onRetryNow={noop}
        onKeepMineAfterConflict={noop}
        onDiscardPending={noop}
      />,
    );
    expect(screen.getByTestId('outbox-status-offline')).toHaveTextContent('Sin conexión');
  });

  it('shows the pending state', () => {
    render(
      <OutboxStatusBanner
        intent={baseIntent}
        isOnline
        isSyncing={false}
        justSynced={false}
        onRetryNow={noop}
        onKeepMineAfterConflict={noop}
        onDiscardPending={noop}
      />,
    );
    expect(screen.getByTestId('outbox-status-pending')).toHaveTextContent('Pendiente de sincronizar');
  });

  it('shows the syncing state', () => {
    render(
      <OutboxStatusBanner
        intent={{ ...baseIntent, status: 'syncing' }}
        isOnline
        isSyncing
        justSynced={false}
        onRetryNow={noop}
        onKeepMineAfterConflict={noop}
        onDiscardPending={noop}
      />,
    );
    expect(screen.getByTestId('outbox-status-syncing')).toHaveTextContent('Sincronizando');
  });

  it('shows the synced badge only via the ephemeral justSynced flag (the row is already gone)', () => {
    render(
      <OutboxStatusBanner
        intent={null}
        isOnline
        isSyncing={false}
        justSynced
        onRetryNow={noop}
        onKeepMineAfterConflict={noop}
        onDiscardPending={noop}
      />,
    );
    expect(screen.getByTestId('outbox-status-synced')).toHaveTextContent('Sincronizado');
  });

  it('shows a terminal error with a manual retry action', () => {
    const onRetryNow = vi.fn();
    render(
      <OutboxStatusBanner
        intent={{ ...baseIntent, status: 'error', nextAttemptAt: null, lastErrorMessage: 'Sesión expirada.' }}
        isOnline
        isSyncing={false}
        justSynced={false}
        onRetryNow={onRetryNow}
        onKeepMineAfterConflict={noop}
        onDiscardPending={noop}
      />,
    );
    expect(screen.getByTestId('outbox-status-error')).toHaveTextContent('Sesión expirada.');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetryNow).toHaveBeenCalledTimes(1);
  });

  it('never offers a manual retry while a backoff retry is already scheduled', () => {
    render(
      <OutboxStatusBanner
        intent={{ ...baseIntent, status: 'error', nextAttemptAt: '2026-01-01T00:05:00.000Z' }}
        isOnline
        isSyncing={false}
        justSynced={false}
        onRetryNow={noop}
        onKeepMineAfterConflict={noop}
        onDiscardPending={noop}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });

  it('on conflict, requires an explicit decision and never auto-resolves', () => {
    const onKeepMineAfterConflict = vi.fn();
    const onDiscardPending = vi.fn();
    render(
      <OutboxStatusBanner
        intent={{ ...baseIntent, status: 'conflict' }}
        isOnline
        isSyncing={false}
        justSynced={false}
        onRetryNow={noop}
        onKeepMineAfterConflict={onKeepMineAfterConflict}
        onDiscardPending={onDiscardPending}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Usar mis cambios de nuevo' }));
    expect(onKeepMineAfterConflict).toHaveBeenCalledTimes(1);
    expect(onDiscardPending).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Descartar mi cambio pendiente' }));
    expect(onDiscardPending).toHaveBeenCalledTimes(1);
  });
});
