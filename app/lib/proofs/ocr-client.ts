'use client';

export type OcrResult = {
  rawText: string;
  detectedCode: string | null;
  /** Confidence belongs to a detected challenge-code pattern, never arbitrary text in the photo. */
  confidence: number;
  variantsTried: number;
};

const MAX_OCR_DIMENSION = 2560;
const CHALLENGE_CODE_CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ';

function extractChallengeCode(text: string): string | null {
  const normalized = text.toLowerCase().replace(/[—–_~]/g, '-');
  const match = normalized.match(/\b([a-z]{3,})\s*[-\s]\s*([a-z]{3,})\s*[-\s]\s*(\d{1,3})\b/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/**
 * Produces legible alternatives for the same image. The original is retained
 * because aggressive thresholding can harm photos with a dark challenge card.
 */
async function createOcrVariants(input: File): Promise<Blob[]> {
  if (typeof createImageBitmap !== 'function') return [input];

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(input);
    const largestSide = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(2, MAX_OCR_DIMENSION / largestSide);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = width;
    sourceCanvas.height = height;
    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
    if (!sourceContext) return [input];
    sourceContext.imageSmoothingEnabled = true;
    sourceContext.imageSmoothingQuality = 'high';
    sourceContext.drawImage(bitmap, 0, 0, width, height);

    const contrastCanvas = document.createElement('canvas');
    contrastCanvas.width = width;
    contrastCanvas.height = height;
    const contrastContext = contrastCanvas.getContext('2d', { willReadFrequently: true });
    if (!contrastContext) return [input];

    const pixels = sourceContext.getImageData(0, 0, width, height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const luminance = pixels.data[index] * 0.299 + pixels.data[index + 1] * 0.587 + pixels.data[index + 2] * 0.114;
      const enhanced = Math.max(0, Math.min(255, (luminance - 128) * 1.9 + 128));
      pixels.data[index] = enhanced;
      pixels.data[index + 1] = enhanced;
      pixels.data[index + 2] = enhanced;
    }
    contrastContext.putImageData(pixels, 0, 0);

    const [upscaled, highContrast] = await Promise.all([
      canvasToBlob(sourceCanvas),
      canvasToBlob(contrastCanvas),
    ]);
    return [input, upscaled, highContrast].filter((variant): variant is Blob => Boolean(variant));
  } catch {
    return [input];
  } finally {
    bitmap?.close();
  }
}

/** Free, on-device OCR. No image bytes or text are sent to an external model. */
export async function recognizeChallengeCode(file: File): Promise<OcrResult> {
  const variants = await createOcrVariants(file);
  const { createWorker, PSM } = await import('tesseract.js');
  const worker = await createWorker('eng');

  try {
    const candidates: Array<{ rawText: string; detectedCode: string | null; confidence: number }> = [];

    for (let index = 0; index < variants.length; index += 1) {
      const variant = variants[index];
      await worker.setParameters({
        tessedit_char_whitelist: CHALLENGE_CODE_CHARACTERS,
        tessedit_pageseg_mode: index === 0 ? PSM.SPARSE_TEXT : PSM.SINGLE_LINE,
        preserve_interword_spaces: '1',
        user_defined_dpi: '300',
      });
      const { data } = await worker.recognize(variant);
      candidates.push({
        rawText: data.text.trim(),
        detectedCode: extractChallengeCode(data.text),
        confidence: Math.max(0, Math.min(1, data.confidence / 100)),
      });
    }

    const codeCandidates = candidates.filter((candidate) => candidate.detectedCode);
    const best = (codeCandidates.length ? codeCandidates : candidates)
      .sort((left, right) => right.confidence - left.confidence)[0];

    return {
      rawText: best?.rawText || '',
      detectedCode: best?.detectedCode || null,
      confidence: best?.detectedCode ? best.confidence : 0,
      variantsTried: variants.length,
    };
  } finally {
    await worker.terminate();
  }
}
