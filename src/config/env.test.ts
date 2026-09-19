import { describe, expect, it } from 'vitest';
import { env, resolveApiBaseUrl } from './env';

describe('env', () => {
  it('exposes an apiBaseUrl read from VITE_API_BASE_URL', () => {
    expect(env.apiBaseUrl).toBeTruthy();
  });

  it('defaults apiTimeoutMs to a positive number', () => {
    expect(env.apiTimeoutMs).toBeGreaterThan(0);
  });

  describe('resolveApiBaseUrl', () => {
    const sources = {
      base: 'https://api.example.com/api',
      android: 'http://10.0.2.2:3000/api',
      ios: 'http://localhost:3000/api',
    };

    it('usa la URL específica de cada plataforma nativa', () => {
      expect(resolveApiBaseUrl({ platform: 'android', ...sources })).toBe('http://10.0.2.2:3000/api');
      expect(resolveApiBaseUrl({ platform: 'ios', ...sources })).toBe('http://localhost:3000/api');
    });

    it('en web usa VITE_API_BASE_URL', () => {
      expect(resolveApiBaseUrl({ platform: 'web', ...sources })).toBe('https://api.example.com/api');
    });

    it('si falta la URL de la plataforma, cae a VITE_API_BASE_URL', () => {
      expect(resolveApiBaseUrl({ platform: 'ios', base: '/api' })).toBe('/api');
    });

    it('falla con un mensaje claro si no hay ninguna URL', () => {
      expect(() => resolveApiBaseUrl({ platform: 'android' })).toThrow(/VITE_API_BASE_URL/);
    });
  });
});
