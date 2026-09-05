import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  setOnline: (isOnline: boolean) => void;
}

// Espejo imperativo de la conectividad (igual que sessionStore.ts) para que código no-React,
// como services/offline/networkMonitor.ts, pueda leer/escribir el estado sin depender de hooks.
export const useNetworkStore = create<NetworkState>(set => ({
  isOnline: true,
  setOnline: isOnline => set({ isOnline }),
}));
