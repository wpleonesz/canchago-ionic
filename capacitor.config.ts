import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ec.canchago.app',
  appName: 'CanchaGO',
  webDir: 'dist',
  server: {
    // Por defecto Android sirve el WebView en https://localhost, y el navegador bloquea por
    // Mixed Content cualquier llamada XHR/fetch a un backend en http:// (aunque sea solo de
    // desarrollo local) — todas las llamadas a la API quedaban bloqueadas en silencio.
    // http:// para el origen local no baja seguridad real (son archivos empaquetados, no
    // tráfico de red) y sigue permitiendo llamar a un backend real en https:// sin problema.
    androidScheme: 'http',
  },
};

export default config;
