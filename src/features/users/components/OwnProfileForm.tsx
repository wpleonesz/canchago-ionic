import { zodResolver } from '@hookform/resolvers/zod';
import { IonText } from '@ionic/react';
import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/forms/AppInput';
import type { OwnUserProfileDto, OwnProfileField } from '../../../types/api/users';
import { ownProfileFormSchema, type OwnProfileFormValues } from '../../../validation/user-profile';

const URL_FIELDS: Array<{ name: OwnProfileField; label: string }> = [
  { name: 'facebookUrl', label: 'Facebook' }, { name: 'instagramUrl', label: 'Instagram' },
  { name: 'linkedinUrl', label: 'LinkedIn' }, { name: 'xUrl', label: 'X / Twitter' },
  { name: 'githubUrl', label: 'GitHub' }, { name: 'tiktokUrl', label: 'TikTok' },
  { name: 'websiteUrl', label: 'Sitio personal o profesional' },
];

const defaults = (profile: OwnUserProfileDto): OwnProfileFormValues => ({
  phone: profile.phone ?? '', facebookUrl: profile.facebookUrl ?? '', instagramUrl: profile.instagramUrl ?? '',
  linkedinUrl: profile.linkedinUrl ?? '', xUrl: profile.xUrl ?? '', githubUrl: profile.githubUrl ?? '',
  tiktokUrl: profile.tiktokUrl ?? '', websiteUrl: profile.websiteUrl ?? '',
});

interface Props {
  profile: OwnUserProfileDto;
  submitError: string | null;
  successMessage: string | null;
  onSubmit: (values: OwnProfileFormValues) => Promise<boolean>;
  onDirtyChange: (dirty: boolean) => void;
}

const OwnProfileForm: React.FC<Props> = ({ profile, submitError, successMessage, onSubmit, onDirtyChange }) => {
  const { control, handleSubmit, reset, formState: { isDirty, isSubmitting, isValid } } = useForm<OwnProfileFormValues>({
    resolver: zodResolver(ownProfileFormSchema), mode: 'onChange', defaultValues: defaults(profile),
  });
  useEffect(() => reset(defaults(profile)), [profile, reset]);
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  const submit = async (values: OwnProfileFormValues): Promise<void> => {
    if (await onSubmit(values)) reset(values);
  };

  return (
    <form className="own-profile-form" onSubmit={handleSubmit(submit)} noValidate>
      <section className="own-profile-card" aria-labelledby="contact-title">
        <div><h2 id="contact-title">Contacto</h2><p>Esta información es opcional. Usa el código de país en tu celular.</p></div>
        <Controller name="phone" control={control} render={({ field, fieldState }) => (
          <AppInput label="Número de celular" type="tel" inputmode="tel" autocomplete="tel" maxlength={16}
            value={field.value} disabled={isSubmitting} error={fieldState.error?.message}
            onIonInput={event => field.onChange(event.detail.value ?? '')} onIonBlur={field.onBlur} />
        )} />
      </section>
      <section className="own-profile-card own-profile-links" aria-labelledby="links-title">
        <div><h2 id="links-title">Redes y enlaces</h2><p>Todos los enlaces son opcionales y deben comenzar con https://.</p></div>
        {URL_FIELDS.map(item => <Controller key={item.name} name={item.name} control={control} render={({ field, fieldState }) => (
          <AppInput label={item.label} type="url" inputmode="url" maxlength={500} value={field.value}
            disabled={isSubmitting} error={fieldState.error?.message}
            onIonInput={event => field.onChange(event.detail.value ?? '')} onIonBlur={field.onBlur} />
        )} />)}
      </section>
      {submitError && <IonText color="danger" role="alert"><p>{submitError}</p></IonText>}
      {successMessage && <IonText color="success" role="status"><p>{successMessage}</p></IonText>}
      <div className="own-profile-actions">
        <AppButton type="button" fill="outline" disabled={!isDirty || isSubmitting} onClick={() => reset(defaults(profile))}>Cancelar</AppButton>
        <AppButton type="submit" isLoading={isSubmitting} disabled={!isDirty || !isValid || isSubmitting}>Guardar cambios</AppButton>
      </div>
    </form>
  );
};

export default OwnProfileForm;
