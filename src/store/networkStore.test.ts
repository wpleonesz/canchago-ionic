import { describe, expect, it } from 'vitest';
import { useNetworkStore } from './networkStore';

describe('store/networkStore', () => {
  it('defaults to online', () => {
    expect(useNetworkStore.getState().isOnline).toBe(true);
  });

  it('setOnline updates the flag', () => {
    useNetworkStore.getState().setOnline(false);
    expect(useNetworkStore.getState().isOnline).toBe(false);
    useNetworkStore.getState().setOnline(true);
    expect(useNetworkStore.getState().isOnline).toBe(true);
  });
});
