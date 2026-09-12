import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LocationPickerModal from './LocationPickerModal';

// IonModal/IonAlert reales orquestan un ciclo de vida de overlay (present/dismiss) asíncrono
// que jsdom no completa de forma realista, y que deja promesas de "dismiss" resolviéndose
// después de que Testing Library desmonta el árbol — provocando "unhandled rejection" ajenos a
// la lógica de este componente. Se reemplazan por marcado condicional simple: lo que se prueba
// aquí es el comportamiento de LocationPickerModal (mapa, geolocalización, confirmación), no el
// ciclo de vida de los overlays de Ionic, que es responsabilidad de Ionic.
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonModal: ({ isOpen, children }: { isOpen: boolean; children?: React.ReactNode }) =>
      isOpen ? <>{children}</> : null,
    IonAlert: ({ isOpen, header, message }: { isOpen: boolean; header?: string; message?: string }) =>
      isOpen ? (
        <div role="alert">
          <p>{header}</p>
          <p>{message}</p>
        </div>
      ) : null,
  };
});

const mocks = vi.hoisted(() => {
  const mapInstance: { setView: ReturnType<typeof vi.fn>; on: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn>; invalidateSize: ReturnType<typeof vi.fn> } = {
    setView: vi.fn(),
    on: vi.fn(),
    remove: vi.fn(),
    invalidateSize: vi.fn(),
  };
  mapInstance.setView.mockReturnValue(mapInstance);

  const markerInstance: { setLatLng: ReturnType<typeof vi.fn>; addTo: ReturnType<typeof vi.fn> } = {
    setLatLng: vi.fn(),
    addTo: vi.fn(),
  };
  markerInstance.addTo.mockReturnValue(markerInstance);

  const tileLayerInstance = { addTo: vi.fn() };

  return {
    mapInstance,
    markerInstance,
    mapFn: vi.fn(() => mapInstance),
    tileLayerFn: vi.fn(() => tileLayerInstance),
    markerFn: vi.fn(() => markerInstance),
    divIconFn: vi.fn(() => ({})),
    requestPermissions: vi.fn(),
    getCurrentPosition: vi.fn(),
  };
});

vi.mock('leaflet', () => ({
  default: {
    map: mocks.mapFn,
    tileLayer: mocks.tileLayerFn,
    marker: mocks.markerFn,
    divIcon: mocks.divIconFn,
  },
}));

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    requestPermissions: mocks.requestPermissions,
    getCurrentPosition: mocks.getCurrentPosition,
  },
}));

const clickMap = (lat: number, lng: number): void => {
  const clickHandler = mocks.mapInstance.on.mock.calls.find(([event]) => event === 'click')?.[1];
  if (!clickHandler) throw new Error('El mapa no registró un handler de click');
  act(() => clickHandler({ latlng: { lat, lng } }));
};

describe('LocationPickerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('confirmar está deshabilitado sin ubicación inicial ni selección', async () => {
    const onConfirm = vi.fn();
    render(<LocationPickerModal isOpen onConfirm={onConfirm} onCancel={vi.fn()} />);

    expect(await screen.findByText('Confirmar ubicación')).toBeDisabled();
  });

  it('con coordenadas iniciales, confirmar ya está habilitado', async () => {
    const onConfirm = vi.fn();
    render(
      <LocationPickerModal isOpen initialLatitude={-0.18} initialLongitude={-78.46} onConfirm={onConfirm} onCancel={vi.fn()} />,
    );

    await waitFor(() => expect(screen.getByText('Confirmar ubicación')).not.toBeDisabled());
  });

  it('tocar el mapa habilita confirmar y envía las coordenadas elegidas', async () => {
    const onConfirm = vi.fn();
    render(<LocationPickerModal isOpen onConfirm={onConfirm} onCancel={vi.fn()} />);

    await waitFor(() => expect(mocks.mapInstance.on).toHaveBeenCalled());
    clickMap(-0.22, -78.5);

    const confirmButton = await screen.findByText('Confirmar ubicación');
    await waitFor(() => expect(confirmButton).not.toBeDisabled());
    confirmButton.click();

    expect(onConfirm).toHaveBeenCalledWith({ latitude: -0.22, longitude: -78.5 });
  });

  it('permiso de ubicación denegado muestra un mensaje y no bloquea el marcado manual', async () => {
    mocks.requestPermissions.mockResolvedValue({ location: 'denied', coarseLocation: 'denied' });
    const onConfirm = vi.fn();
    render(<LocationPickerModal isOpen onConfirm={onConfirm} onCancel={vi.fn()} />);

    await act(async () => {
      (await screen.findByText('Usar mi ubicación')).click();
    });

    expect(
      await screen.findByText('No se concedió permiso de ubicación. Puedes marcar el punto manualmente en el mapa.'),
    ).toBeInTheDocument();
    expect(mocks.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('detectar ubicación exitosamente coloca el marcador y habilita confirmar', async () => {
    mocks.requestPermissions.mockResolvedValue({ location: 'granted', coarseLocation: 'granted' });
    mocks.getCurrentPosition.mockResolvedValue({ coords: { latitude: -0.15, longitude: -78.48 } });
    const onConfirm = vi.fn();
    render(<LocationPickerModal isOpen onConfirm={onConfirm} onCancel={vi.fn()} />);

    await act(async () => {
      (await screen.findByText('Usar mi ubicación')).click();
    });

    const confirmButton = await screen.findByText('Confirmar ubicación');
    await waitFor(() => expect(confirmButton).not.toBeDisabled());
    confirmButton.click();

    expect(onConfirm).toHaveBeenCalledWith({ latitude: -0.15, longitude: -78.48 });
  });

  it('cancelar no llama a onConfirm', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<LocationPickerModal isOpen onConfirm={onConfirm} onCancel={onCancel} />);

    (await screen.findByText('Cancelar')).click();

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
