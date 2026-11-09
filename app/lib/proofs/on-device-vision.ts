export const ON_DEVICE_VISION_MODEL = 'tesseract.js/eng';

export type OnDeviceVisionFinding = {
  provider: 'tesseract.js';
  model: string;
  ran_locally: true;
  analyzed_at: string;
  scene_elements: string[];
  element_confidences: Record<string, number>;
  confidence: number;
};
