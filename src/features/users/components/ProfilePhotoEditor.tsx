import { useEffect, useRef, useState } from 'react';
import AppAvatar from '../../../components/common/AppAvatar';
import AppButton from '../../../components/common/AppButton';
import type { UpdateOwnAvatarRequest } from '../../../types/api/users';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'] as const;

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
  reader.onload = () => {
    const result = reader.result;
    if (typeof result !== 'string' || !result.includes(',')) return reject(new Error('No se pudo leer la imagen.'));
    resolve(result.slice(result.indexOf(',') + 1));
  };
  reader.readAsDataURL(file);
});

interface Props {
  name: string;
  avatarUrl?: string | null;
  hasAvatar: boolean;
  isBusy: boolean;
  onUpload: (body: UpdateOwnAvatarRequest) => Promise<void>;
  onRemove: () => Promise<void>;
}

const ProfilePhotoEditor: React.FC<Props> = ({ name, avatarUrl, hasAvatar, isBusy, onUpload, onRemove }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const select = async (file?: File): Promise<void> => {
    setError(null);
    if (!file) return;
    if (!ALLOWED.includes(file.type as (typeof ALLOWED)[number])) return setError('Selecciona una imagen JPEG, PNG o WebP.');
    if (file.size > MAX_BYTES) return setError('La fotografía no puede superar 2 MiB.');
    const localUrl = URL.createObjectURL(file);
    setPreview(previous => { if (previous) URL.revokeObjectURL(previous); return localUrl; });
    try {
      await onUpload({ imageBase64: await toBase64(file), mimeType: file.type as UpdateOwnAvatarRequest['mimeType'] });
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo actualizar la fotografía.');
    }
  };

  return (
    <section className="own-profile-card profile-photo" aria-labelledby="photo-title">
      <AppAvatar name={name} src={preview ?? avatarUrl} className="profile-photo__avatar" />
      <div><h2 id="photo-title">Fotografía de perfil</h2><p>JPEG, PNG o WebP. Máximo 2 MiB.</p>
        <input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp"
          onChange={event => void select(event.target.files?.[0])} disabled={isBusy} />
        <div className="profile-photo__actions">
          <AppButton type="button" fill="outline" disabled={isBusy} onClick={() => inputRef.current?.click()}>{hasAvatar ? 'Reemplazar' : 'Elegir fotografía'}</AppButton>
          {hasAvatar && <AppButton type="button" color="danger" fill="clear" disabled={isBusy} onClick={() => void onRemove()}>Eliminar</AppButton>}
        </div>
        {error && <p className="profile-photo__error" role="alert">{error}</p>}
      </div>
    </section>
  );
};

export default ProfilePhotoEditor;
