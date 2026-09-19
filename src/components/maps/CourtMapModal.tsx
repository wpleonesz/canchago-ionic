import { IonButtons, IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import { alertCircleOutline, closeOutline, locateOutline, navigateOutline } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { directionsUrl, formatUsd, resourceCoordinates } from '../../features/bookings/utils/maps';
import type { ResourceDto } from '../../types/api/reservas';
import { distanceMeters, formatDistance, type GeoPoint } from '../../utils/geo';
import AppButton from '../common/AppButton';
import { classifyGeolocationError, detectCurrentPosition, GEOLOCATION_MESSAGES } from './geolocation';
import './CourtMapModal.css';

interface CourtMapModalProps {
  isOpen: boolean;
  resource: ResourceDto | null;
  onClose: () => void;
}

const DEFAULT_ZOOM = 16;

const courtIcon = L.divIcon({
  className: 'court-map-court',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

const userIcon = L.divIcon({
  className: 'court-map-user',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Mapa de solo lectura: muestra la cancha, la ubicación del usuario y la distancia en línea recta. No edita datos
// (eso es LocationPickerModal, feature 016).
const CourtMapModal: React.FC<CourtMapModalProps> = ({ isOpen, resource, onClose }) => {
  const court = resource ? resourceCoordinates(resource) : null;
  // Primitivos: mantienen estables los callbacks de abajo. Si el callback ref cambiara de identidad al llegar la
  // ubicación, React destruiría y recrearía el mapa (parpadeo y recarga de tiles).
  const courtLatitude = court?.latitude;
  const courtLongitude = court?.longitude;
  const userPositionRef = useRef<GeoPoint | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);
  const [userPosition, setUserPosition] = useState<GeoPoint | null>(null);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Dibuja o actualiza la capa del usuario y reencuadra: solo la cancha, o cancha + usuario si hay ubicación.
  const syncUserLayer = useCallback(
    (position: GeoPoint | null): void => {
      const map = mapRef.current;
      if (!map || courtLatitude === undefined || courtLongitude === undefined) return;
      if (!position) {
        userMarkerRef.current?.remove();
        lineRef.current?.remove();
        userMarkerRef.current = null;
        lineRef.current = null;
        map.setView([courtLatitude, courtLongitude], DEFAULT_ZOOM);
        return;
      }
      const userLatLng: [number, number] = [position.latitude, position.longitude];
      const courtLatLng: [number, number] = [courtLatitude, courtLongitude];
      if (userMarkerRef.current) userMarkerRef.current.setLatLng(userLatLng);
      else userMarkerRef.current = L.marker(userLatLng, { icon: userIcon, keyboard: false }).addTo(map);
      if (lineRef.current) lineRef.current.setLatLngs([userLatLng, courtLatLng]);
      else
        lineRef.current = L.polyline([userLatLng, courtLatLng], {
          color: '#1769e0',
          weight: 3,
          dashArray: '6 8',
        }).addTo(map);
      map.fitBounds(L.latLngBounds([userLatLng, courtLatLng]), { padding: [48, 48], maxZoom: DEFAULT_ZOOM });
    },
    [courtLatitude, courtLongitude],
  );

  const locate = useCallback(async (): Promise<void> => {
    setLocateError(null);
    setIsLocating(true);
    try {
      setUserPosition(await detectCurrentPosition());
    } catch (error) {
      setLocateError(GEOLOCATION_MESSAGES[classifyGeolocationError(error)]);
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Callback ref (como en LocationPickerModal): IonModal monta su contenido de forma asíncrona, así que el <div> del
  // mapa puede no existir cuando corre un efecto; el callback ref se dispara cuando el nodo real aparece o se va.
  const mapContainerRef = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container) {
        mapRef.current?.remove();
        mapRef.current = null;
        userMarkerRef.current = null;
        lineRef.current = null;
        return;
      }
      if (mapRef.current || courtLatitude === undefined || courtLongitude === undefined) return;
      const map = L.map(container, { attributionControl: true }).setView([courtLatitude, courtLongitude], DEFAULT_ZOOM);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      L.marker([courtLatitude, courtLongitude], { icon: courtIcon, keyboard: false }).addTo(map);
      mapRef.current = map;
      syncUserLayer(userPositionRef.current);
      setTimeout(() => map.invalidateSize(), 150);
    },
    [courtLatitude, courtLongitude, syncUserLayer],
  );

  // Ubicación una sola vez al abrir; al cerrar se limpia para no mostrar una posición vieja la próxima vez.
  useEffect(() => {
    if (isOpen && court) void locate();
    if (!isOpen) {
      setUserPosition(null);
      setLocateError(null);
    }
    // court cambia de identidad en cada render; basta reaccionar a la apertura y a la cancha elegida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, resource?.id]);

  useEffect(() => {
    userPositionRef.current = userPosition;
    syncUserLayer(userPosition);
  }, [userPosition, syncUserLayer]);

  if (!resource || !court) return null;

  const meters = userPosition ? distanceMeters(userPosition, court) : null;

  return (
    <IonModal isOpen={isOpen} className="court-map-modal" onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mapa de la cancha</IonTitle>
          <IonButtons slot="end">
            <AppButton fill="clear" aria-label="Cerrar" onClick={onClose}>
              <IonIcon icon={closeOutline} slot="icon-only" />
            </AppButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false} className="court-map-modal__content">
        <div className="court-map-modal__body">
          <div
            ref={mapContainerRef}
            className="court-map-modal__map"
            role="application"
            aria-label={`Mapa con la ubicación de ${resource.name}`}
            data-testid="court-map"
          />
          <div className="court-map-modal__panel">
            <div className="court-map-modal__details">
              <h2>{resource.name}</h2>
              <p className="court-map-modal__venue">
                {resource.venue.name} · {resource.venue.organization.name}
              </p>
              <p>{resource.address}</p>
              <p className="court-map-modal__price">{formatUsd(resource.hourlyPrice)} por hora</p>
            </div>
            {locateError ? (
              <p className="court-map-modal__notice" role="alert">
                <IonIcon icon={alertCircleOutline} aria-hidden="true" />
                <span>{locateError}</span>
              </p>
            ) : (
              <p className="court-map-modal__distance" role="status">
                {isLocating && 'Buscando tu ubicación…'}
                {!isLocating && meters !== null && (
                  <>
                    <strong>{formatDistance(meters)}</strong> en línea recta hasta la cancha
                  </>
                )}
              </p>
            )}
            <div className="court-map-modal__actions">
              <AppButton fill="outline" isLoading={isLocating} onClick={() => void locate()}>
                <IonIcon icon={locateOutline} slot="start" />
                Mi ubicación
              </AppButton>
              <AppButton href={directionsUrl(resource)} target="_blank" rel="noreferrer">
                <IonIcon icon={navigateOutline} slot="start" />
                Cómo llegar
              </AppButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default CourtMapModal;
