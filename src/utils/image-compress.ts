export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Lado mayor (px) y calidad JPEG que se prueban, de mejor a peor, hasta que la imagen cabe en el límite.
const SIDES = [1600, 1024, 640];
const QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45];

export type ImageFailure = 'not-an-image' | 'undecodable' | 'too-large';

const MESSAGES: Record<ImageFailure, string> = {
  'not-an-image': 'Selecciona una imagen JPEG, PNG o WebP.',
  undecodable: 'No se pudo leer la imagen. Elige otra fotografía en JPEG, PNG o WebP.',
  'too-large': 'No se pudo reducir la fotografía por debajo de 2 MiB. Elige otra imagen.',
};

export class ImageProcessingError extends Error {
  public constructor(public readonly failure: ImageFailure) {
    super(MESSAGES[failure]);
    this.name = 'ImageProcessingError';
  }
}

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> =>
  new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));

const renderJpeg = async (bitmap: ImageBitmap, side: number, quality: number): Promise<Blob | null> => {
  const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return null;
  // JPEG no tiene transparencia: sin fondo, un PNG/WebP transparente quedaría negro.
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvasToBlob(canvas, quality);
};

// Deja la imagen lista para subir como avatar. Una imagen que ya cumple (tipo permitido y ≤ 2 MiB) se devuelve
// intacta para no perder calidad ni transparencia; el resto se decodifica, se redimensiona y se recodifica a JPEG.
export const fitAvatarImage = async (file: File): Promise<File> => {
  if (AVATAR_ALLOWED_TYPES.includes(file.type) && file.size <= AVATAR_MAX_BYTES) return file;
  if (!file.type.startsWith('image/')) throw new ImageProcessingError('not-an-image');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ImageProcessingError('undecodable');
  }

  try {
    for (const side of SIDES) {
      for (const quality of QUALITIES) {
        const blob = await renderJpeg(bitmap, side, quality);
        if (blob && blob.size <= AVATAR_MAX_BYTES) {
          return new File([blob], 'perfil.jpg', { type: 'image/jpeg' });
        }
      }
    }
  } finally {
    bitmap.close();
  }
  throw new ImageProcessingError('too-large');
};
