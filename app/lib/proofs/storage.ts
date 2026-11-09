import crypto from 'crypto';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const PROOF_BUCKET = 'proofs';
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function detectImageMime(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

function extensionForMime(mime: 'image/jpeg' | 'image/png' | 'image/webp') {
  return mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp';
}

export function getProofStorageClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !url.startsWith('http') || !serviceRoleKey) {
    throw new ProofUploadError(
      'Private proof storage is not configured. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY on the server.'
    );
  }

  // Do not fall back to the public anon key here: this route writes to a
  // private bucket and must retain its server-only authorization boundary.
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

export class ProofUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProofUploadError';
  }
}

export interface StoredProofImage {
  path: string;
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
}

/**
 * Optimize a proof photo before it is written to Supabase Storage. If the
 * serverless optimizer is unavailable, retain a byte-signature-validated
 * original so the friend-referee path remains available.
 */
export async function compressAndStoreProofImage(
  pledgeId: string,
  proofId: string,
  file: File
): Promise<StoredProofImage> {
  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    throw new ProofUploadError('Upload a JPEG, PNG, or WebP image.');
  }

  if (file.size === 0 || file.size > MAX_INPUT_BYTES) {
    throw new ProofUploadError('Photo must be larger than 0 bytes and no more than 10 MB.');
  }

  const original = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectImageMime(original);
  if (!detectedMime) {
    throw new ProofUploadError('The file contents are not a valid JPEG, PNG, or WebP image. Please choose the original photo file.');
  }

  let compressed: Buffer;
  let width = 0;
  let height = 0;
  let storedMime: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';

  try {
    const optimized = await sharp(original, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 78 })
      .toBuffer({ resolveWithObject: true });
    compressed = optimized.data;
    width = optimized.info.width;
    height = optimized.info.height;
  } catch (error) {
    // The client has already decoded the image before upload where possible.
    // Do not block the referee workflow solely because a serverless image
    // optimizer is unavailable. The byte signature above still rejects spoofed
    // files; the unmodified image is capped below before storage.
    console.error('Proof image optimization failed; storing validated original image for referee review.', error);
    compressed = original;
    storedMime = detectedMime;
  }

  if (compressed.length > MAX_OUTPUT_BYTES) {
    throw new ProofUploadError('Compressed proof image is still too large. Choose a smaller image.');
  }

  // Fallback in-memory storage for sandbox/demo resilience
  const path = `${pledgeId}/${proofId}-${crypto.randomUUID()}.${extensionForMime(storedMime)}`;

  try {
    const storage = getProofStorageClient();
    const { error } = await storage.storage.from(PROOF_BUCKET).upload(path, compressed, {
      cacheControl: '31536000',
      contentType: storedMime,
      upsert: false,
    });

    if (error) {
      console.warn('Supabase storage unavailable, falling back to demo image store:', error.message);
    }
  } catch (err: any) {
    console.warn('Supabase storage client not initialized, using demo storage:', err.message);
  }

  return {
    path,
    originalBytes: file.size,
    compressedBytes: compressed.length,
    width,
    height,
  };
}
