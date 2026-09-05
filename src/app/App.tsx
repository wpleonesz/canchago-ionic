import { useEffect } from 'react';
import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from '../routes/AppRoutes';
import { initNetworkMonitor } from '../services/offline/networkMonitor';
import { usePreferencesStore } from '../store/preferencesStore';
import { queryClient } from './queryClient';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Dark mode palettes: Soporte de clase (.ion-palette-dark) y preferencia del sistema */
import '@ionic/react/css/palettes/dark.class.css';
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import '../theme/variables.css';
import '../theme/forms.css';

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    void usePreferencesStore.getState().loadPreferences();
    void initNetworkMonitor(queryClient);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <IonApp>
        <IonReactRouter>
          <AppRoutes />
        </IonReactRouter>
      </IonApp>
    </QueryClientProvider>
  );
};

export default App;
