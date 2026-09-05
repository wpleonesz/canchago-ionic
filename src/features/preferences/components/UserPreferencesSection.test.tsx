import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreferencesStore } from '../../../store/preferencesStore';
import UserPreferencesSection from './UserPreferencesSection';

describe('UserPreferencesSection', () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      preferences: {
        theme: 'system',
        displayDensity: 'comfortable',
        pageSize: 20,
        confirmBeforeActions: true,
      },
      isLoading: false,
      isSaving: false,
      error: null,
      successMessage: null,
    });
  });

  it('renders preference section heading, security notice and options', () => {
    render(<UserPreferencesSection />);

    expect(screen.getByText('Preferencias de la aplicación')).toBeInTheDocument();
    expect(screen.getByText(/Seguridad y privacidad:/i)).toBeInTheDocument();
    expect(screen.getByText('Tema visual')).toBeInTheDocument();
    expect(screen.getByText('Densidad de listas')).toBeInTheDocument();
    expect(screen.getByText('Elementos por página')).toBeInTheDocument();
    expect(screen.getByText('Confirmar acciones críticas')).toBeInTheDocument();
    expect(screen.getByText('Restablecer valores predeterminados')).toBeInTheDocument();
  });

  it('renders loading spinner when isLoading is true', () => {
    usePreferencesStore.setState({ isLoading: true });

    render(<UserPreferencesSection />);

    expect(screen.getByText('Cargando tus preferencias locales...')).toBeInTheDocument();
  });

  it('renders error message when error is present', () => {
    usePreferencesStore.setState({ error: 'Fallo al guardar la preferencia' });

    render(<UserPreferencesSection />);

    expect(screen.getByText('Fallo al guardar la preferencia')).toBeInTheDocument();
  });

  it('renders success message when successMessage is present', () => {
    usePreferencesStore.setState({ successMessage: 'Preferencia guardada correctamente.' });

    render(<UserPreferencesSection />);

    expect(screen.getByText('Preferencia guardada correctamente.')).toBeInTheDocument();
  });

  it('calls resetPreferences when clicking the reset button', () => {
    const resetSpy = vi.fn();
    usePreferencesStore.setState({ resetPreferences: resetSpy });

    render(<UserPreferencesSection />);

    const resetButton = screen.getByText('Restablecer valores predeterminados');
    fireEvent.click(resetButton);

    expect(resetSpy).toHaveBeenCalledTimes(1);
  });
});
