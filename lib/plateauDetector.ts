import type {
  InjuryContext,
  WorkoutAnalysis,
  ExerciseProgressionHistory,
  PlateauSignal,
  PlateauSignalType,
  PlateauAdaptation,
  PlateauAdaptationAction,
} from "@/types/index";
import { evaluateExerciseSafety } from "@/lib/injuryEngine";
import { exercisePool } from "@/data/exercisePool";

// ─── Constants ───────────────────────────────────────────────

/** Minimum number of history entries required to detect a plateau. */
const MIN_ENTRIES = 3;

// ─── Plateau Detection ──────────────────────────────────────

/**
 * Analyze workout history and progression data to detect plateau signals.
 *
 * Detection rules:
 * - WEIGHT_STALL: Same weight for 3+ consecutive entries with RPE not decreasing.
 * - REP_STALL: Same bestReps for 3+ entries with no weight increase.
 * - RPE_CEILING: Average RPE > 8.5 for 3+ consecutive entries.
 * - VOLUME_FLAT: Muscle has 3+ sessions with high RPE but no volume growth.
 * - EXERCISE_STALENESS: Exercise appears in >= 75% of sessions in the window.
 *
 * @param analysis - Aggregated workout data for the analysis window.
 * @param progressionHistory - Per-exercise progression entries sorted by date.
 * @param windowDays - Number of days the analysis window covers (default 28).
 * @returns Array of detected plateau signals, may be empty.
 */
export function detectPlateaus(
  analysis: WorkoutAnalysis,
  progressionHistory: ExerciseProgressionHistory[],
  windowDays: number = 28,
): PlateauSignal[] {
  const signals: PlateauSignal[] = [];

  for (const history of progressionHistory) {
    if (history.entries.length < MIN_ENTRIES) continue;

    const tail = history.entries.slice(-Math.max(MIN_ENTRIES, history.entries.length));

    // --- WEIGHT_STALL ---
    detectWeightStall(tail, history, signals);

    // --- REP_STALL ---
    detectRepStall(tail, history, signals);

    // --- RPE_CEILING ---
    detectRpeCeiling(tail, history, signals);
  }

  // --- VOLUME_FLAT ---
  detectVolumeFlat(analysis, signals);

  // --- EXERCISE_STALENESS ---
  detectExerciseStaleness(analysis, signals);

  return signals;
}

// ─── Per-Exercise Signal Helpers ─────────────────────────────

function severityFromCount(count: number): "mild" | "moderate" | "strong" {
  if (count >= 5) return "strong";
  if (count >= 4) return "moderate";
  return "mild";
}

function detectWeightStall(
  entries: ExerciseProgressionHistory["entries"],
  history: ExerciseProgressionHistory,
  signals: PlateauSignal[],
): void {
  // Walk backwards from the end to find the longest run of identical weight
  const lastWeight = entries[entries.length - 1].weightLbs;
  let streakCount = 1;

  for (let i = entries.length - 2; i >= 0; i--) {
    if (entries[i].weightLbs === lastWeight) {
      streakCount++;
    } else {
      break;
    }
  }

  if (streakCount < MIN_ENTRIES) return;

  // RPE should not be decreasing (meaning the weight isn't getting easier)
  const streakEntries = entries.slice(-streakCount);
  const rpeDecreasing = streakEntries.every(
    (e, i) => i === 0 || e.avgRpe <= streakEntries[i - 1].avgRpe,
  );
  // If RPE is strictly decreasing across all entries, the lifter is adapting — no stall
  const strictlyDecreasing =
    streakEntries.length > 1 &&
    streakEntries.every(
      (e, i) => i === 0 || e.avgRpe < streakEntries[i - 1].avgRpe,
    );

  if (strictlyDecreasing) return;

  signals.push({
    type: "WEIGHT_STALL",
    exerciseId: history.exerciseId,
    exerciseName: history.exerciseName,
    severity: severityFromCount(streakCount),
    message: `Weight stuck at ${lastWeight} lbs for ${streakCount} sessions on ${history.exerciseName}.`,
  });
}

function detectRepStall(
  entries: ExerciseProgressionHistory["entries"],
  history: ExerciseProgressionHistory,
  signals: PlateauSignal[],
): void {
  const lastReps = entries[entries.length - 1].bestReps;
  let streakCount = 1;

  for (let i = entries.length - 2; i >= 0; i--) {
    if (entries[i].bestReps === lastReps) {
      streakCount++;
    } else {
      break;
    }
  }

  if (streakCount < MIN_ENTRIES) return;

  // Check that weight hasn't increased during this streak
  const streakEntries = entries.slice(-streakCount);
  const weightIncreased = streakEntries.some(
    (e, i) => i > 0 && e.weightLbs > streakEntries[i - 1].weightLbs,
  );

  if (weightIncreased) return;

  signals.push({
    type: "REP_STALL",
    exerciseId: history.exerciseId,
    exerciseName: history.exerciseName,
    severity: severityFromCount(streakCount),
    message: `Reps stuck at ${lastReps} for ${streakCount} sessions on ${history.exerciseName} with no weight increase.`,
  });
}

function detectRpeCeiling(
  entries: ExerciseProgressionHistory["entries"],
  history: ExerciseProgressionHistory,
  signals: PlateauSignal[],
): void {
  // Find the longest tail streak where avgRpe > 8.5
  let streakCount = 0;

  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].avgRpe > 8.5) {
      streakCount++;
    } else {
      break;
    }
  }

  if (streakCount < MIN_ENTRIES) return;

  const avgRpe =
    entries.slice(-streakCount).reduce((sum, e) => sum + e.avgRpe, 0) / streakCount;

  signals.push({
    type: "RPE_CEILING",
    exerciseId: history.exerciseId,
    exerciseName: history.exerciseName,
    severity: severityFromCount(streakCount),
    message: `RPE averaging ${avgRpe.toFixed(1)} over ${streakCount} sessions on ${history.exerciseName}. Risk of overtraining.`,
  });
}

function detectVolumeFlat(
  analysis: WorkoutAnalysis,
  signals: PlateauSignal[],
): void {
  for (const mv of analysis.muscleVolumes) {
    if (mv.sessionCount >= 3 && mv.avgRpe > 7 && analysis.avgRpeTrend > 0.2) {
      signals.push({
        type: "VOLUME_FLAT",
        muscle: mv.muscle,
        severity: analysis.avgRpeTrend > 0.5 ? "strong" : analysis.avgRpeTrend > 0.3 ? "moderate" : "mild",
        message: `${mv.muscle} volume is flat while effort is rising (RPE trend +${analysis.avgRpeTrend.toFixed(1)}).`,
      });
    }
  }
}

function detectExerciseStaleness(
  analysis: WorkoutAnalysis,
  signals: PlateauSignal[],
): void {
  if (analysis.totalSessions === 0) return;

  for (const ef of analysis.exerciseFrequencies) {
    const ratio = ef.countInWindow / analysis.totalSessions;
    if (ratio >= 0.75) {
      let severity: "mild" | "moderate" | "strong";
      if (ratio >= 0.95) {
        severity = "strong";
      } else if (ratio >= 0.85) {
        severity = "moderate";
      } else {
        severity = "mild";
      }

      signals.push({
        type: "EXERCISE_STALENESS",
        exerciseId: ef.exerciseId,
        exerciseName: ef.exerciseName,
        severity,
        message: `${ef.exerciseName} used in ${Math.round(ratio * 100)}% of sessions. Consider rotating in a variation.`,
      });
    }
  }
}

// ─── Adaptation Recommendations ─────────────────────────────

/**
 * Given detected plateau signals, recommend concrete adaptations.
 *
 * Each recommendation may include a suggested alternative exercise from the
 * exercise pool. Alternatives are filtered through `evaluateExerciseSafety`
 * so only SAFE or MODIFIED exercises are suggested.
 *
 * @param signals - Plateau signals from `detectPlateaus`.
 * @param currentExerciseIds - Exercise IDs currently in the user's plan.
 * @param injuryContext - The user's current injury context for safety checks.
 * @returns Array of adaptation recommendations, one per signal.
 */
export function recommendAdaptations(
  signals: PlateauSignal[],
  currentExerciseIds: string[],
  injuryContext: InjuryContext,
): PlateauAdaptation[] {
  const adaptations: PlateauAdaptation[] = [];

  for (const signal of signals) {
    const adaptation = buildAdaptation(signal, currentExerciseIds, injuryContext);
    adaptations.push(adaptation);
  }

  return adaptations;
}

// ─── Adaptation Builders ─────────────────────────────────────

function buildAdaptation(
  signal: PlateauSignal,
  currentExerciseIds: string[],
  injuryContext: InjuryContext,
): PlateauAdaptation {
  switch (signal.type) {
    case "WEIGHT_STALL":
      return buildWeightStallAdaptation(signal, currentExerciseIds, injuryContext);
    case "REP_STALL":
      return buildRepStallAdaptation(signal, currentExerciseIds, injuryContext);
    case "RPE_CEILING":
      return buildRpeCeilingAdaptation(signal);
    case "VOLUME_FLAT":
      return buildVolumeFlatAdaptation(signal);
    case "EXERCISE_STALENESS":
      return buildStalenessAdaptation(signal, currentExerciseIds, injuryContext);
  }
}

function buildWeightStallAdaptation(
  signal: PlateauSignal,
  currentExerciseIds: string[],
  injuryContext: InjuryContext,
): PlateauAdaptation {
  // Try to find a same-muscle alternative exercise
  const alternative = findAlternativeExercise(
    signal.exerciseId,
    currentExerciseIds,
    injuryContext,
  );

  if (alternative) {
    return {
      signal,
      action: "SWAP_EXERCISE",
      detail: `Swap ${signal.exerciseName} for ${alternative.name} to break through the weight plateau.`,
      suggestedExerciseId: alternative.id,
    };
  }

  // Fallback: change rep range
  return {
    signal,
    action: "CHANGE_REP_RANGE",
    detail: `Try a different rep range for ${signal.exerciseName} (e.g., drop weight 10-15% and increase reps, or increase weight and lower reps).`,
  };
}

function buildRepStallAdaptation(
  signal: PlateauSignal,
  currentExerciseIds: string[],
  injuryContext: InjuryContext,
): PlateauAdaptation {
  // Try to find a variation to rotate in
  const alternative = findAlternativeExercise(
    signal.exerciseId,
    currentExerciseIds,
    injuryContext,
  );

  if (alternative) {
    return {
      signal,
      action: "ROTATE_VARIATION",
      detail: `Rotate in ${alternative.name} as a variation to break through the rep plateau on ${signal.exerciseName}.`,
      suggestedExerciseId: alternative.id,
    };
  }

  // Fallback: add volume
  return {
    signal,
    action: "ADD_VOLUME",
    detail: `Add 1-2 sets to ${signal.exerciseName} to push past the rep plateau.`,
  };
}

function buildRpeCeilingAdaptation(signal: PlateauSignal): PlateauAdaptation {
  return {
    signal,
    action: "DELOAD",
    detail: `Deload ${signal.exerciseName} by reducing weight 40-50% for 1 week. RPE has been too high for too long.`,
  };
}

function buildVolumeFlatAdaptation(signal: PlateauSignal): PlateauAdaptation {
  return {
    signal,
    action: "ADD_VOLUME",
    detail: `Add 1-2 sets per session for ${signal.muscle} to drive new stimulus. Effort is climbing without volume progression.`,
  };
}

function buildStalenessAdaptation(
  signal: PlateauSignal,
  currentExerciseIds: string[],
  injuryContext: InjuryContext,
): PlateauAdaptation {
  const alternative = findAlternativeExercise(
    signal.exerciseId,
    currentExerciseIds,
    injuryContext,
  );

  if (alternative) {
    return {
      signal,
      action: "ROTATE_VARIATION",
      detail: `Rotate in ${alternative.name} to replace ${signal.exerciseName} for a few weeks.`,
      suggestedExerciseId: alternative.id,
    };
  }

  // Fallback: still recommend rotation but without a specific exercise
  return {
    signal,
    action: "ROTATE_VARIATION",
    detail: `${signal.exerciseName} has been overused. Try a different variation targeting the same muscles.`,
  };
}

// ─── Exercise Pool Helpers ───────────────────────────────────

/**
 * Find a safe alternative exercise from the pool that targets the same muscles
 * as the given exercise, is not already in the current plan, and passes the
 * injury engine safety check.
 */
function findAlternativeExercise(
  exerciseId: string | undefined,
  currentExerciseIds: string[],
  injuryContext: InjuryContext,
): { id: string; name: string } | null {
  if (!exerciseId) return null;

  const currentExercise = exercisePool.find((e) => e.id === exerciseId);
  if (!currentExercise) return null;

  const targetMuscles = currentExercise.muscles;
  const excludeIds = new Set([...currentExerciseIds, exerciseId]);

  // Find candidates with overlapping muscles, not in current plan
  const candidates = exercisePool.filter((e) => {
    if (excludeIds.has(e.id)) return false;
    return e.muscles.some((m) => targetMuscles.includes(m));
  });

  // Check safety and pick the first SAFE or MODIFIED candidate
  for (const candidate of candidates) {
    const result = evaluateExerciseSafety(
      candidate.name,
      candidate.movements,
      candidate.contraindications,
      injuryContext,
    );

    if (result.safety === "SAFE" || result.safety === "MODIFIED") {
      return { id: candidate.id, name: candidate.name };
    }
  }

  return null;
}
