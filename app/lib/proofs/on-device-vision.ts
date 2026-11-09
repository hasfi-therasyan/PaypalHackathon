export const ON_DEVICE_VISION_MODEL = 'Xenova/clip-vit-base-patch32';

export type OnDeviceVisionFinding = {
  provider: 'transformers.js';
  model: string;
  ran_locally: true;
  analyzed_at: string;
  scene_elements: string[];
  element_confidences: Record<string, number>;
  confidence: number;
};
