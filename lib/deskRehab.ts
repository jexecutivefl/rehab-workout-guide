import type {
  InjuryContext,
  PlannedExercise,
  DeskExerciseFilter,
  ExerciseDefinition,
  SafetyResult,
} from "@/types/index";
import { evaluateExerciseSafety } from "@/lib/injuryEngine";
import { exercisePool } from "@/data/exercisePool";

// ─── Body Part ID Prefix Mapping ────────────────────────────────

const BODY_PART_PREFIX: Record<string, string> = {
  shoulder: "desk-shoulder-",
  elbow: "desk-elbow-",
  foot: "desk-pf-",
};

// ─── Helpers ────────────────────────────────────────────────────

/** Convert an ExerciseDefinition + SafetyResult into a PlannedExercise. */
function toPlannedExercise(
  def: ExerciseDefinition,
  safetyResult: SafetyResult,
  orderIndex: number
): PlannedExercise {
  return {
    id: def.id,
    name: def.name,
    category: def.category,
    muscles: def.muscles,
    sets: def.defaultSets,
    repsMin: def.defaultRepsMin,
    repsMax: def.defaultRepsMax,
    durationSec: def.defaultDurationSec,
    restSec: def.defaultRestSec,
    formCues: def.formCues,
    isRehab: def.isRehab,
    safetyResult,
    orderIndex,
    wgerId: def.wgerId,
  };
}

/** Determine which body-part bucket a desk exercise belongs to by its ID prefix. */
function getBodyPart(id: string): "shoulder" | "elbow" | "foot" | "general" {
  if (id.startsWith("desk-shoulder-")) return "shoulder";
  if (id.startsWith("desk-elbow-")) return "elbow";
  if (id.startsWith("desk-pf-")) return "foot";
  return "general";
}

/** Safety ranking for sorting — lower number = higher priority. */
const SAFETY_RANK: Record<string, number> = {
  SAFE: 0,
  MODIFIED: 1,
  FLAG_PAIN: 2,
  AVOID: 3,
};

/**
 * Get the lowest injury stage relevant to a body part.
 * Lower stage = more acute = higher rehab priority.
 */
function injuryStageForPart(
  part: "shoulder" | "elbow" | "foot" | "general",
  ctx: InjuryContext
): number {
  switch (part) {
    case "shoulder":
      return ctx.shoulderInstability.stage;
    case "elbow":
      return ctx.sprainedElbow.stage;
    case "foot":
      return ctx.plantarFasciitis.stage;
    case "general":
      // General mobility exercises get lowest priority (stage 4 = least acute)
      return 4;
  }
}

/**
 * Estimate time in seconds for a single exercise.
 * Per exercise: sets * (repsMax * 3 or durationSec) + sets * restSec
 */
function estimateExerciseTimeSec(ex: PlannedExercise): number {
  const sets = ex.sets ?? 1;
  const workPerSet = ex.durationSec ?? (ex.repsMax ?? 10) * 3;
  return sets * workPerSet + (sets - 1) * ex.restSec;
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Filter and return desk-based rehab exercises, evaluated through the injury engine.
 *
 * - Filters exercisePool for `isDesk === true`
 * - Applies body-part filter if provided
 * - Runs each through `evaluateExerciseSafety()` — excludes AVOID exercises
 * - Sorts: SAFE first, then MODIFIED
 * - Assigns sequential orderIndex
 */
export function getDeskExercises(
  injuryContext: InjuryContext,
  filter?: DeskExerciseFilter
): PlannedExercise[] {
  // 1. Filter to desk exercises only
  let deskExercises: ExerciseDefinition[] = exercisePool.filter(
    (ex) => ex.isDesk === true
  );

  // 2. Apply body part filter
  const bodyPart = filter?.bodyPart;
  if (bodyPart && bodyPart !== "all") {
    const prefix = BODY_PART_PREFIX[bodyPart];
    if (prefix) {
      deskExercises = deskExercises.filter((ex) => ex.id.startsWith(prefix));
    }
  }

  // 3. Evaluate safety and exclude AVOID
  const evaluated: { def: ExerciseDefinition; safety: SafetyResult }[] = [];
  for (const def of deskExercises) {
    const safety = evaluateExerciseSafety(
      def.name,
      def.movements,
      def.contraindications,
      injuryContext
    );
    if (safety.safety !== "AVOID") {
      evaluated.push({ def, safety });
    }
  }

  // 4. Sort: SAFE first, then MODIFIED
  evaluated.sort(
    (a, b) =>
      (SAFETY_RANK[a.safety.safety] ?? 2) -
      (SAFETY_RANK[b.safety.safety] ?? 2)
  );

  // 5. Convert to PlannedExercise with sequential orderIndex
  return evaluated.map((item, idx) =>
    toPlannedExercise(item.def, item.safety, idx)
  );
}

/**
 * Build a time-boxed desk rehab session with balanced body-part coverage.
 *
 * - Picks up to 2 exercises per body part (shoulder, elbow, foot) plus 1 general mobility
 * - Prioritizes injuries by stage (lower stage = more acute = selected first)
 * - Stays within the given time budget
 * - Returns exercises with sequential orderIndex
 */
export function buildDeskSession(
  injuryContext: InjuryContext,
  maxMinutes: number = 10
): PlannedExercise[] {
  const allExercises = getDeskExercises(injuryContext);
  const maxSec = maxMinutes * 60;

  // Bucket exercises by body part
  const buckets: Record<string, PlannedExercise[]> = {
    shoulder: [],
    elbow: [],
    foot: [],
    general: [],
  };

  for (const ex of allExercises) {
    const part = getBodyPart(ex.id);
    buckets[part].push(ex);
  }

  // Sort body parts by injury stage (lower = more acute = pick first)
  const bodyParts: ("shoulder" | "elbow" | "foot")[] = ["shoulder", "elbow", "foot"];
  bodyParts.sort(
    (a, b) =>
      injuryStageForPart(a, injuryContext) -
      injuryStageForPart(b, injuryContext)
  );

  const selected: PlannedExercise[] = [];
  let totalSec = 0;

  // Pick up to 2 per body part, respecting time budget
  for (const part of bodyParts) {
    let count = 0;
    for (const ex of buckets[part]) {
      if (count >= 2) break;
      const timeSec = estimateExerciseTimeSec(ex);
      if (totalSec + timeSec > maxSec) continue;
      selected.push(ex);
      totalSec += timeSec;
      count++;
    }
  }

  // Add up to 1 general mobility exercise
  for (const ex of buckets.general) {
    const timeSec = estimateExerciseTimeSec(ex);
    if (totalSec + timeSec <= maxSec) {
      selected.push(ex);
      totalSec += timeSec;
      break;
    }
  }

  // Reassign sequential orderIndex
  return selected.map((ex, idx) => ({ ...ex, orderIndex: idx }));
}

/**
 * Estimate total duration of a list of exercises in minutes (rounded up).
 *
 * Per exercise: sets * (durationSec or repsMax * 3) + (sets - 1) * restSec
 */
export function estimateSessionDuration(exercises: PlannedExercise[]): number {
  let totalSec = 0;
  for (const ex of exercises) {
    totalSec += estimateExerciseTimeSec(ex);
  }
  return Math.ceil(totalSec / 60);
}
