const MAX_DIMENSION = 1920;
const TARGET_MIME = 'image/jpeg';

export type CompressedImage = {
  file: File;
  originalBytes: number;
};

/**
 * Reduces the image before it crosses the network boundary. The server repeats
 * validation and compression as a defence-in-depth guarantee.
 */
export async function compressProofImageInBrowser(input: File): Promise<CompressedImage> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(input.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }

  const bitmap = await createImageBitmap(input);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser cannot prepare this image.');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, TARGET_MIME, 0.78));
  if (!blob) throw new Error('Could not compress the selected photo.');
  return {
    file: new File([blob], input.name.replace(/\.[^.]+$/, '') + '.jpg', { type: TARGET_MIME }),
    originalBytes: input.size,
  };
}
