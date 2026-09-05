import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import type { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNetworkStore } from '../../store/networkStore';
import { initNetworkMonitor, resetNetworkMonitorForTests } from './networkMonitor';
import { loadActiveOutboxIntent, processOwnProfileOutbox } from './syncEngine';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => true) },
}));

vi.mock('@capacitor/network', () => ({
  Network: { getStatus: vi.fn(), addListener: vi.fn() },
}));

vi.mock('./syncEngine', () => ({
  loadActiveOutboxIntent: vi.fn(),
  processOwnProfileOutbox: vi.fn(),
}));

const queryClient = {} as QueryClient;

describe('services/offline/networkMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetNetworkMonitorForTests();
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    useNetworkStore.setState({ isOnline: true });
  });

  it('is a no-op on non-native platforms', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    await initNetworkMonitor(queryClient);

    expect(Network.getStatus).not.toHaveBeenCalled();
  });

  it('seeds networkStore from the current status and syncs once if already online', async () => {
    vi.mocked(Network.getStatus).mockResolvedValue({ connected: true, connectionType: 'wifi' });

    await initNetworkMonitor(queryClient);

    expect(useNetworkStore.getState().isOnline).toBe(true);
    expect(loadActiveOutboxIntent).toHaveBeenCalled();
    expect(processOwnProfileOutbox).toHaveBeenCalledWith(queryClient);
  });

  it('does not sync on init when the device starts offline', async () => {
    vi.mocked(Network.getStatus).mockResolvedValue({ connected: false, connectionType: 'none' });

    await initNetworkMonitor(queryClient);

    expect(useNetworkStore.getState().isOnline).toBe(false);
    expect(processOwnProfileOutbox).not.toHaveBeenCalled();
  });

  it('triggers a sync automatically when reconnecting (offline -> online), not on every change', async () => {
    vi.mocked(Network.getStatus).mockResolvedValue({ connected: false, connectionType: 'none' });
    let listener: ((status: { connected: boolean; connectionType: string }) => void) | undefined;
    vi.mocked(Network.addListener).mockImplementation((_event, handler) => {
      listener = handler as never;
      return Promise.resolve({ remove: vi.fn() } as never);
    });

    await initNetworkMonitor(queryClient);
    expect(listener).toBeDefined();

    // Sigue offline -> offline: no debe disparar sincronización.
    listener?.({ connected: false, connectionType: 'none' });
    expect(processOwnProfileOutbox).not.toHaveBeenCalled();

    // offline -> online: sí dispara, sin acción del usuario.
    listener?.({ connected: true, connectionType: 'wifi' });
    expect(useNetworkStore.getState().isOnline).toBe(true);
    expect(processOwnProfileOutbox).toHaveBeenCalledWith(queryClient);
  });
});
