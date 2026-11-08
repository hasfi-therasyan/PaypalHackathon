'use client';

export type OcrResult = {
  rawText: string;
  detectedCode: string | null;
  confidence: number;
};

function extractChallengeCode(text: string): string | null {
  const normalized = text.toLowerCase().replace(/[—–_]/g, '-');
  const match = normalized.match(/\b([a-z]{3,})\s*[-\s]\s*([a-z]{3,})\s*[-\s]\s*(\d{1,3})\b/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

/** Free, on-device OCR. No image bytes or text are sent to an external model. */
export async function recognizeChallengeCode(file: File): Promise<OcrResult> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(file);
    return {
      rawText: data.text.trim(),
      detectedCode: extractChallengeCode(data.text),
      confidence: Math.max(0, Math.min(1, data.confidence / 100)),
    };
  } finally {
    await worker.terminate();
  }
}
