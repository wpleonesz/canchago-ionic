import { Camera, EncodingType, MediaTypeSelection, type MediaResult } from '@capacitor/camera';

export type PhotoSource = 'camera' | 'gallery';
export type PhotoFailure = 'permission-denied' | 'no-camera' | 'unavailable';

export class NativePhotoError extends Error {
  public constructor(public readonly failure: PhotoFailure) {
    super(PHOTO_MESSAGES[failure]);
    this.name = 'NativePhotoError';
  }
}

export const PHOTO_MESSAGES: Record<PhotoFailure, string> = {
  'permission-denied':
    'CanchaGO no tiene permiso para usar la cámara o las fotos. Actívalo en los ajustes del dispositivo o elige un archivo.',
  'no-camera': 'Este dispositivo no tiene una cámara disponible. Elige una imagen de la galería o de tus archivos.',
  unavailable: 'No se pudo obtener la fotografía. Inténtalo de nuevo o elige un archivo.',
};

// Códigos estructurados del plugin (Android/iOS, @capacitor/camera ≥ 8.1): cancelar no es un error.
const CANCELLED = ['OS-PLUG-CAMR-0006', 'OS-PLUG-CAMR-0020'];
const FAILURES: Record<string, PhotoFailure> = {
  'OS-PLUG-CAMR-0003': 'permission-denied',
  'OS-PLUG-CAMR-0005': 'permission-denied',
  'OS-PLUG-CAMR-0007': 'no-camera',
};

// Se reduce en el dispositivo (lado mayor 1024 px, JPEG al 80 %) para que una foto de cámara de varios MiB
// quepa en el límite de 2 MiB del avatar sin que el usuario tenga que hacer nada.
const IMAGE_OPTIONS = { quality: 80, targetWidth: 1024, targetHeight: 1024, correctOrientation: true };

const errorCode = (error: unknown): string | undefined =>
  typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
    ? error.code
    : undefined;

const toFile = async (result: MediaResult | undefined): Promise<File> => {
  if (!result?.webPath) throw new NativePhotoError('unavailable');
  const blob = await (await fetch(result.webPath)).blob();
  return new File([blob], 'perfil.jpg', { type: blob.type || 'image/jpeg' });
};

// Devuelve el archivo elegido, o null si el usuario cancela. Devolver un File permite reutilizar la misma
// validación (tipo, tamaño) y subida que el selector de archivos.
export const pickPhoto = async (source: PhotoSource): Promise<File | null> => {
  try {
    if (source === 'camera') {
      return await toFile(await Camera.takePhoto({ ...IMAGE_OPTIONS, encodingType: EncodingType.JPEG }));
    }
    const { results } = await Camera.chooseFromGallery({
      ...IMAGE_OPTIONS,
      mediaType: MediaTypeSelection.Photo,
      allowMultipleSelection: false,
    });
    return await toFile(results[0]);
  } catch (error) {
    const code = errorCode(error);
    if (code && CANCELLED.includes(code)) return null;
    if (error instanceof NativePhotoError) throw error;
    throw new NativePhotoError((code && FAILURES[code]) || 'unavailable');
  }
};
