/**
 * Challenge-Code Photo Referee Module
 * Code issuance, Levenshtein distance comparison, and scene element validation
 */

const WORDS_POOL = [
  'amber', 'otter', 'falcon', 'cedar', 'glacier', 'summit', 'breeze', 'harbor',
  'copper', 'quarry', 'timber', 'badger', 'meadow', 'sparrow', 'valley', 'canyon',
  'hazel', 'marble', 'willow', 'pebble', 'clover', 'zenith', 'beacon', 'echo'
];

/**
 * Generate 3-word plus digits challenge code (e.g. amber-otter-17)
 */
export function generateChallengeCode(): string {
  const w1 = WORDS_POOL[Math.floor(Math.random() * WORDS_POOL.length)];
  const w2 = WORDS_POOL[Math.floor(Math.random() * WORDS_POOL.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${w1}-${w2}-${num}`;
}

/**
 * Levenshtein Distance pure function
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s1.length][s2.length];
}

export interface PhotoRubric {
  required_scene_elements: string[];
  min_confidence: number;
}

export interface PhotoAnalysisResult {
  code_read: string;
  scene_elements: string[];
  suspicious_signs: string[];
  element_confidences: Record<string, number>;
  confidence: number;
}

export interface PhotoEvaluationOutcome {
  passed: boolean;
  borderline: boolean;
  code_match: boolean;
  code_distance: number;
  missing_elements: string[];
  reasons: string[];
}

/**
 * Server-side deterministic verification of code and elements
 */
export function evaluatePhotoProof(
  expectedCode: string,
  analysis: PhotoAnalysisResult,
  rubric: PhotoRubric
): PhotoEvaluationOutcome {
  const codeDist = levenshteinDistance(expectedCode, analysis.code_read);
  const codeMatch = codeDist <= 1; // Allow 1 typo/OCR glitch

  const minConfidence = rubric.min_confidence || 0.70;
  const missingElements: string[] = [];

  for (const element of rubric.required_scene_elements) {
    const isPresent = analysis.scene_elements.some((el) => el.toLowerCase().includes(element.toLowerCase()));
    const elConfidence = analysis.element_confidences[element] ?? analysis.confidence;
    if (!isPresent || elConfidence < minConfidence) {
      missingElements.push(element);
    }
  }

  const reasons: string[] = [];
  if (!codeMatch) {
    reasons.push(`Challenge code mismatch. Expected '${expectedCode}', got '${analysis.code_read}' (edit distance ${codeDist}).`);
  }

  if (analysis.suspicious_signs && analysis.suspicious_signs.length > 0) {
    reasons.push(`Suspicious signs detected: ${analysis.suspicious_signs.join(', ')}.`);
  }

  if (missingElements.length > 0) {
    reasons.push(`Missing required scene elements: ${missingElements.join(', ')}.`);
  }

  // Verdict logic from table:
  // Photo: code matches, required elements seen, confidence >= 0.7 -> Pass
  // Photo: code matches but scene is weak -> Borderline
  // Photo: code missing or wrong -> Fail
  if (!codeMatch) {
    return {
      passed: false,
      borderline: false,
      code_match: false,
      code_distance: codeDist,
      missing_elements: missingElements,
      reasons,
    };
  }

  if (missingElements.length > 0 || (analysis.suspicious_signs && analysis.suspicious_signs.length > 0)) {
    reasons.push('Code matches, but scene elements or confidence require friend referee review.');
    return {
      passed: false,
      borderline: true,
      code_match: true,
      code_distance: codeDist,
      missing_elements: missingElements,
      reasons,
    };
  }

  reasons.push(`Challenge code verified with confidence ${(analysis.confidence * 100).toFixed(0)}%. All required elements detected.`);
  return {
    passed: true,
    borderline: false,
    code_match: true,
    code_distance: codeDist,
    missing_elements: [],
    reasons,
  };
}

