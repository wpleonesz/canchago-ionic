import { useNetworkStore } from '../store/networkStore';

export const useNetworkStatus = (): boolean => useNetworkStore(state => state.isOnline);
