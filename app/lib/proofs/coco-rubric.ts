/** COCO-SSD labels that Stake can verify locally in a browser. */
export const COCO_RUBRIC_ELEMENTS = [
  'backpack',
  'book',
  'bottle',
  'chair',
  'clock',
  'cup',
  'dining table',
  'keyboard',
  'laptop',
  'mouse',
  'person',
  'potted plant',
  'sports ball',
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
