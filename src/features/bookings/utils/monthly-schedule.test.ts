import { describe, expect, it, vi } from 'vitest';
import { blocksOverlap, buildMonthlySlots } from './monthly-schedule';

describe('programación mensual', () => {
  it('genera una franja por cada día seleccionado del mes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T00:00:00-05:00'));
    const slots = buildMonthlySlots('2026-09', [1], [{ id: '1', startsAt: '08:00', endsAt: '09:00' }]);
    expect(slots).toHaveLength(4);
    vi.useRealTimers();
  });

  it('detecta bloques horarios superpuestos', () => {
    expect(
      blocksOverlap([
        { id: '1', startsAt: '08:00', endsAt: '10:00' },
        { id: '2', startsAt: '09:00', endsAt: '11:00' },
      ]),
    ).toBe(true);
  });
});
