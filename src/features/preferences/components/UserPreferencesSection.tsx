import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonToggle,
} from '@ionic/react';
import {
  checkmarkCircleOutline,
  colorPaletteOutline,
  informationCircleOutline,
  listOutline,
  optionsOutline,
  refreshOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { usePreferencesStore } from '../../../store/preferencesStore';
import type { DisplayDensity, PageSize, ThemeMode } from '../../../services/storage/userPreferences';
import './user-preferences.css';

const UserPreferencesSection: React.FC = () => {
  const { preferences, isLoading, isSaving, error, successMessage, updatePreference, resetPreferences } =
    usePreferencesStore();

  if (isLoading) {
    return (
      <section className="user-preferences-section" aria-label="Preferencias de la aplicación">
        <div className="user-preferences-loading">
          <IonSpinner name="crescent" aria-label="Cargando preferencias" />
          <IonNote>Cargando tus preferencias locales...</IonNote>
        </div>
      </section>
    );
  }

  return (
    <section className="user-preferences-section" aria-labelledby="user-preferences-title">
      <header className="user-preferences-header">
        <p className="user-preferences-eyebrow">Personalización</p>
        <h2 id="user-preferences-title">Preferencias de la aplicación</h2>
        <p>
          Configuración visual y de interfaz guardada localmente en tu dispositivo mediante almacenamiento clave/valor.
        </p>
      </header>

      <div className="user-preferences-notice" role="note">
        <IonIcon icon={informationCircleOutline} aria-hidden="true" />
        <IonNote>
          <strong>Seguridad y privacidad:</strong> Estas preferencias corresponden únicamente a datos no sensibles.
          Tokens de sesión y credenciales nunca se guardan en este mecanismo.
        </IonNote>
      </div>

      {error && (
        <IonText color="danger" className="user-preferences-feedback" role="alert">
          <p>{error}</p>
        </IonText>
      )}

      {successMessage && (
        <IonText color="success" className="user-preferences-feedback" role="status">
          <p>
            <IonIcon icon={checkmarkCircleOutline} aria-hidden="true" /> {successMessage}
          </p>
        </IonText>
      )}

      <IonList lines="full" className="user-preferences-list">
        <IonListHeader>
          <IonLabel>Visualización e interfaz</IonLabel>
          {isSaving && <IonSpinner name="dots" className="user-preferences-saving-spinner" aria-label="Guardando" />}
        </IonListHeader>

        <IonItem>
          <IonIcon slot="start" icon={colorPaletteOutline} aria-hidden="true" />
          <IonLabel>
            <h3>Tema visual</h3>
            <p>Modo de color de la interfaz</p>
          </IonLabel>
          <IonSelect
            value={preferences.theme}
            interface="popover"
            aria-label="Tema visual"
            disabled={isSaving}
            onIonChange={e => void updatePreference('theme', e.detail.value as ThemeMode)}
          >
            <IonSelectOption value="system">Automático (del sistema)</IonSelectOption>
            <IonSelectOption value="light">Claro</IonSelectOption>
            <IonSelectOption value="dark">Oscuro</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonIcon slot="start" icon={optionsOutline} aria-hidden="true" />
          <IonLabel>
            <h3>Densidad de listas</h3>
            <p>Espaciado y tamaño de filas</p>
          </IonLabel>
          <IonSelect
            value={preferences.displayDensity}
            interface="popover"
            aria-label="Densidad de listas"
            disabled={isSaving}
            onIonChange={e => void updatePreference('displayDensity', e.detail.value as DisplayDensity)}
          >
            <IonSelectOption value="comfortable">Cómoda (predeterminada)</IonSelectOption>
            <IonSelectOption value="compact">Compacta</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonIcon slot="start" icon={listOutline} aria-hidden="true" />
          <IonLabel>
            <h3>Elementos por página</h3>
            <p>Cantidad predeterminada en listados</p>
          </IonLabel>
          <IonSelect
            value={preferences.pageSize}
            interface="popover"
            aria-label="Elementos por página"
            disabled={isSaving}
            onIonChange={e => void updatePreference('pageSize', Number(e.detail.value) as PageSize)}
          >
            <IonSelectOption value={10}>10 por página</IonSelectOption>
            <IonSelectOption value={20}>20 por página (recomendado)</IonSelectOption>
            <IonSelectOption value={50}>50 por página</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonIcon slot="start" icon={shieldCheckmarkOutline} aria-hidden="true" />
          <IonLabel>
            <h3>Confirmar acciones críticas</h3>
            <p>Solicitar confirmación antes de cambios irreversibles</p>
          </IonLabel>
          <IonToggle
            slot="end"
            checked={preferences.confirmBeforeActions}
            disabled={isSaving}
            aria-label="Confirmar acciones críticas"
            onIonChange={e => void updatePreference('confirmBeforeActions', e.detail.checked)}
          />
        </IonItem>
      </IonList>

      <div className="user-preferences-actions">
        <IonButton
          fill="outline"
          color="medium"
          size="default"
          disabled={isSaving}
          onClick={() => void resetPreferences()}
        >
          <IonIcon slot="start" icon={refreshOutline} aria-hidden="true" />
          Restablecer valores predeterminados
        </IonButton>
      </div>
    </section>
  );
};

export default UserPreferencesSection;
