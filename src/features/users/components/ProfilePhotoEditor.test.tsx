import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NativePhotoError } from '../../../services/native/camera';
import { ImageProcessingError } from '../../../utils/image-compress';
import ProfilePhotoEditor from './ProfilePhotoEditor';

const mocks = vi.hoisted(() => ({ pickPhoto: vi.fn(), isNative: vi.fn(), fitAvatarImage: vi.fn() }));

vi.mock('@capacitor/core', async () => {
  const actual = await vi.importActual<typeof import('@capacitor/core')>('@capacitor/core');
  return { ...actual, Capacitor: { ...actual.Capacitor, isNativePlatform: mocks.isNative } };
});
vi.mock('../../../services/native/camera', async () => {
  const actual = await vi.importActual<typeof import('../../../services/native/camera')>(
    '../../../services/native/camera',
  );
  return { ...actual, pickPhoto: mocks.pickPhoto };
});

vi.mock('../../../utils/image-compress', async () => {
  const actual = await vi.importActual<typeof import('../../../utils/image-compress')>('../../../utils/image-compress');
  return { ...actual, fitAvatarImage: mocks.fitAvatarImage };
});

// IonActionSheet/IonAlert reales orquestan overlays asíncronos que jsdom no completa; se sustituyen por
// marcado simple que expone los botones y el dato con que Ionic cierra la hoja.
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonActionSheet: ({
      isOpen,
      buttons,
      onDidDismiss,
    }: {
      isOpen: boolean;
      buttons: { text: string; data?: unknown }[];
      onDidDismiss: (event: { detail: { data?: unknown } }) => void;
    }) =>
      isOpen ? (
        <div>
          {buttons.map(button => (
            <button key={button.text} onClick={() => onDidDismiss({ detail: { data: button.data } })}>
              {button.text}
            </button>
          ))}
        </div>
      ) : null,
    IonAlert: ({ isOpen, message }: { isOpen: boolean; message?: string }) =>
      isOpen ? <div role="alert">{message}</div> : null,
  };
});

const renderEditor = (onUpload = vi.fn().mockResolvedValue(undefined)) => {
  render(
    <ProfilePhotoEditor name="Ana Pérez" hasAvatar={false} isBusy={false} onUpload={onUpload} onRemove={vi.fn()} />,
  );
  return onUpload;
};

const openSheet = (): void => {
  act(() => screen.getByText('Elegir fotografía').click());
};

describe('ProfilePhotoEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isNative.mockReturnValue(true);
    mocks.fitAvatarImage.mockImplementation((file: File) => Promise.resolve(file));
    // jsdom no implementa URL.createObjectURL, que el editor usa para la vista previa.
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
  });

  it('ofrece cámara, galería y archivos en español', () => {
    renderEditor();
    openSheet();

    expect(screen.getByText('Tomar foto')).toBeInTheDocument();
    expect(screen.getByText('Elegir de la galería')).toBeInTheDocument();
    expect(screen.getByText('Elegir un archivo')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('sube la foto tomada con la cámara por el flujo existente', async () => {
    mocks.pickPhoto.mockResolvedValue(new File(['x'], 'perfil.jpg', { type: 'image/jpeg' }));
    const onUpload = renderEditor();
    openSheet();

    await act(async () => screen.getByText('Tomar foto').click());

    expect(mocks.pickPhoto).toHaveBeenCalledWith('camera');
    await waitFor(() =>
      expect(onUpload).toHaveBeenCalledWith({ imageBase64: expect.any(String), mimeType: 'image/jpeg' }),
    );
  });

  it('cancelar la cámara no muestra error ni sube nada', async () => {
    mocks.pickPhoto.mockResolvedValue(null);
    const onUpload = renderEditor();
    openSheet();

    await act(async () => screen.getByText('Elegir de la galería').click());

    expect(mocks.pickPhoto).toHaveBeenCalledWith('gallery');
    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('permiso denegado muestra un mensaje en español y no sube nada', async () => {
    mocks.pickPhoto.mockRejectedValue(new NativePhotoError('permission-denied'));
    const onUpload = renderEditor();
    openSheet();

    await act(async () => screen.getByText('Tomar foto').click());

    expect(await screen.findByRole('alert')).toHaveTextContent('permiso');
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('reduce la imagen antes de subirla cuando excede 2 MiB', async () => {
    const big = new File([new Uint8Array(5 * 1024 * 1024)], 'grande.jpg', { type: 'image/jpeg' });
    const reduced = new File([new Uint8Array(800_000)], 'perfil.jpg', { type: 'image/jpeg' });
    mocks.pickPhoto.mockResolvedValue(big);
    mocks.fitAvatarImage.mockResolvedValue(reduced);
    const onUpload = renderEditor();
    openSheet();

    await act(async () => screen.getByText('Tomar foto').click());

    expect(mocks.fitAvatarImage).toHaveBeenCalledWith(big);
    await waitFor(() => expect(onUpload).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('si la imagen no se puede reducir muestra el motivo y no sube nada', async () => {
    mocks.pickPhoto.mockResolvedValue(new File(['x'], 'raro.heic', { type: 'image/heic' }));
    mocks.fitAvatarImage.mockRejectedValue(new ImageProcessingError('undecodable'));
    const onUpload = renderEditor();
    openSheet();

    await act(async () => screen.getByText('Tomar foto').click());

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo leer la imagen');
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('en navegador no hay hoja: abre directamente el selector de archivos', () => {
    mocks.isNative.mockReturnValue(false);
    renderEditor();

    openSheet();

    expect(screen.queryByText('Tomar foto')).not.toBeInTheDocument();
  });
});
