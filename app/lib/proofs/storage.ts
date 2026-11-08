import crypto from 'crypto';
import sharp, { type OutputInfo } from 'sharp';
import { createClient } from '@supabase/supabase-js';

const PROOF_BUCKET = 'proofs';
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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
 * Compress a proof photo before it is written to Supabase Storage.
 * The original image is kept in memory only and is never uploaded.
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
  let compressed: Buffer;
  let info: OutputInfo;

  try {
    ({ data: compressed, info } = await sharp(original, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer({ resolveWithObject: true }));
  } catch {
    throw new ProofUploadError('The selected file is not a valid supported image.');
  }

  if (compressed.length > MAX_OUTPUT_BYTES) {
    throw new ProofUploadError('Compressed proof image is still too large. Choose a smaller image.');
  }

  // UUID makes the storage object non-guessable even if a proof is re-submitted.
  const path = `${pledgeId}/${proofId}-${crypto.randomUUID()}.jpg`;
  const storage = getProofStorageClient();
  const { error } = await storage.storage.from(PROOF_BUCKET).upload(path, compressed, {
    cacheControl: '31536000',
    contentType: 'image/jpeg',
    upsert: false,
  });

  if (error) {
    console.error('Supabase proof upload failed', {
      bucket: PROOF_BUCKET,
      message: error.message,
      statusCode: error.statusCode,
    });

    const message = error.message.toLowerCase();
    if (message.includes('bucket') && (message.includes('not found') || message.includes('does not exist'))) {
      throw new ProofUploadError(
        "Proof storage hasn't been initialized. Apply supabase/migrations/20261108_proof_storage.sql to create the private 'proofs' bucket."
      );
    }
    if (message.includes('row-level security') || message.includes('permission') || message.includes('unauthorized')) {
      throw new ProofUploadError(
        'Proof storage rejected this upload. Confirm SUPABASE_SERVICE_ROLE_KEY is the server-side service-role secret, then redeploy.'
      );
    }
    throw new ProofUploadError('Could not save the compressed proof image. Check the server logs for the Supabase Storage error and try again.');
  }

  return {
    path,
    originalBytes: file.size,
    compressedBytes: compressed.length,
    width: info.width,
    height: info.height,
  };
}
