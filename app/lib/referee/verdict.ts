/**
 * Stake Verdict Engine
 * Evaluates rules first, structured findings second, friend override has final say
 */

export interface VerdictDecision {
  outcome: 'pass' | 'borderline' | 'fail';
  source: 'rules' | 'ai' | 'friend';
  reasoning: string;
  nextStep: 'VOID_HOLD' | 'OPEN_APPEAL' | 'CAPTURE_HOLD';
}

/**
 * Compute the system verdict based on the build guide verdict table
 */
export function determineVerdict(
  goalType: 'github' | 'photo',
  evaluation: {
    passed: boolean;
    borderline?: boolean;
    reasons: string[];
    aiFlaggedPadding?: boolean;
  }
): VerdictDecision {
  if (goalType === 'github') {
    if (evaluation.passed && !evaluation.aiFlaggedPadding) {
      return {
        outcome: 'pass',
        source: 'rules',
        reasoning: `GitHub criteria fully satisfied without padding. Commits verified.`,
        nextStep: 'VOID_HOLD',
      };
    }
    if (evaluation.passed && evaluation.aiFlaggedPadding) {
      return {
        outcome: 'borderline',
        source: 'ai',
        reasoning: `GitHub commit thresholds met, but AI referee flagged suspicious commit patterns or whitespace padding. Forwarding to friend referee for decision.`,
        nextStep: 'OPEN_APPEAL',
      };
    }
    return {
      outcome: 'fail',
      source: 'rules',
      reasoning: `GitHub activity did not satisfy the locked rubric: ${evaluation.reasons.join(' ')}`,
      nextStep: 'OPEN_APPEAL',
    };
  }

  // Photo goal type
  if (evaluation.passed) {
    return {
      outcome: 'pass',
      source: 'rules',
      reasoning: `Challenge code confirmed and all required scene elements verified.`,
      nextStep: 'VOID_HOLD',
    };
  }

  if (evaluation.borderline) {
    return {
      outcome: 'borderline',
      source: 'rules',
      reasoning: `Challenge code matched, but scene elements or confidence are borderline. Referred to friend referee.`,
      nextStep: 'OPEN_APPEAL',
    };
  }

  return {
    outcome: 'fail',
    source: 'rules',
    reasoning: `Photo proof failed verification: ${evaluation.reasons.join(' ')}`,
    nextStep: 'OPEN_APPEAL',
  };
}

/**
 * Friend referee appeal override
 */
export function applyFriendDecision(approved: boolean, note: string): VerdictDecision {
  if (approved) {
    return {
      outcome: 'pass',
      source: 'friend',
      reasoning: `Friend referee approved the appeal. Note: "${note}"`,
      nextStep: 'VOID_HOLD',
    };
  }
  return {
    outcome: 'fail',
    source: 'friend',
    reasoning: `Friend referee denied the appeal. Note: "${note}"`,
    nextStep: 'CAPTURE_HOLD',
  };
}
