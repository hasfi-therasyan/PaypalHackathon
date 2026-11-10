/** COCO-SSD labels that Stake can verify locally in a browser. */
export const COCO_RUBRIC_ELEMENTS = [
  'person',
  'bicycle',
  'car',
  'motorcycle',
  'airplane',
  'bus',
  'train',
  'truck',
  'boat',
  'traffic light',
  'fire hydrant',
  'stop sign',
  'parking meter',
  'bench',
  'bird',
  'cat',
  'dog',
  'horse',
  'sheep',
  'cow',
  'elephant',
  'bear',
  'zebra',
  'giraffe',
  'backpack',
  'umbrella',
  'handbag',
  'tie',
  'suitcase',
  'frisbee',
  'skis',
  'snowboard',
  'sports ball',
  'kite',
  'baseball bat',
  'baseball glove',
  'skateboard',
  'surfboard',
  'tennis racket',
  'book',
  'bottle',
  'chair',
  'clock',
  'cup',
  'dining table',
  'wine glass',
  'fork',
  'knife',
  'spoon',
  'bowl',
  'banana',
  'apple',
  'sandwich',
  'orange',
  'broccoli',
  'carrot',
  'hot dog',
  'pizza',
  'donut',
  'cake',
  'couch',
  'potted plant',
  'bed',
  'toilet',
  'tv',
  'keyboard',
  'laptop',
  'mouse',
  'remote',
  'cell phone',
  'microwave',
  'oven',
  'toaster',
  'sink',
  'refrigerator',
  'vase',
  'scissors',
  'teddy bear',
  'hair drier',
  'toothbrush',
] as const;

export type CocoRubricElement = (typeof COCO_RUBRIC_ELEMENTS)[number];

export function isCocoRubricElement(value: string): value is CocoRubricElement {
  return (COCO_RUBRIC_ELEMENTS as readonly string[]).includes(value.trim().toLowerCase());
}

export function normalizeCocoRubricElements(values: unknown): CocoRubricElement[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(
    values
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim().toLowerCase())
      .filter(isCocoRubricElement)
  ));
}
