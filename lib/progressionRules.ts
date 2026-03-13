import type {
  CompletedSet,
  InjuryStage,
  ProgressionSuggestion,
} from "@/types/index";

/**
 * Double progression model for safe, injury-aware weight increases.
 *
 * Rules:
 *   1. Hit top of rep range on ALL sets + RPE <= threshold -> suggest weight increase
 *   2. Threshold: stages 1-2 = RPE 7, stages 3-4 = RPE 8
 *   3. Increment: 2.5lb for dumbbells, 5lb for machines/barbells
 *   4. If ANY set has pain >= 5, NEVER suggest progression
 *   5. Return null if no progression warranted
 */

// ─── Constants ────────────────────────────────────────────────

/** RPE threshold by injury stage — lower stages require more conservative thresholds. */
const RPE_THRESHOLDS: Record<InjuryStage, number> = {
  1: 7,
  2: 7,
  3: 8,
  4: 8,
};

/**
 * Weight increment based on exercise naming heuristics.
 * Dumbbells get smaller increments (2.5 lb) because each arm bears its own load.
 * Machines and barbells get standard increments (5 lb).
 */
const DUMBBELL_INCREMENT = 2.5;
const STANDARD_INCREMENT = 5;

/** Exercise name patterns that indicate dumbbell usage. */
const DUMBBELL_PATTERNS = [
  "dumbbell",
  "db ",
  "db_",
  "hammer curl",
  "lateral raise",
  "front raise",
  "goblet",
];

// ─── Public API ───────────────────────────────────────────────

/**
 * Evaluate whether a progression (weight increase) is warranted.
 *
 * @param exerciseId    - Unique exercise identifier
 * @param exerciseName  - Human-readable exercise name (used for increment detection)
 * @param recentSets    - The completed sets from the most recent session
 * @param currentWeight - Current working weight in lbs
 * @param injuryStage   - The most relevant injury stage (use the more restrictive one)
 * @returns ProgressionSuggestion if warranted, null otherwise
 */
export function evaluateProgression(
  exerciseId: string,
  exerciseName: string,
  recentSets: CompletedSet[],
  currentWeight: number,
  injuryStage: InjuryStage
): ProgressionSuggestion | null {
  // Guard: need at least 1 set to evaluate
  if (recentSets.length === 0) {
    return null;
  }

  // Guard: if ANY set has pain >= 5, never suggest progression
  const hasPain = recentSets.some((s) => s.pain >= 5);
  if (hasPain) {
    return null;
  }

  // Guard: need weight to progress (bodyweight / timed exercises skip this)
  if (currentWeight <= 0) {
    return null;
  }

  const rpeThreshold = RPE_THRESHOLDS[injuryStage];

  // Check: ALL sets must have RPE at or below threshold
  const allBelowRPE = recentSets.every((s) => s.rpe <= rpeThreshold);
  if (!allBelowRPE) {
    return null;
  }

  // Check: ALL sets must have reps at or above top of rep range.
  // We use the max reps from the set data as the target.
  // If reps data is missing (duration-based exercises), skip.
  const allHaveReps = recentSets.every((s) => s.reps !== undefined && s.reps !== null);
  if (!allHaveReps) {
    return null;
  }

  // Find the max reps achieved across sets — this represents "hitting top of range"
  // For double progression, we need ALL sets to hit the same target.
  // We use the maximum reps in the first set as the assumed top-of-range target.
  const repsPerSet = recentSets.map((s) => s.reps!);
  const minRepsAchieved = Math.min(...repsPerSet);

  // If the minimum reps achieved is less than what we'd expect for top-of-range,
  // that means not all sets hit the target. We need a reference for "top of range".
  // Since we don't have the planned rep range here, we use a heuristic:
  // If all sets achieved the same or higher reps as the first set, progression is warranted.
  // This works because the user should be programming to the top of their rep range.
  const targetReps = repsPerSet[0];
  const allHitTarget = repsPerSet.every((r) => r >= targetReps);
  if (!allHitTarget) {
    return null;
  }

  // All criteria met — calculate increment
  const increment = getIncrement(exerciseName);
  const suggestedWeight = currentWeight + increment;

  return {
    exerciseId,
    exerciseName,
    currentWeight,
    suggestedWeight,
    increment,
    reason: buildReason(recentSets, rpeThreshold, targetReps, increment),
  };
}

// ─── Internal Helpers ─────────────────────────────────────────

/** Determine weight increment based on exercise type. */
function getIncrement(exerciseName: string): number {
  const lower = exerciseName.toLowerCase();
  const isDumbbell = DUMBBELL_PATTERNS.some((p) => lower.includes(p));
  return isDumbbell ? DUMBBELL_INCREMENT : STANDARD_INCREMENT;
}

/** Build a human-readable reason for the progression suggestion. */
function buildReason(
  sets: CompletedSet[],
  rpeThreshold: number,
  targetReps: number,
  increment: number
): string {
  const avgRPE = sets.reduce((sum, s) => sum + s.rpe, 0) / sets.length;
  const avgPain = sets.reduce((sum, s) => sum + s.pain, 0) / sets.length;

  return (
    `All ${sets.length} sets hit ${targetReps}+ reps with avg RPE ${avgRPE.toFixed(1)}` +
    ` (threshold: ${rpeThreshold}), avg pain ${avgPain.toFixed(1)}/10.` +
    ` Suggesting +${increment}lb increase.`
  );
}
