import { describe, expect, it } from 'vitest';
import { useSessionStore } from './sessionStore';

const sampleUser = {
  id: 'user-1',
  email: 'futbolista@canchago.local',
  name: 'Mateo Vera',
  roles: [{ id: 'role-1', code: 'futbolista', name: 'Futbolista' }],
  permissions: [],
};

describe('sessionStore', () => {
  it('starts idle with no user', () => {
    expect(useSessionStore.getState().status).toBe('idle');
    expect(useSessionStore.getState().user).toBeNull();
  });

  it('setSession marks the store as authenticated', () => {
    useSessionStore.getState().setSession(sampleUser);

    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(useSessionStore.getState().user).toEqual(sampleUser);
  });

  it('clearSession resets the store', () => {
    useSessionStore.getState().setSession(sampleUser);
    useSessionStore.getState().clearSession();

    expect(useSessionStore.getState().status).toBe('unauthenticated');
    expect(useSessionStore.getState().user).toBeNull();
  });
});
