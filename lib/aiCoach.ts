import type {
  InjuryContext,
  SafetyResult,
  ExerciseDefinition,
  UserProfileData,
} from "@/types/index";
import { evaluateExerciseSafety, getActiveRestrictions } from "@/lib/injuryEngine";

/**
 * AI Coach — builds context-aware prompts and filters AI exercise suggestions
 * through the injury engine before they reach the user.
 *
 * CRITICAL: Every exercise the AI suggests MUST pass evaluateExerciseSafety().
 * AVOID exercises are removed from responses. MODIFIED exercises get safety notes.
 */

// ─── System Prompt Builder ─────────────────────────────────────

export function buildSystemPrompt(
  injuryContext: InjuryContext,
  profile: UserProfileData,
  exercisePool: ExerciseDefinition[]
): string {
  const restrictions = getActiveRestrictions(injuryContext);

  const injurySummary = buildInjurySummary(injuryContext);
  const exerciseNames = exercisePool.map((e) => e.name);
  const rehabExercises = exercisePool
    .filter((e) => e.isRehab)
    .map((e) => e.name);

  return `You are a knowledgeable rehabilitation fitness coach helping a user with active injuries. Your role is to suggest safe exercises, create workout plans, and answer rehab-related questions.

## User Profile
- Weight: ${profile.weightLbs} lbs
- Age: ${profile.age}
- Gym: ${profile.gymPreference}
- On Wegovy/GLP-1: ${profile.onWegovy ? "Yes" : "No"}

## Active Injuries
${injurySummary}

## Current Restrictions
${restrictions.length > 0 ? restrictions.map((r) => `- ${r}`).join("\n") : "- No active restrictions"}

## Available Exercise Pool
When suggesting exercises, prefer these exact names from our exercise library:
${exerciseNames.join(", ")}

## Rehab-Specific Exercises
${rehabExercises.join(", ")}

## Rules
1. ALWAYS consider the user's active injuries and their current stage when suggesting exercises.
2. When suggesting exercises, use exact names from the exercise pool above when possible.
3. For each exercise, include sets, reps, and rest recommendations.
4. Flag any exercise that might need modification due to injuries.
5. Never suggest exercises that are clearly contraindicated for the user's injury stages.
6. If the user reports pain >= 7/10, recommend they rest and consult their physical therapist.
7. Include form cues and safety reminders relevant to their injuries.
8. For rehab-focused plans, prioritize exercises from the rehab-specific list.
9. When creating weekly plans, follow a periodized approach (light → volume → progressive → deload).
10. Always err on the side of caution — suggest modifications rather than skipping an exercise entirely.

## Disclaimer
You are an AI fitness coach, not a medical professional. Always recommend consulting with a healthcare provider for medical decisions. Your suggestions are filtered through a safety engine that may modify or remove exercises based on injury status.`;
}

function buildInjurySummary(ctx: InjuryContext): string {
  const lines: string[] = [];

  if (ctx.plantarFasciitis) {
    const pf = ctx.plantarFasciitis;
    lines.push(
      `- Plantar Fasciitis (${pf.side}): Stage ${pf.stage}/4, Pain ${pf.painLevel}/10`
    );
    lines.push(
      `  ${getStageDescription("PF", pf.stage)}`
    );
  }

  if (ctx.sprainedElbow) {
    const elbow = ctx.sprainedElbow;
    lines.push(
      `- Sprained Elbow (${elbow.side}): Stage ${elbow.stage}/4, Pain ${elbow.painLevel}/10`
    );
    lines.push(
      `  ${getStageDescription("ELBOW", elbow.stage)}`
    );
  }

  if (ctx.shoulderInstability) {
    const shoulder = ctx.shoulderInstability;
    lines.push(
      `- Shoulder Instability (${shoulder.side}): Stage ${shoulder.stage}/4, Pain ${shoulder.painLevel}/10`
    );
    lines.push(
      `  ${getStageDescription("SHOULDER", shoulder.stage)}`
    );
  }

  return lines.length > 0 ? lines.join("\n") : "- No active injuries";
}

function getStageDescription(
  injury: "PF" | "ELBOW" | "SHOULDER",
  stage: number
): string {
  const descriptions: Record<string, Record<number, string>> = {
    PF: {
      1: "Acute phase — avoid impact and prolonged standing",
      2: "Subacute — can do seated exercises, avoid impact",
      3: "Progressive — most exercises OK, avoid running/plyometrics",
      4: "Cleared — full activity with arch support recommendation",
    },
    ELBOW: {
      1: "Acute — avoid loaded elbow movements",
      2: "Subacute — light resistance OK, avoid heavy grip/push",
      3: "Progressive — moderate loads OK, avoid heavy lockout",
      4: "Cleared — full activity with form awareness",
    },
    SHOULDER: {
      1: "Acute — avoid overhead and internal rotation under load",
      2: "Subacute — light rotator cuff work OK, avoid heavy pressing",
      3: "Progressive — moderate pressing OK, avoid heavy overhead",
      4: "Cleared — full activity with warmup emphasis",
    },
  };

  return descriptions[injury]?.[stage] ?? "Unknown stage";
}

// ─── Exercise Name Extraction ──────────────────────────────────

/**
 * Finds exercise names in AI response text that match the exercise pool.
 * Uses case-insensitive matching against known exercise names.
 */
export function extractExerciseNames(
  aiResponse: string,
  pool: ExerciseDefinition[]
): string[] {
  const found: string[] = [];
  const responseLower = aiResponse.toLowerCase();

  for (const exercise of pool) {
    if (responseLower.includes(exercise.name.toLowerCase())) {
      found.push(exercise.name);
    }
  }

  return [...new Set(found)];
}

// ─── Safety Filtering ──────────────────────────────────────────

export type FilteredResponse = {
  safeResponse: string;
  flaggedExercises: string[];
};

/**
 * Filters AI response through the injury engine.
 * - SAFE exercises: no change
 * - MODIFIED exercises: appends modification note
 * - AVOID exercises: marks with warning, added to flagged list
 * - FLAG_PAIN exercises: appends pain warning
 */
export function filterResponseExercises(
  response: string,
  injuryContext: InjuryContext,
  pool: ExerciseDefinition[]
): FilteredResponse {
  const mentionedNames = extractExerciseNames(response, pool);
  const flaggedExercises: string[] = [];
  let safeResponse = response;

  for (const name of mentionedNames) {
    const exercise = pool.find(
      (e) => e.name.toLowerCase() === name.toLowerCase()
    );
    if (!exercise) continue;

    const result: SafetyResult = evaluateExerciseSafety(
      exercise.name,
      exercise.movements,
      exercise.contraindications,
      injuryContext
    );

    if (result.safety === "AVOID") {
      flaggedExercises.push(name);
      // Add warning after the exercise name
      safeResponse = safeResponse.replace(
        new RegExp(`(${escapeRegex(name)})`, "gi"),
        `$1 [⚠️ AVOID — ${result.reason || "contraindicated for your injuries"}]`
      );
    } else if (result.safety === "MODIFIED") {
      safeResponse = safeResponse.replace(
        new RegExp(`(${escapeRegex(name)})`, "gi"),
        `$1 [🔄 MODIFY — ${result.modification || result.reason || "use modified form"}]`
      );
    } else if (result.safety === "FLAG_PAIN") {
      safeResponse = safeResponse.replace(
        new RegExp(`(${escapeRegex(name)})`, "gi"),
        `$1 [⚠️ PAIN FLAG — ${result.reason || "monitor pain closely"}]`
      );
    }
  }

  return { safeResponse, flaggedExercises };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
