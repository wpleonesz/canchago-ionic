import { NetworkError, ServerError, TimeoutError, type AppClientError } from '../api/errorMapper';

// Basado exclusivamente en las clases reales de services/api/errorMapper.ts (plan.md §Motor de
// reintentos). Fail-safe por defecto: cualquier clase no listada aquí se trata como terminal.
export const isRetryableError = (error: AppClientError): boolean =>
  error instanceof NetworkError || error instanceof TimeoutError || error instanceof ServerError;

const BASE_DELAY_MS = 5_000; // 5 s
const MAX_DELAY_MS = 5 * 60_000; // 5 min
export const MAX_AUTO_ATTEMPTS = 8;

// Backoff exponencial con "full jitter" (patrón AWS): evita que varios dispositivos reconectando
// a la vez golpeen el servidor en el mismo instante.
export const computeNextAttempt = (attemptCount: number): { delayMs: number; nextAttemptAt: string } => {
  const cap = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attemptCount);
  const delayMs = Math.floor(Math.random() * cap);
  return { delayMs, nextAttemptAt: new Date(Date.now() + delayMs).toISOString() };
};
