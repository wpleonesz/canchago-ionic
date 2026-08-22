import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AccountTypeStep from './AccountTypeStep';

describe('AccountTypeStep', () => {
  it('calls onSelect with "futbolista" when the player card is chosen', () => {
    const onSelect = vi.fn();
    render(<AccountTypeStep onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Jugar y reservar canchas'));

    expect(onSelect).toHaveBeenCalledWith('futbolista');
  });

  it('calls onSelect with "gestor-de-cancha" when the manager card is chosen', () => {
    const onSelect = vi.fn();
    render(<AccountTypeStep onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Gestionar una cancha'));

    expect(onSelect).toHaveBeenCalledWith('gestor-de-cancha');
  });
});
