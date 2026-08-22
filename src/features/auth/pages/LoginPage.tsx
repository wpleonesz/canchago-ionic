import { zodResolver } from '@hookform/resolvers/zod';
import { Capacitor } from '@capacitor/core';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { IonInputPasswordToggle, IonText } from '@ionic/react';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/forms/AppInput';
import AppPage from '../../../components/layout/AppPage';
import { loginWithPassword, redirectToLogin } from '../../../services/api/endpoints/auth';
import { AuthenticationError } from '../../../services/api/errorMapper';
import { setSessionToken } from '../../../services/storage/secureToken';
import { logger } from '../../../services/telemetry/logger';
import { loginFormSchema, type LoginFormValues } from '../../../validation/auth';
import AuthShell from '../components/AuthShell';
import { SESSION_QUERY_KEY } from '../hooks/useSession';
import './login-page.css';

// Web/dev (feature 002): sigue siendo el flujo OAuth existente contra Keycloak vía el proxy de
// Vite — nadie pidió cambiar eso, solo cómo se ve el login DENTRO de la app empaquetada.
const WebLogin: React.FC<{ hasAuthError: boolean }> = ({ hasAuthError }) => {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <AuthShell title="Te damos la bienvenida" description="Continúa con tu cuenta segura de CanchaGO.">
      {hasAuthError && (
        <IonText className="auth-message auth-message--error" role="alert">
          <p>No se pudo completar el inicio de sesión. Intenta nuevamente.</p>
        </IonText>
      )}
      <AppButton
        expand="block"
        isLoading={isNavigating}
        onClick={() => {
          setIsNavigating(true);
          redirectToLogin();
        }}
      >
        Continuar
      </AppButton>
      <p className="auth-shell__privacy">Tus datos de acceso se procesan de forma segura.</p>
    </AuthShell>
  );
};

// Nativo (feature 003): formulario propio de usuario/contraseña — el backend habla con
// Keycloak por detrás, la app nunca abre un navegador ni una pantalla ajena.
const NativeLoginForm: React.FC = () => {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setSubmitError(null);

    try {
      const { sessionToken } = await loginWithPassword(values.username, values.password);
      await setSessionToken(sessionToken);
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    } catch (error) {
      const message =
        error instanceof AuthenticationError
          ? 'Usuario o contraseña incorrectos.'
          : 'No se pudo iniciar sesión. Intenta de nuevo.';
      logger.warn('Login nativo falló', { code: error instanceof AuthenticationError ? error.code : 'UNKNOWN' });
      setSubmitError(message);
    }
  };

  return (
    <AuthShell title="Inicia sesión" description="Ingresa tus credenciales para continuar.">
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Controller
          name="username"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Usuario"
              autocomplete="username"
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput
              label="Contraseña"
              type="password"
              autocomplete="current-password"
              value={field.value}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              onIonInput={event => field.onChange(event.detail.value)}
              onIonBlur={field.onBlur}
            >
              <IonInputPasswordToggle slot="end" />
            </AppInput>
          )}
        />

        {submitError && (
          <IonText className="auth-message auth-message--error" role="alert" aria-live="polite">
            <p>{submitError}</p>
          </IonText>
        )}

        <AppButton expand="block" type="submit" isLoading={isSubmitting}>
          Iniciar sesión
        </AppButton>
      </form>
      <p className="auth-shell__privacy">Nunca compartiremos tus credenciales.</p>
    </AuthShell>
  );
};

const LoginPage: React.FC = () => {
  const location = useLocation();
  const hasAuthError = new URLSearchParams(location.search).get('error') === 'auth';

  return (
    <AppPage title="Iniciar sesión en CanchaGO" showHeader={false}>
      {Capacitor.isNativePlatform() ? <NativeLoginForm /> : <WebLogin hasAuthError={hasAuthError} />}
    </AppPage>
  );
};

export default LoginPage;
