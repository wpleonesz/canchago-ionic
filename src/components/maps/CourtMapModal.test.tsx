import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResourceDto } from '../../types/api/reservas';
import CourtMapModal from './CourtMapModal';

// IonModal real orquesta un ciclo de overlay asíncrono que jsdom no completa; se prueba el comportamiento del
// componente (mapa, ubicación, recuadro), no el overlay de Ionic.
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonModal: ({ isOpen, children }: { isOpen: boolean; children?: React.ReactNode }) =>
      isOpen ? <>{children}</> : null,
  };
});

const mocks = vi.hoisted(() => {
  const mapInstance = { setView: vi.fn(), fitBounds: vi.fn(), remove: vi.fn(), invalidateSize: vi.fn(), on: vi.fn() };
  mapInstance.setView.mockReturnValue(mapInstance);
  const layer = () => {
    const instance = { addTo: vi.fn(), setLatLng: vi.fn(), setLatLngs: vi.fn(), remove: vi.fn() };
    instance.addTo.mockReturnValue(instance);
    return instance;
  };
  return {
    mapInstance,
    layer,
    markerFn: vi.fn(() => layer()),
    polylineFn: vi.fn(() => layer()),
    tileLayerFn: vi.fn(() => ({ addTo: vi.fn() })),
    detectCurrentPosition: vi.fn(),
  };
});

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => mocks.mapInstance),
    tileLayer: mocks.tileLayerFn,
    marker: mocks.markerFn,
    polyline: mocks.polylineFn,
    divIcon: vi.fn(() => ({})),
    latLngBounds: vi.fn((points: unknown) => points),
  },
}));

vi.mock('./geolocation', async () => {
  const actual = await vi.importActual<typeof import('./geolocation')>('./geolocation');
  return { ...actual, detectCurrentPosition: mocks.detectCurrentPosition };
});

const resource: ResourceDto = {
  id: 'r1',
  name: 'Cancha Norte',
  description: null,
  address: 'Av. Principal 123',
  latitude: '-0.1807',
  longitude: '-78.4678',
  hourlyPrice: '25.00',
  currency: 'USD',
  updatedAt: '2030-01-01T00:00:00.000Z',
  status: 'ACTIVE',
  weekdayDiscounts: [],
  venue: { id: 'v1', name: 'Sede Uno', organization: { id: 'o1', name: 'Club Uno' } },
};

describe('CourtMapModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra los detalles de la cancha y el enlace de cómo llegar', async () => {
    mocks.detectCurrentPosition.mockResolvedValue({ latitude: -0.19, longitude: -78.47 });
    render(<CourtMapModal isOpen resource={resource} onClose={vi.fn()} />);

    expect(await screen.findByText('Cancha Norte')).toBeInTheDocument();
    expect(screen.getByText('Sede Uno · Club Uno')).toBeInTheDocument();
    expect(screen.getByText('Av. Principal 123')).toBeInTheDocument();
    expect(screen.getByText(/25,00/)).toBeInTheDocument();
    expect(screen.getByText('Cómo llegar').closest('ion-button')).toHaveAttribute(
      'href',
      expect.stringContaining('destination=-0.1807%2C-78.4678'),
    );
  });

  it('marca la cancha y, al obtener la ubicación, al usuario con línea, encuadre y distancia', async () => {
    mocks.detectCurrentPosition.mockResolvedValue({ latitude: -0.19, longitude: -78.47 });
    render(<CourtMapModal isOpen resource={resource} onClose={vi.fn()} />);

    await waitFor(() => expect(mocks.polylineFn).toHaveBeenCalled());
    expect(mocks.markerFn).toHaveBeenCalledTimes(2);
    expect(mocks.mapInstance.fitBounds).toHaveBeenCalled();
    expect(await screen.findByText(/en línea recta hasta la cancha/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/\d+ m|\d+(,\d)? km/);
  });

  it('sin permiso de ubicación sigue mostrando la cancha y avisa en español', async () => {
    mocks.detectCurrentPosition.mockRejectedValue({ code: 'OS-PLUG-GLOC-0003' });
    render(<CourtMapModal isOpen resource={resource} onClose={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('permiso de ubicación');
    expect(screen.getByText('Cancha Norte')).toBeInTheDocument();
    expect(mocks.markerFn).toHaveBeenCalledTimes(1);
    expect(mocks.polylineFn).not.toHaveBeenCalled();
  });

  it('"Mi ubicación" reintenta la detección', async () => {
    mocks.detectCurrentPosition.mockRejectedValueOnce({ code: 'OS-PLUG-GLOC-0007' });
    render(<CourtMapModal isOpen resource={resource} onClose={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('GPS');

    mocks.detectCurrentPosition.mockResolvedValueOnce({ latitude: -0.19, longitude: -78.47 });
    await act(async () => screen.getByText('Mi ubicación').click());

    expect(mocks.detectCurrentPosition).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/en línea recta hasta la cancha/)).toBeInTheDocument();
  });

  it('es de solo lectura: no registra clicks sobre el mapa', async () => {
    mocks.detectCurrentPosition.mockResolvedValue({ latitude: -0.19, longitude: -78.47 });
    render(<CourtMapModal isOpen resource={resource} onClose={vi.fn()} />);
    await waitFor(() => expect(mocks.polylineFn).toHaveBeenCalled());

    expect(mocks.mapInstance.on).not.toHaveBeenCalled();
  });

  it('no renderiza nada si la cancha no tiene coordenadas', () => {
    const { container } = render(
      <CourtMapModal isOpen resource={{ ...resource, latitude: null, longitude: null }} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(mocks.detectCurrentPosition).not.toHaveBeenCalled();
  });
});
