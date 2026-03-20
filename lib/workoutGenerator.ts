import type {
  UserProfileData,
  InjuryContext,
  DayPlan,
  DayOfWeek,
  SessionType,
  PlannedExercise,
  ExerciseDefinition,
  ExerciseCategory,
  DailyCheckIn,
} from "@/types/index";
import { exercisePool } from "@/data/exercisePool";
import { evaluateExerciseSafety } from "@/lib/injuryEngine";

/**
 * Weekly plan generator.
 *
 * Every exercise is filtered through evaluateExerciseSafety() — no exceptions.
 * The generator respects injury stages, gym equipment, and weekly periodization.
 */

// ─── Week Structure ───────────────────────────────────────────

type WeekTemplate = { day: DayOfWeek; sessionType: SessionType }[];

const WEEK_TEMPLATES: Record<1 | 2 | 3 | 4, WeekTemplate> = {
  1: [
    { day: "MON", sessionType: "REHAB_FOCUSED" },
    { day: "TUE", sessionType: "UPPER_BODY" },
    { day: "WED", sessionType: "ACTIVE_RECOVERY" },
    { day: "THU", sessionType: "LOWER_BODY" },
    { day: "FRI", sessionType: "REHAB_FOCUSED" },
    { day: "SAT", sessionType: "CARDIO_ONLY" },
    { day: "SUN", sessionType: "REST" },
  ],
  2: [
    { day: "MON", sessionType: "REHAB_FOCUSED" },
    { day: "TUE", sessionType: "UPPER_BODY" },
    { day: "WED", sessionType: "LOWER_BODY" },
    { day: "THU", sessionType: "ACTIVE_RECOVERY" },
    { day: "FRI", sessionType: "UPPER_BODY" },
    { day: "SAT", sessionType: "CARDIO_ONLY" },
    { day: "SUN", sessionType: "REST" },
  ],
  3: [
    { day: "MON", sessionType: "UPPER_BODY" },
    { day: "TUE", sessionType: "LOWER_BODY" },
    { day: "WED", sessionType: "REHAB_FOCUSED" },
    { day: "THU", sessionType: "UPPER_BODY" },
    { day: "FRI", sessionType: "LOWER_BODY" },
    { day: "SAT", sessionType: "CARDIO_ONLY" },
    { day: "SUN", sessionType: "REST" },
  ],
  4: [
    // Deload week — 60% volume, reassess
    { day: "MON", sessionType: "REHAB_FOCUSED" },
    { day: "TUE", sessionType: "ACTIVE_RECOVERY" },
    { day: "WED", sessionType: "UPPER_BODY" },
    { day: "THU", sessionType: "ACTIVE_RECOVERY" },
    { day: "FRI", sessionType: "LOWER_BODY" },
    { day: "SAT", sessionType: "CARDIO_ONLY" },
    { day: "SUN", sessionType: "REST" },
  ],
};

// ─── Volume Multipliers ───────────────────────────────────────

const VOLUME_MULTIPLIERS: Record<1 | 2 | 3 | 4, number> = {
  1: 0.7, // Light week
  2: 0.85, // Add volume
  3: 1.0, // Progressive overload
  4: 0.6, // Deload
};

// ─── Public API ───────────────────────────────────────────────

/**
 * Generate a full weekly plan, filtering every exercise through the injury engine.
 */
export function generateWeeklyPlan(
  profile: UserProfileData,
  injuryContext: InjuryContext,
  week: 1 | 2 | 3 | 4
): DayPlan[] {
  const template = WEEK_TEMPLATES[week];
  const volumeMultiplier = VOLUME_MULTIPLIERS[week];

  return template.map((dayTemplate) => {
    if (dayTemplate.sessionType === "REST") {
      return {
        day: dayTemplate.day,
        sessionType: "REST",
        exercises: [],
        notes: "Full rest day. Gentle walking OK if pain-free.",
      };
    }

    const exercises = buildSession(
      dayTemplate.sessionType,
      profile,
      injuryContext,
      volumeMultiplier
    );

    return {
      day: dayTemplate.day,
      sessionType: dayTemplate.sessionType,
      exercises,
      notes: buildNotes(dayTemplate.sessionType, week, injuryContext),
    };
  });
}

// ─── Readiness-Based Adjustment ──────────────────────────────

/**
 * Adjust a day's workout plan based on daily readiness check-in data.
 *
 * - Bad day (pain ≥ 6 OR energy ≤ 3): Replace with active recovery, cap RPE at 4
 * - Low day (pain 4-5 OR energy 4-5): Reduce volume 40%, keep only SAFE exercises, cap RPE at 6
 * - Good day (pain ≤ 2 AND energy ≥ 7): Allow progression — use full volume, add 1 extra set to compounds
 * - Normal: Return plan unchanged
 */
export function adjustSessionForReadiness(
  basePlan: DayPlan,
  checkIn: Pick<DailyCheckIn, "overallPain" | "energyLevel" | "sleepQuality">,
  profile: UserProfileData,
  injuryContext: InjuryContext
): DayPlan {
  if (basePlan.sessionType === "REST") return basePlan;

  const { overallPain, energyLevel } = checkIn;

  // Bad day: active recovery only
  if (overallPain >= 6 || energyLevel <= 3) {
    const recoveryExercises = buildSession(
      "ACTIVE_RECOVERY",
      profile,
      injuryContext,
      0.5
    );
    // Cap RPE at 4
    const capped = recoveryExercises.map((ex) => ({
      ...ex,
      rpeTarget: Math.min(ex.rpeTarget ?? 4, 4),
    }));
    return {
      ...basePlan,
      sessionType: "ACTIVE_RECOVERY",
      exercises: capped,
      notes: `Bad day adjustment: Pain ${overallPain}/10, Energy ${energyLevel}/10. ` +
        "Active recovery only. Focus on rehab exercises and gentle movement.",
    };
  }

  // Low day: reduced volume, SAFE exercises only
  if (overallPain >= 4 || energyLevel <= 5) {
    const reduced = basePlan.exercises
      .filter((ex) => ex.safetyResult.safety === "SAFE" || ex.isRehab)
      .map((ex) => ({
        ...ex,
        sets: ex.sets ? Math.max(1, Math.round(ex.sets * 0.6)) : ex.sets,
        rpeTarget: Math.min(ex.rpeTarget ?? 6, 6),
      }));
    return {
      ...basePlan,
      exercises: reduced,
      notes: `Low day adjustment: Pain ${overallPain}/10, Energy ${energyLevel}/10. ` +
        "Volume reduced 40%. Only safe exercises. Take extra rest between sets.",
    };
  }

  // Good day: allow progression, add volume
  if (overallPain <= 2 && energyLevel >= 7) {
    const boosted = basePlan.exercises.map((ex) => {
      if (!ex.isRehab && ex.sets && ex.sets >= 2) {
        return { ...ex, sets: ex.sets + 1 };
      }
      return ex;
    });
    return {
      ...basePlan,
      exercises: boosted,
      notes: (basePlan.notes || "") +
        " Good day — feeling strong. Extra set added to compound movements. Push for progression.",
    };
  }

  // Normal day: unchanged
  return basePlan;
}

// ─── Session Builders ─────────────────────────────────────────

function buildSession(
  sessionType: SessionType,
  profile: UserProfileData,
  ctx: InjuryContext,
  volumeMultiplier: number
): PlannedExercise[] {
  const exercises: PlannedExercise[] = [];
  let orderIndex = 0;

  // Block 1: Warmup — bike + arm circles + mobility
  const warmup = findAndEvaluate("warmup-stationary-bike", ctx);
  if (warmup) {
    exercises.push(
      toPlanned(warmup.def, warmup.safety, orderIndex++, volumeMultiplier)
    );
  }
  const armCircles = findAndEvaluate("warmup-arm-circles", ctx);
  if (armCircles && (sessionType === "UPPER_BODY" || sessionType === "REHAB_FOCUSED" || sessionType === "FULL_BODY")) {
    exercises.push(
      toPlanned(armCircles.def, armCircles.safety, orderIndex++, volumeMultiplier)
    );
  }

  // Block 2: Mini rehab block — always include 2-3 rehab exercises (unless already rehab-focused)
  if (sessionType !== "REHAB_FOCUSED" && sessionType !== "ACTIVE_RECOVERY") {
    const rehabBlock = selectMiniRehab(profile, ctx, sessionType);
    for (const ex of take(rehabBlock, 3)) {
      exercises.push(toPlanned(ex.def, ex.safety, orderIndex++, volumeMultiplier));
    }
  }

  // Block 3: Main session
  const mainExercises = getMainExercises(sessionType, profile, ctx);
  for (const ex of mainExercises) {
    exercises.push(toPlanned(ex.def, ex.safety, orderIndex++, volumeMultiplier));
  }

  // Block 4: Cooldown stretches
  const cooldown = getCooldownExercises(sessionType, ctx);
  for (const ex of cooldown) {
    exercises.push(toPlanned(ex.def, ex.safety, orderIndex++, volumeMultiplier));
  }

  return exercises;
}

/**
 * Select a mini rehab block (2-3 exercises) relevant to the session type.
 * Upper body sessions get shoulder + elbow rehab; lower body gets PF rehab.
 */
function selectMiniRehab(
  profile: UserProfileData,
  ctx: InjuryContext,
  sessionType: SessionType
): EvaluatedExercise[] {
  const allRehab = exercisePool.filter((e) => e.isRehab);
  const evaluated = filterAndEvaluate(allRehab, profile, ctx);

  if (sessionType === "UPPER_BODY") {
    // Shoulder + elbow rehab exercises
    const upper = evaluated.filter((e) =>
      e.def.muscles.some((m) =>
        ["rotator_cuff", "infraspinatus", "subscapularis", "rhomboids",
         "middle_trapezius", "lower_trapezius", "serratus_anterior",
         "forearm_flexors", "forearm_extensors", "biceps", "triceps"].includes(m)
      )
    );
    return take(upper, 3);
  }

  if (sessionType === "LOWER_BODY") {
    // PF + ankle rehab exercises
    const lower = evaluated.filter((e) =>
      e.def.muscles.some((m) =>
        ["foot_intrinsics", "plantar_fascia", "gastrocnemius",
         "soleus", "tibialis_anterior"].includes(m)
      )
    );
    return take(lower, 2);
  }

  if (sessionType === "CARDIO_ONLY") {
    // Light mobility warmup
    const mobility = evaluated.filter((e) =>
      e.def.id.startsWith("mobility-")
    );
    return take(mobility, 2);
  }

  return take(evaluated, 2);
}

type EvaluatedExercise = {
  def: ExerciseDefinition;
  safety: ReturnType<typeof evaluateExerciseSafety>;
};

function getMainExercises(
  sessionType: SessionType,
  profile: UserProfileData,
  ctx: InjuryContext
): EvaluatedExercise[] {
  switch (sessionType) {
    case "REHAB_FOCUSED":
      return selectRehabExercises(profile, ctx);
    case "UPPER_BODY":
      return selectUpperBody(profile, ctx);
    case "LOWER_BODY":
      return selectLowerBody(profile, ctx);
    case "CARDIO_ONLY":
      return selectCardio(profile, ctx);
    case "ACTIVE_RECOVERY":
      return selectActiveRecovery(profile, ctx);
    default:
      return [];
  }
}

function selectRehabExercises(
  profile: UserProfileData,
  ctx: InjuryContext
): EvaluatedExercise[] {
  const rehab = exercisePool.filter((e) => e.isRehab);
  return filterAndEvaluate(rehab, profile, ctx);
}

function selectUpperBody(
  profile: UserProfileData,
  ctx: InjuryContext
): EvaluatedExercise[] {
  const upperMuscles = [
    "pectorals",
    "anterior_deltoid",
    "lateral_deltoid",
    "rear_deltoid",
    "triceps",
    "biceps",
    "latissimus_dorsi",
    "rhomboids",
    "rotator_cuff",
  ];
  const categories: ExerciseCategory[] = ["STRENGTH"];

  const candidates = exercisePool.filter(
    (e) =>
      !e.isRehab &&
      categories.includes(e.category) &&
      e.muscles.some((m) => upperMuscles.includes(m))
  );

  const evaluated = filterAndEvaluate(candidates, profile, ctx);

  // Pick a balanced set: 2 push, 2 pull, 1 shoulder, 1 arm, 1 core
  const push = evaluated.filter((e) =>
    e.def.movements.some((m) => m.includes("push"))
  );
  const pull = evaluated.filter((e) =>
    e.def.movements.some((m) => m.includes("pull"))
  );
  const shoulder = evaluated.filter((e) =>
    e.def.muscles.some((m) => m.includes("deltoid")) &&
    !e.def.movements.some((m) => m.includes("push") || m.includes("pull"))
  );
  const core = filterAndEvaluate(
    exercisePool.filter((e) => e.category === "CORE"),
    profile,
    ctx
  );

  const result: EvaluatedExercise[] = [];
  result.push(...take(push, 2));
  result.push(...take(pull, 2));
  result.push(...take(shoulder, 1));
  result.push(...take(core, 1));

  return result;
}

function selectLowerBody(
  profile: UserProfileData,
  ctx: InjuryContext
): EvaluatedExercise[] {
  const lowerMuscles = [
    "quadriceps",
    "hamstrings",
    "glutes",
    "calves",
    "hip_flexors",
  ];
  const categories: ExerciseCategory[] = ["STRENGTH"];

  const candidates = exercisePool.filter(
    (e) =>
      !e.isRehab &&
      categories.includes(e.category) &&
      e.muscles.some((m) => lowerMuscles.includes(m))
  );

  const evaluated = filterAndEvaluate(candidates, profile, ctx);

  // Pick balanced: 2 quad-dominant, 2 ham/glute, 1 core
  const quadDom = evaluated.filter((e) =>
    e.def.muscles.includes("quadriceps")
  );
  const hamGlute = evaluated.filter(
    (e) =>
      e.def.muscles.includes("hamstrings") || e.def.muscles.includes("glutes")
  );
  const core = filterAndEvaluate(
    exercisePool.filter((e) => e.category === "CORE"),
    profile,
    ctx
  );

  const result: EvaluatedExercise[] = [];
  result.push(...take(quadDom, 2));
  result.push(...take(hamGlute, 2));
  result.push(...take(core, 1));

  return result;
}

/**
 * Smart cardio selection based on injury status.
 *
 * Priority: Bike (always safe) → Rowing (if elbow+shoulder allow) → Elliptical (if PF allows) → Walking (if PF allows)
 *
 * Rowing is safe when: elbow stage ≥ 3 AND elbow pain ≤ 3 AND shoulder stage ≥ 3
 * Rowing modified when: elbow stage 3 AND pain ≤ 5 → reduced duration, light grip cue
 */
function selectCardio(
  profile: UserProfileData,
  ctx: InjuryContext
): EvaluatedExercise[] {
  const result: EvaluatedExercise[] = [];

  // Bike is always the primary option (no impact, no elbow/shoulder stress)
  const bike = findAndEvaluate("cardio-stationary-bike", ctx);
  if (bike) result.push(bike);

  // Rowing: check elbow + shoulder clearance
  const elbowClearedForRowing = ctx.sprainedElbow.stage >= 3 && ctx.sprainedElbow.painLevel <= 5;
  const shoulderClearedForRowing = ctx.shoulderInstability.stage >= 3;

  if (elbowClearedForRowing && shoulderClearedForRowing) {
    const rowing = findAndEvaluate("cardio-rowing", ctx);
    if (rowing) {
      // If elbow pain is 4-5, add extra caution
      if (ctx.sprainedElbow.painLevel >= 4) {
        rowing.safety = {
          ...rowing.safety,
          safety: "MODIFIED",
          modification: (rowing.safety.modification || "") +
            " Light grip, let legs do the work. Reduce duration 50%. Stop if elbow pain increases.",
        };
      }
      result.push(rowing);
    }
  }

  // Elliptical: PF stage 3+ (engine handles this via contraindications)
  if (result.length < 2) {
    const elliptical = findAndEvaluate("cardio-elliptical", ctx);
    if (elliptical) result.push(elliptical);
  }

  // Treadmill walking: PF stage 3+ (engine handles this)
  if (result.length < 2) {
    const treadmill = findAndEvaluate("cardio-treadmill-walk", ctx);
    if (treadmill) result.push(treadmill);
  }

  return take(result, 2);
}

function selectActiveRecovery(
  profile: UserProfileData,
  ctx: InjuryContext
): EvaluatedExercise[] {
  // Light cardio + rehab exercises
  const rehab = selectRehabExercises(profile, ctx);
  const cardio = exercisePool.filter(
    (e) => e.category === "CARDIO" && e.id === "cardio-stationary-bike"
  );
  const evaluatedCardio = filterAndEvaluate(cardio, profile, ctx);

  return [...take(evaluatedCardio, 1), ...take(rehab, 4)];
}

function getCooldownExercises(
  sessionType: SessionType,
  ctx: InjuryContext
): EvaluatedExercise[] {
  const stretches = exercisePool.filter(
    (e) => e.category === "STRETCH" || e.category === "COOLDOWN"
  );

  const evaluated: EvaluatedExercise[] = [];
  for (const s of stretches) {
    const safety = evaluateExerciseSafety(
      s.name,
      s.movements,
      s.contraindications,
      ctx
    );
    if (safety.safety !== "AVOID") {
      evaluated.push({ def: s, safety });
    }
  }

  // Pick relevant stretches based on session type
  if (sessionType === "UPPER_BODY") {
    const upperStretches = evaluated.filter((e) =>
      e.def.muscles.some((m) =>
        ["pectorals", "anterior_deltoid", "rear_deltoid", "latissimus_dorsi", "triceps", "forearm_flexors"].includes(m)
      )
    );
    return take(upperStretches, 3);
  }

  if (sessionType === "LOWER_BODY") {
    const lowerStretches = evaluated.filter((e) =>
      e.def.muscles.some((m) =>
        ["hamstrings", "quadriceps", "hip_flexors"].includes(m)
      )
    );
    return take(lowerStretches, 3);
  }

  // Default: pick 2-3 general stretches
  return take(evaluated, 3);
}

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Filter exercises through the injury engine, excluding AVOIDed ones.
 * Also filters by gym equipment availability.
 */
function filterAndEvaluate(
  candidates: ExerciseDefinition[],
  profile: UserProfileData,
  ctx: InjuryContext
): EvaluatedExercise[] {
  const results: EvaluatedExercise[] = [];

  for (const def of candidates) {
    // Check gym equipment
    if (!def.equipment.includes(profile.gymPreference)) {
      continue;
    }

    const safety = evaluateExerciseSafety(
      def.name,
      def.movements,
      def.contraindications,
      ctx
    );

    // Never include AVOID exercises
    if (safety.safety === "AVOID") {
      continue;
    }

    results.push({ def, safety });
  }

  // Sort: SAFE first, then MODIFIED, then FLAG_PAIN
  const rank = { SAFE: 0, MODIFIED: 1, FLAG_PAIN: 2, AVOID: 3 };
  results.sort((a, b) => rank[a.safety.safety] - rank[b.safety.safety]);

  return results;
}

/** Find a specific exercise by ID and evaluate its safety. */
function findAndEvaluate(
  id: string,
  ctx: InjuryContext
): EvaluatedExercise | null {
  const def = exercisePool.find((e) => e.id === id);
  if (!def) return null;

  const safety = evaluateExerciseSafety(
    def.name,
    def.movements,
    def.contraindications,
    ctx
  );

  if (safety.safety === "AVOID") return null;
  return { def, safety };
}

/** Take up to N items from an array without duplicating IDs already seen. */
function take(arr: EvaluatedExercise[], n: number): EvaluatedExercise[] {
  return arr.slice(0, n);
}

/** Convert an ExerciseDefinition + SafetyResult into a PlannedExercise. */
function toPlanned(
  def: ExerciseDefinition,
  safety: ReturnType<typeof evaluateExerciseSafety>,
  orderIndex: number,
  volumeMultiplier: number
): PlannedExercise {
  const sets = def.defaultSets
    ? Math.max(1, Math.round(def.defaultSets * volumeMultiplier))
    : undefined;

  return {
    id: def.id,
    name: def.name,
    category: def.category,
    muscles: def.muscles,
    sets,
    repsMin: def.defaultRepsMin,
    repsMax: def.defaultRepsMax,
    durationSec: def.defaultDurationSec,
    restSec: def.defaultRestSec,
    rpeTarget: def.isRehab ? 4 : 7,
    formCues: safety.modification
      ? [...def.formCues, `⚠ ${safety.modification}`]
      : def.formCues,
    isRehab: def.isRehab,
    safetyResult: safety,
    orderIndex,
    wgerId: def.wgerId,
  };
}

function buildNotes(
  sessionType: SessionType,
  week: 1 | 2 | 3 | 4,
  ctx: InjuryContext
): string {
  const notes: string[] = [];

  if (week === 1) {
    notes.push("Week 1: Light introduction. Focus on form and pain monitoring.");
  } else if (week === 2) {
    notes.push("Week 2: Adding volume on cleared movements.");
  } else if (week === 3) {
    notes.push("Week 3: Progressive overload on safe exercises.");
  } else {
    notes.push("Week 4: Deload week — 60% volume. Reassess injuries.");
  }

  if (sessionType === "REHAB_FOCUSED") {
    notes.push("Focus on rehab exercises. Track pain levels for each movement.");
  }

  if (ctx.plantarFasciitis.painLevel >= 5) {
    notes.push(`PF pain elevated (${ctx.plantarFasciitis.painLevel}/10). Extra caution on foot exercises.`);
  }

  if (ctx.sprainedElbow.painLevel >= 5) {
    notes.push(`Elbow pain elevated (${ctx.sprainedElbow.painLevel}/10). Extra caution on arm exercises.`);
  }

  if (ctx.shoulderInstability.painLevel >= 5) {
    notes.push(`Shoulder pain elevated (${ctx.shoulderInstability.painLevel}/10). Extra caution on pressing and overhead movements.`);
  }

  if (ctx.sprainedElbow.stage <= 2 && ctx.shoulderInstability.stage <= 2) {
    notes.push("Both elbow and shoulder in early rehab — no pressing allowed this session.");
  }

  return notes.join(" ");
}
