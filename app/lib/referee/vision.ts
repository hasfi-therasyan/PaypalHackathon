import { z } from 'zod';
import { supabase } from '@/app/lib/db';
import type { PhotoAnalysisResult } from './photo';

const VisionResponse = z.object({
  code_read: z.string(),
  scene_elements: z.array(z.string()).max(30),
  suspicious_signs: z.array(z.string()).max(20),
  element_confidences: z.record(z.number().min(0).max(1)),
  confidence: z.number().min(0).max(1),
});

/**
 * The model receives a short-lived signed Storage URL, never a public bucket.
 * VISION_REFEREE_URL must return the JSON schema documented by VisionResponse.
 */
export async function analyzeProofPhoto(input: {
  storagePath: string;
  expectedCode: string;
  requiredSceneElements: string[];
}): Promise<PhotoAnalysisResult> {
  const endpoint = process.env.VISION_REFEREE_URL;
  if (!endpoint) {
    return {
      code_read: '',
      scene_elements: [],
      suspicious_signs: ['Vision service is not configured; friend review is required.'],
      element_confidences: {},
      confidence: 0,
    };
  }

  const { data, error } = await supabase.storage.from('proofs').createSignedUrl(input.storagePath, 10 * 60);
  if (error || !data?.signedUrl) throw new Error('Could not create a secure URL for vision verification.');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.VISION_REFEREE_API_KEY ? { Authorization: `Bearer ${process.env.VISION_REFEREE_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      image_url: data.signedUrl,
      challenge_code: input.expectedCode,
      required_scene_elements: input.requiredSceneElements,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Vision service rejected proof (${response.status}).`);
  return VisionResponse.parse(await response.json()) as PhotoAnalysisResult;
}
