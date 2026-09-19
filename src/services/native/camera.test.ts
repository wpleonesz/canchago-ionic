import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NativePhotoError, pickPhoto } from './camera';

const camera = vi.hoisted(() => ({ takePhoto: vi.fn(), chooseFromGallery: vi.fn() }));
vi.mock('@capacitor/camera', () => ({
  Camera: camera,
  EncodingType: { JPEG: 0 },
  MediaTypeSelection: { Photo: 0 },
}));

const fetchMock = vi.fn();

describe('pickPhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue({ blob: () => Promise.resolve(new Blob(['x'], { type: 'image/jpeg' })) });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('toma una foto con la cámara reducida y la devuelve como File JPEG', async () => {
    camera.takePhoto.mockResolvedValue({ webPath: 'capacitor://localhost/_capacitor_file_/foto.jpg' });

    const file = await pickPhoto('camera');

    expect(camera.takePhoto).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 80, targetWidth: 1024, targetHeight: 1024, correctOrientation: true }),
    );
    expect(file).toBeInstanceOf(File);
    expect(file?.type).toBe('image/jpeg');
    expect(fetchMock).toHaveBeenCalledWith('capacitor://localhost/_capacitor_file_/foto.jpg');
  });

  it('elige una sola foto de la galería', async () => {
    camera.chooseFromGallery.mockResolvedValue({ results: [{ webPath: 'file:///galeria.png' }] });

    const file = await pickPhoto('gallery');

    expect(camera.chooseFromGallery).toHaveBeenCalledWith(expect.objectContaining({ allowMultipleSelection: false }));
    expect(file).toBeInstanceOf(File);
  });

  it('cancelar no es un error', async () => {
    camera.takePhoto.mockRejectedValue({ code: 'OS-PLUG-CAMR-0006' });
    await expect(pickPhoto('camera')).resolves.toBeNull();

    camera.chooseFromGallery.mockRejectedValue({ code: 'OS-PLUG-CAMR-0020' });
    await expect(pickPhoto('gallery')).resolves.toBeNull();
  });

  it('clasifica permiso denegado, sin cámara y fallos desconocidos con mensajes en español', async () => {
    camera.takePhoto.mockRejectedValueOnce({ code: 'OS-PLUG-CAMR-0003' });
    await expect(pickPhoto('camera')).rejects.toMatchObject({ failure: 'permission-denied' });

    camera.takePhoto.mockRejectedValueOnce({ code: 'OS-PLUG-CAMR-0007' });
    await expect(pickPhoto('camera')).rejects.toMatchObject({ failure: 'no-camera' });

    camera.takePhoto.mockRejectedValueOnce(new Error('boom'));
    const error = await pickPhoto('camera').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(NativePhotoError);
    expect((error as NativePhotoError).failure).toBe('unavailable');
    expect((error as NativePhotoError).message).toMatch(/fotografía/);
  });

  it('un resultado sin ruta es un fallo, no una foto vacía', async () => {
    camera.takePhoto.mockResolvedValue({});
    await expect(pickPhoto('camera')).rejects.toMatchObject({ failure: 'unavailable' });
  });
});
