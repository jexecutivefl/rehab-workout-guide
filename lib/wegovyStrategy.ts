/**
 * Wegovy Strategy
 *
 * Pure protocol logic for users on Wegovy (GLP-1 agonist). The medication
 * suppresses appetite, so the strategy prioritizes muscle preservation and
 * performance goals over scale weight. Trainers who optimize for traditional
 * bodybuilding bulk on GLP-1 lose muscle and end up smaller, not stronger.
 *
 * Goals (per protocol):
 *   1. Preserve and build muscle
 *   2. Lose fat steadily
 *   3. Get stronger every month
 *
 * Target: 190–195 lbs at 15–18% body fat — performance-driven, not scale-driven.
 *
 * All logic is pure TS — no DB writes, no schema. Computed against existing
 * CompletedSetRecord + CompletedExerciseRecord data.
 */

// ─── Daily Nutrition Targets ─────────────────────────────────

export const WEGOVY_PROTEIN_TARGET_G = { min: 170, max: 200 } as const;
export const WEGOVY_CREATINE_DAILY_G = 5;

export type ProteinSource = {
  name: string;
  unit: string;
  proteinGrams: number;
};

export const WEGOVY_PROTEIN_SOURCES: ProteinSource[] = [
  { name: "Protein shake", unit: "1 scoop", proteinGrams: 30 },
  { name: "Greek yogurt", unit: "1 cup", proteinGrams: 18 },
  { name: "Chicken breast", unit: "6 oz", proteinGrams: 45 },
  { name: "Lean steak", unit: "6 oz", proteinGrams: 45 },
  { name: "Eggs", unit: "1 large", proteinGrams: 6 },
  { name: "Cottage cheese", unit: "1 cup", proteinGrams: 25 },
];

// ─── Phase / Timeline ────────────────────────────────────────

export type WegovyPhase = "ramp" | "phase1" | "phase2" | "maintenance";

export type WegovyPhaseInfo = {
  phase: WegovyPhase;
  label: string;
  monthsElapsed: number;
  expectedCumulativeLossLbs: { min: number; max: number };
  focus: string;
};

/**
 * Compute the user's current Wegovy phase from their start date.
 * Phase ramps in month 1, then Months 1–3 (phase1), Months 4–6 (phase2), then maintenance.
 */
export function getWegovyPhase(
  wegovyStartDate: string | null | undefined,
  now: Date = new Date()
): WegovyPhaseInfo {
  if (!wegovyStartDate) {
    return {
      phase: "ramp",
      label: "Pre-Wegovy",
      monthsElapsed: 0,
      expectedCumulativeLossLbs: { min: 0, max: 0 },
      focus:
        "Hit 170–200g protein daily. Start 5g creatine. Train 4 days/week. Track baseline lifts.",
    };
  }

  const startMs = new Date(wegovyStartDate).getTime();
  if (Number.isNaN(startMs)) {
    return getWegovyPhase(null, now);
  }

  const monthsElapsed = Math.max(
    0,
    (now.getTime() - startMs) / (1000 * 60 * 60 * 24 * 30.44)
  );

  if (monthsElapsed < 1) {
    return {
      phase: "ramp",
      label: "Ramp (Month 1)",
      monthsElapsed,
      expectedCumulativeLossLbs: { min: 0, max: 5 },
      focus:
        "Adjust to GLP-1 effects. Lock in protein. Don't push intensity yet — get to 170g+ daily first.",
    };
  }
  if (monthsElapsed < 4) {
    return {
      phase: "phase1",
      label: "Phase 1 (Months 1–3)",
      monthsElapsed,
      expectedCumulativeLossLbs: { min: 10, max: 20 },
      focus:
        "Preserve muscle. Expect 10–20 lbs lost and noticeable waist reduction. Strength mostly maintained.",
    };
  }
  if (monthsElapsed < 7) {
    return {
      phase: "phase2",
      label: "Phase 2 (Months 4–6)",
      monthsElapsed,
      expectedCumulativeLossLbs: { min: 20, max: 35 },
      focus:
        "Cumulative 20–35 lbs lost. More muscle definition. Strength now increasing — push the compounds.",
    };
  }
  return {
    phase: "maintenance",
    label: "Maintenance (Months 7+)",
    monthsElapsed,
    expectedCumulativeLossLbs: { min: 0, max: 0 },
    focus: "Maintain physique. Chase performance goals. Reassess body comp monthly.",
  };
}

// ─── Performance Goals ───────────────────────────────────────

export type WegovyGoalMetric = "ONE_REP_MAX" | "DURATION_SEC" | "MANUAL";

export type WegovyGoal = {
  id: string;
  label: string;
  description: string;
  metric: WegovyGoalMetric;
  // ONE_REP_MAX
  targetWeightLbs?: number;
  targetReps?: number;
  targetOneRepMaxLbs?: number;
  // ONE_REP_MAX + DURATION_SEC
  exerciseIds?: string[];
  // DURATION_SEC
  targetDurationSec?: number;
};

/** Epley 1RM estimate. */
export function epleyOneRepMax(weightLbs: number, reps: number): number {
  if (weightLbs <= 0 || reps <= 0) return 0;
  return weightLbs * (1 + reps / 30);
}

/**
 * Per-exercise load multiplier. Dumbbell exercises are typically logged
 * as per-DB weight; the user holds one in each hand so effective load = 2x.
 */
const EXERCISE_WEIGHT_MULTIPLIERS: Record<string, number> = {
  "chest-db-bench": 2,
  "legs-rdl-db": 2,
};

export const WEGOVY_GOALS: WegovyGoal[] = [
  {
    id: "bench-225x5",
    label: "Bench Press: 225 × 5",
    description: "Chest, triceps, front delts under load.",
    metric: "ONE_REP_MAX",
    targetWeightLbs: 225,
    targetReps: 5,
    targetOneRepMaxLbs: epleyOneRepMax(225, 5),
    exerciseIds: ["chest-db-bench", "chest-machine-press"],
  },
  {
    id: "squat-315x5",
    label: "Squat: 315 × 5",
    description: "Quads, glutes, total-body bracing.",
    metric: "ONE_REP_MAX",
    targetWeightLbs: 315,
    targetReps: 5,
    targetOneRepMaxLbs: epleyOneRepMax(315, 5),
    exerciseIds: ["legs-leg-press", "legs-goblet-squat"],
  },
  {
    id: "rdl-275x8",
    label: "Romanian Deadlift: 275 × 8",
    description: "Hamstrings, glutes, grip, posterior chain.",
    metric: "ONE_REP_MAX",
    targetWeightLbs: 275,
    targetReps: 8,
    targetOneRepMaxLbs: epleyOneRepMax(275, 8),
    exerciseIds: ["legs-rdl-db"],
  },
  {
    id: "incline-walk-30min",
    label: "30-min Incline Walk",
    description: "Conditioning — finish without being gassed.",
    metric: "DURATION_SEC",
    targetDurationSec: 30 * 60,
    exerciseIds: ["cardio-treadmill-walk"],
  },
  {
    id: "farmer-carry-bw",
    label: "Farmer Carry: Bodyweight per hand",
    description: "Grip, posture, total-body endurance. Log manually.",
    metric: "MANUAL",
  },
];

// ─── Progress Computation ────────────────────────────────────

export type WegovySetInput = {
  exerciseId: string;
  weightLbs?: number | null;
  reps?: number | null;
  durationSec?: number | null;
  completedAt?: string;
};

export type WegovyGoalProgress = {
  goal: WegovyGoal;
  status: "not_started" | "in_progress" | "achieved";
  percentComplete: number; // 0–100
  achieved: boolean;
  bestObserved?: {
    weightLbs?: number;
    reps?: number;
    estimatedOneRepMaxLbs?: number;
    durationSec?: number;
    achievedAt?: string;
  };
};

/**
 * Compute progress toward a single goal from a flat list of logged sets.
 * - ONE_REP_MAX goals: take best Epley-estimated 1RM across matching exercises.
 * - DURATION_SEC goals: take longest matching duration.
 * - MANUAL goals: always return not_started; the user marks them off elsewhere.
 */
export function computeWegovyGoalProgress(
  goal: WegovyGoal,
  sets: WegovySetInput[]
): WegovyGoalProgress {
  if (goal.metric === "MANUAL") {
    return {
      goal,
      status: "not_started",
      percentComplete: 0,
      achieved: false,
    };
  }

  if (goal.metric === "DURATION_SEC") {
    const target = goal.targetDurationSec ?? 0;
    const ids = goal.exerciseIds ?? [];
    let bestDuration = 0;
    let bestAt: string | undefined;

    for (const s of sets) {
      if (!ids.includes(s.exerciseId)) continue;
      const dur = s.durationSec ?? 0;
      if (dur > bestDuration) {
        bestDuration = dur;
        bestAt = s.completedAt;
      }
    }

    const percent =
      target > 0 ? Math.min(100, Math.round((bestDuration / target) * 100)) : 0;
    return {
      goal,
      status:
        bestDuration === 0 ? "not_started" : percent >= 100 ? "achieved" : "in_progress",
      percentComplete: percent,
      achieved: percent >= 100,
      bestObserved:
        bestDuration > 0
          ? { durationSec: bestDuration, achievedAt: bestAt }
          : undefined,
    };
  }

  // ONE_REP_MAX
  const ids = goal.exerciseIds ?? [];
  const target = goal.targetOneRepMaxLbs ?? 0;
  let best1RM = 0;
  let bestWeight = 0;
  let bestReps = 0;
  let bestAt: string | undefined;

  for (const s of sets) {
    if (!ids.includes(s.exerciseId)) continue;
    if (!s.weightLbs || !s.reps) continue;
    const mult = EXERCISE_WEIGHT_MULTIPLIERS[s.exerciseId] ?? 1;
    const effective = s.weightLbs * mult;
    const oneRm = epleyOneRepMax(effective, s.reps);
    if (oneRm > best1RM) {
      best1RM = oneRm;
      bestWeight = effective;
      bestReps = s.reps;
      bestAt = s.completedAt;
    }
  }

  const percent =
    target > 0 ? Math.min(100, Math.round((best1RM / target) * 100)) : 0;

  return {
    goal,
    status:
      best1RM === 0 ? "not_started" : percent >= 100 ? "achieved" : "in_progress",
    percentComplete: percent,
    achieved: percent >= 100,
    bestObserved:
      best1RM > 0
        ? {
            weightLbs: Math.round(bestWeight),
            reps: bestReps,
            estimatedOneRepMaxLbs: Math.round(best1RM),
            achievedAt: bestAt,
          }
        : undefined,
  };
}

/** Compute progress for every Wegovy goal at once. */
export function computeAllWegovyGoalProgress(
  sets: WegovySetInput[]
): WegovyGoalProgress[] {
  return WEGOVY_GOALS.map((g) => computeWegovyGoalProgress(g, sets));
}
