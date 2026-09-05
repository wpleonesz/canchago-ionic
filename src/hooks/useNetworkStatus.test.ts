import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useNetworkStore } from '../store/networkStore';
import { useNetworkStatus } from './useNetworkStatus';

describe('hooks/useNetworkStatus', () => {
  it('reflects networkStore.isOnline', () => {
    useNetworkStore.setState({ isOnline: true });
    const { result, rerender } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(true);

    useNetworkStore.setState({ isOnline: false });
    rerender();
    expect(result.current).toBe(false);
  });
});
