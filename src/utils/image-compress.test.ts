import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AVATAR_MAX_BYTES, fitAvatarImage, ImageProcessingError } from './image-compress';

const bitmap = { width: 4000, height: 3000, close: vi.fn() };
const createImageBitmapMock = vi.fn();
const drawImage = vi.fn();
const canvasSizes: { width: number; height: number }[] = [];

// jsdom no implementa canvas: se simula el contexto y toBlob, que devuelve un tamaño según la calidad pedida.
const stubCanvas = (sizeFor: (quality: number, canvas: { width: number; height: number }) => number | null): void => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillStyle: '',
    fillRect: vi.fn(),
    drawImage,
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
    _type?: string,
    quality?: number,
  ) {
    canvasSizes.push({ width: this.width, height: this.height });
    const size = sizeFor(quality ?? 1, this);
    callback(size === null ? null : new Blob([new Uint8Array(size)], { type: 'image/jpeg' }));
  });
};

const fileOf = (size: number, type: string): File => new File([new Uint8Array(size)], 'foto', { type });

describe('fitAvatarImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canvasSizes.length = 0;
    createImageBitmapMock.mockResolvedValue(bitmap);
    vi.stubGlobal('createImageBitmap', createImageBitmapMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('devuelve intacta una imagen que ya cumple, sin decodificarla', async () => {
    const file = fileOf(500_000, 'image/png');
    await expect(fitAvatarImage(file)).resolves.toBe(file);
    expect(createImageBitmapMock).not.toHaveBeenCalled();
  });

  it('reduce una foto de más de 2 MiB a JPEG dentro del límite', async () => {
    stubCanvas(quality => (quality >= 0.85 ? 3_000_000 : 900_000));

    const result = await fitAvatarImage(fileOf(6_000_000, 'image/jpeg'));

    expect(result.type).toBe('image/jpeg');
    expect(result.size).toBeLessThanOrEqual(AVATAR_MAX_BYTES);
    expect(createImageBitmapMock).toHaveBeenCalledWith(expect.any(File), { imageOrientation: 'from-image' });
    expect(canvasSizes[0]).toEqual({ width: 1600, height: 1200 });
    expect(bitmap.close).toHaveBeenCalled();
  });

  it('reduce también la resolución cuando bajar la calidad no basta', async () => {
    stubCanvas((_quality, canvas) => (canvas.width > 1024 ? 5_000_000 : 400_000));

    const result = await fitAvatarImage(fileOf(9_000_000, 'image/jpeg'));

    expect(result.size).toBeLessThanOrEqual(AVATAR_MAX_BYTES);
    expect(canvasSizes.at(-1)?.width).toBe(1024);
  });

  it('convierte a JPEG otro formato de imagen decodificable aunque pese poco', async () => {
    stubCanvas(() => 200_000);
    const result = await fitAvatarImage(fileOf(300_000, 'image/gif'));
    expect(result.type).toBe('image/jpeg');
  });

  it('rechaza lo que no es una imagen', async () => {
    await expect(fitAvatarImage(fileOf(100, 'application/pdf'))).rejects.toMatchObject({ failure: 'not-an-image' });
  });

  it('falla con un error claro si no se puede decodificar', async () => {
    createImageBitmapMock.mockRejectedValue(new Error('decode'));
    const error = await fitAvatarImage(fileOf(3_000_000, 'image/heic')).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ImageProcessingError);
    expect(error).toMatchObject({ failure: 'undecodable' });
  });

  it('falla si ni con la menor calidad y tamaño cabe en el límite', async () => {
    stubCanvas(() => 5_000_000);
    await expect(fitAvatarImage(fileOf(9_000_000, 'image/jpeg'))).rejects.toMatchObject({ failure: 'too-large' });
    expect(bitmap.close).toHaveBeenCalled();
  });
});
