import { IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import { alertCircleOutline, closeOutline, locateOutline } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import AppButton from '../common/AppButton';
import { classifyGeolocationError, detectCurrentPosition, GEOLOCATION_MESSAGES } from './geolocation';
import './LocationPickerModal.css';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  initialLatitude?: number;
  initialLongitude?: number;
  onConfirm: (coordinates: Coordinates) => void;
  onCancel: () => void;
}

// Ecuador (centro aproximado del país): punto de partida razonable cuando la cancha todavía no
// tiene coordenadas y el usuario no detectó su ubicación.
const DEFAULT_CENTER: [number, number] = [-1.8312, -78.1834];
const DEFAULT_ZOOM = 6;
const SELECTED_ZOOM = 16;

// L.Icon.Default apunta a marker-icon.png/marker-shadow.png por URL relativa, que se rompe con
// bundlers (problema conocido de Leaflet). Un divIcon evita depender de esos assets.
const markerIcon = L.divIcon({
  className: 'location-picker-marker',
  html: '<span></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 20],
});

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  initialLatitude,
  initialLongitude,
  onConfirm,
  onCancel,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState<Coordinates | undefined>(
    initialLatitude !== undefined && initialLongitude !== undefined
      ? { latitude: initialLatitude, longitude: initialLongitude }
      : undefined,
  );
  const [locateError, setLocateError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const placeMarker = (latitude: number, longitude: number): void => {
    setSelected({ latitude, longitude });
    if (!mapRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude], { icon: markerIcon }).addTo(mapRef.current);
    }
  };

  // Callback ref en vez de useEffect + useRef: IonModal monta su contenido de forma asíncrona
  // (según su ciclo de vida de presentación), así que el <div> del mapa puede no existir todavía
  // cuando un efecto corre justo después del montaje inicial. Un callback ref se dispara
  // exactamente cuando el nodo real aparece o desaparece en el DOM, sin depender de ese timing.
  const mapContainerRef = useCallback(
    (container: HTMLDivElement | null) => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
      if (!container) {
        mapRef.current?.remove();
        mapRef.current = null;
        markerRef.current = null;
        return;
      }
      if (mapRef.current) return;

      const hasInitial = initialLatitude !== undefined && initialLongitude !== undefined;
      const initialCenter: [number, number] = hasInitial
        ? [initialLatitude as number, initialLongitude as number]
        : DEFAULT_CENTER;

      const map = L.map(container).setView(initialCenter, hasInitial ? SELECTED_ZOOM : DEFAULT_ZOOM);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      map.on('click', (event: L.LeafletMouseEvent) => placeMarker(event.latlng.lat, event.latlng.lng));
      mapRef.current = map;

      if (hasInitial) {
        markerRef.current = L.marker(initialCenter, { icon: markerIcon }).addTo(map);
      }

      // El contenedor puede no tener aún su tamaño final cuando el modal recién se abre.
      resizeTimeoutRef.current = setTimeout(() => map.invalidateSize(), 150);
    },
    [initialLatitude, initialLongitude],
  );

  useEffect(() => {
    if (!isOpen) {
      setSelected(
        initialLatitude !== undefined && initialLongitude !== undefined
          ? { latitude: initialLatitude, longitude: initialLongitude }
          : undefined,
      );
      setLocateError(null);
    }
  }, [isOpen, initialLatitude, initialLongitude]);

  const locateMe = async (): Promise<void> => {
    setLocateError(null);
    setIsLocating(true);
    try {
      const { latitude, longitude } = await detectCurrentPosition();
      placeMarker(latitude, longitude);
      mapRef.current?.setView([latitude, longitude], SELECTED_ZOOM);
    } catch (error) {
      setLocateError(GEOLOCATION_MESSAGES[classifyGeolocationError(error)]);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} className="location-picker-modal" onDidDismiss={onCancel}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Elegir ubicación</IonTitle>
          <IonButtons slot="end">
            <AppButton fill="clear" aria-label="Cerrar" onClick={onCancel}>
              <IonIcon icon={closeOutline} slot="icon-only" />
            </AppButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false} className="location-picker-modal__content">
        <div className="location-picker-modal__body">
          <div ref={mapContainerRef} className="location-picker-modal__map" data-testid="location-picker-map" />
          <div className="location-picker-modal__panel">
            {locateError ? (
              <p className="location-picker-modal__notice" role="alert">
                <IonIcon icon={alertCircleOutline} aria-hidden="true" />
                <span>{locateError}</span>
              </p>
            ) : (
              <p className="location-picker-modal__hint" role="status">
                {selected
                  ? `Punto elegido: ${selected.latitude.toFixed(6)}, ${selected.longitude.toFixed(6)}`
                  : 'Toca el mapa para marcar la ubicación de la cancha.'}
              </p>
            )}
            <AppButton fill="outline" expand="block" isLoading={isLocating} onClick={() => void locateMe()}>
              <IonIcon icon={locateOutline} slot="start" />
              Usar mi ubicación
            </AppButton>
            <div className="location-picker-modal__buttons">
              <AppButton fill="outline" onClick={onCancel}>
                Cancelar
              </AppButton>
              <AppButton disabled={!selected} onClick={() => selected && onConfirm(selected)}>
                Confirmar ubicación
              </AppButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default LocationPickerModal;
