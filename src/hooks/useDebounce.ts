import { useEffect, useState } from 'react';

// Genérico, reutilizable por cualquier feature con listados/búsqueda (introducido por la
// feature 005, ver tech-stack.md §3).
export const useDebounce = <T>(value: T, delayMs = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
};
