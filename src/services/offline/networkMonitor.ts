import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import type { QueryClient } from '@tanstack/react-query';
import { useNetworkStore } from '../../store/networkStore';
import { loadActiveOutboxIntent, processOwnProfileOutbox } from './syncEngine';

let initialized = false;

// Se llama una vez desde App.tsx. Mantiene networkStore al día y dispara el motor de
// sincronización automáticamente al pasar de offline a online — sin acción del usuario.
export const initNetworkMonitor = async (queryClient: QueryClient): Promise<void> => {
  if (initialized || !Capacitor.isNativePlatform()) return;
  initialized = true;

  const status = await Network.getStatus();
  useNetworkStore.getState().setOnline(status.connected);

  Network.addListener('networkStatusChange', status => {
    const wasOnline = useNetworkStore.getState().isOnline;
    useNetworkStore.getState().setOnline(status.connected);
    if (!wasOnline && status.connected) {
      void processOwnProfileOutbox(queryClient);
    }
  });

  await loadActiveOutboxIntent();
  if (status.connected) {
    void processOwnProfileOutbox(queryClient);
  }
};

// Solo para pruebas: initNetworkMonitor real solo corre una vez por sesión de app.
export const resetNetworkMonitorForTests = (): void => {
  initialized = false;
};
