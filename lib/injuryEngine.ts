import type { InjuryContext, SafetyResult, ExerciseSafety } from "@/types/index";

/**
 * Injury Engine — the most critical piece of logic in this app.
 *
 * NEVER inline safety logic in components — always import from this file.
 * Every exercise MUST pass evaluateExerciseSafety() before rendering to the user.
 * Bedrock/Lambda output is NOT exempt — filter through this engine before returning.
 */

// ─── Contraindication → Injury Mapping ────────────────────────

/** Contraindications that affect Plantar Fasciitis */
const PF_CONTRAINDICATIONS = [
  "impact",
  "standing_extended",
  "plyometric",
  "running",
] as const;

/** Contraindications that affect Sprained Elbow */
const ELBOW_CONTRAINDICATIONS = [
  "loaded_elbow_flexion",
  "grip_heavy",
  "push_heavy",
  "full_lockout",
] as const;

/** Movement patterns related to the elbow */
const ELBOW_MOVEMENTS = [
  "elbow_flexion",
  "elbow_extension",
  "horizontal_push",
  "vertical_push",
  "horizontal_pull",
  "vertical_pull",
  "grip",
] as const;

/** Movement patterns related to standing / feet */
const STANDING_MOVEMENTS = [
  "walking",
  "running",
  "squat",
  "standing_extended",
] as const;

// ─── Core Safety Evaluation ───────────────────────────────────

/**
 * Evaluate whether an exercise is safe given the user's current injury context.
 * Returns the MOST restrictive result across all injuries.
 */
export function evaluateExerciseSafety(
  name: string,
  movements: string[],
  contraindications: string[],
  ctx: InjuryContext
): SafetyResult {
  const pfResult = evaluatePF(name, movements, contraindications, ctx.plantarFasciitis);
  const elbowResult = evaluateElbow(name, movements, contraindications, ctx.sprainedElbow);

  // Return the most restrictive result
  return mostRestrictive(pfResult, elbowResult);
}

// ─── Plantar Fasciitis Rules ──────────────────────────────────

function evaluatePF(
  _name: string,
  movements: string[],
  contraindications: string[],
  pf: InjuryContext["plantarFasciitis"]
): SafetyResult {
  const hasPFContra = contraindications.some((c) =>
    (PF_CONTRAINDICATIONS as readonly string[]).includes(c)
  );
  const hasImpact = contraindications.includes("impact");
  const hasPlyometric = contraindications.includes("plyometric");
  const hasRunning = contraindications.includes("running");
  const hasStandingExtended = contraindications.includes("standing_extended");
  const hasStandingMovement = movements.some((m) =>
    (STANDING_MOVEMENTS as readonly string[]).includes(m)
  );

  if (pf.painLevel >= 7) {
    if (hasPFContra || hasStandingMovement) {
      return {
        safety: "FLAG_PAIN",
        reason: `PF pain level ${pf.painLevel}/10 — avoid all weight-bearing exercises`,
      };
    }
  }

  switch (pf.stage) {
    case 1:
      // Stage 1: AVOID all impact + standing exercises. MODIFY seated-only variants.
      if (hasImpact || hasPlyometric || hasRunning) {
        return {
          safety: "AVOID",
          reason: "PF Stage 1: No impact, jumping, or running",
        };
      }
      if (hasStandingExtended || hasStandingMovement) {
        return {
          safety: "AVOID",
          reason: "PF Stage 1: No standing exercises",
        };
      }
      // Seated exercises that have PF contra get modified
      if (hasPFContra) {
        return {
          safety: "MODIFIED",
          reason: "PF Stage 1: Seated variant only",
          modification: "Perform seated. No weight bearing on feet.",
        };
      }
      return { safety: "SAFE" };

    case 2:
      // Stage 2: AVOID impact. MODIFY to seated variants only. Standing short duration OK with arch support.
      if (hasImpact || hasPlyometric || hasRunning) {
        return {
          safety: "AVOID",
          reason: "PF Stage 2: No impact, jumping, or running",
        };
      }
      if (hasStandingExtended) {
        return {
          safety: "MODIFIED",
          reason: "PF Stage 2: Limited standing with arch support",
          modification: "Short duration only. Use arch support insoles. Stop if pain increases.",
        };
      }
      if (hasStandingMovement) {
        return {
          safety: "MODIFIED",
          reason: "PF Stage 2: Seated preferred, limited standing OK",
          modification: "Use arch support insoles. Limit standing sets. Switch to seated if pain increases.",
        };
      }
      return { safety: "SAFE" };

    case 3:
      // Stage 3: Elliptical OK. Limited standing. No running/jumping.
      if (hasRunning) {
        return {
          safety: "AVOID",
          reason: "PF Stage 3: No running yet",
        };
      }
      if (hasPlyometric) {
        return {
          safety: "AVOID",
          reason: "PF Stage 3: No jumping/plyometrics",
        };
      }
      if (hasImpact) {
        return {
          safety: "AVOID",
          reason: "PF Stage 3: No high-impact activities",
        };
      }
      if (hasStandingExtended) {
        return {
          safety: "MODIFIED",
          reason: "PF Stage 3: Standing OK with arch support",
          modification: "Use arch support insoles. Monitor pain during and after.",
        };
      }
      return { safety: "SAFE" };

    case 4:
      // Stage 4: Full clearance. Note on all standing exercises.
      if (hasStandingExtended || hasStandingMovement) {
        return {
          safety: "SAFE",
          modification: "Use arch support insoles",
        };
      }
      return { safety: "SAFE" };

    default:
      return { safety: "SAFE" };
  }
}

// ─── Sprained Elbow Rules ─────────────────────────────────────

function evaluateElbow(
  _name: string,
  movements: string[],
  contraindications: string[],
  elbow: InjuryContext["sprainedElbow"]
): SafetyResult {
  const hasElbowContra = contraindications.some((c) =>
    (ELBOW_CONTRAINDICATIONS as readonly string[]).includes(c)
  );
  const hasElbowMovement = movements.some((m) =>
    (ELBOW_MOVEMENTS as readonly string[]).includes(m)
  );
  const hasLoadedFlexion = contraindications.includes("loaded_elbow_flexion");
  const hasGripHeavy = contraindications.includes("grip_heavy");
  const hasPushHeavy = contraindications.includes("push_heavy");
  const hasFullLockout = contraindications.includes("full_lockout");

  if (elbow.painLevel >= 7) {
    if (hasElbowContra || hasElbowMovement) {
      return {
        safety: "FLAG_PAIN",
        reason: `Elbow pain level ${elbow.painLevel}/10 — avoid all arm exercises`,
      };
    }
  }

  switch (elbow.stage) {
    case 1:
      // Stage 1: AVOID all loaded elbow flex/ext, grip-heavy, push exercises. No pulling.
      if (hasLoadedFlexion || hasGripHeavy || hasPushHeavy || hasFullLockout) {
        return {
          safety: "AVOID",
          reason: "Elbow Stage 1: No loaded elbow, grip, or push exercises",
        };
      }
      if (hasElbowMovement) {
        return {
          safety: "AVOID",
          reason: "Elbow Stage 1: No pulling or pressing movements",
        };
      }
      return { safety: "SAFE" };

    case 2:
      // Stage 2: MODIFY to bands + neutral grip only. Light weight only.
      if (hasGripHeavy || hasPushHeavy) {
        return {
          safety: "AVOID",
          reason: "Elbow Stage 2: No heavy grip or push exercises",
        };
      }
      if (hasLoadedFlexion || hasFullLockout) {
        return {
          safety: "MODIFIED",
          reason: "Elbow Stage 2: Light resistance only",
          modification: "Use bands or very light weight. Neutral grip only. Stop if pain > 3.",
        };
      }
      if (hasElbowMovement) {
        return {
          safety: "MODIFIED",
          reason: "Elbow Stage 2: Light weight, neutral grip",
          modification: "Use bands or very light weight. Neutral grip only. Limit ROM if needed.",
        };
      }
      return { safety: "SAFE" };

    case 3:
      // Stage 3: MODIFY bilateral pressing with 40% weight reduction. No full lockout.
      if (hasFullLockout) {
        return {
          safety: "MODIFIED",
          reason: "Elbow Stage 3: No full lockout under load",
          modification: "Stop just short of full lockout. Reduce weight 40% from normal.",
        };
      }
      if (hasPushHeavy) {
        return {
          safety: "MODIFIED",
          reason: "Elbow Stage 3: Reduced load pressing",
          modification: "Bilateral pressing only. Reduce weight 40%. No unilateral pressing on affected side.",
        };
      }
      if (hasGripHeavy) {
        return {
          safety: "MODIFIED",
          reason: "Elbow Stage 3: Moderate grip OK",
          modification: "Moderate weight only. Use straps if needed to reduce grip demand.",
        };
      }
      if (hasLoadedFlexion) {
        return {
          safety: "MODIFIED",
          reason: "Elbow Stage 3: Moderate load elbow flexion OK",
          modification: "Moderate weight. Reduce 40% from normal. Neutral grip preferred.",
        };
      }
      return { safety: "SAFE" };

    case 4:
      // Stage 4: Full clearance. Note: "Avoid full lockout under heavy load."
      if (hasFullLockout) {
        return {
          safety: "SAFE",
          modification: "Avoid full lockout under heavy load",
        };
      }
      return { safety: "SAFE" };

    default:
      return { safety: "SAFE" };
  }
}

// ─── Session Flagging ─────────────────────────────────────────

/**
 * Determine if a session should be flagged / paused before starting.
 * This check is NON-NEGOTIABLE — pain >= 7 must ALWAYS trigger a flag.
 */
export function shouldFlagSession(
  preSessionPain: number,
  preEnergy: number,
  recentSessions: { postPain: number }[]
): { flag: boolean; reason: string } {
  // Pain threshold check
  if (preSessionPain >= 7) {
    return {
      flag: true,
      reason: `Pre-session pain is ${preSessionPain}/10. Rest recommended. Consult provider if persistent.`,
    };
  }

  // Wegovy / GLP-1 fatigue risk
  if (preEnergy <= 3) {
    return {
      flag: true,
      reason: `Energy level is ${preEnergy}/10. Possible GLP-1 fatigue. Consider rest or active recovery only.`,
    };
  }

  // Pain trending up — check last 3 consecutive sessions
  if (recentSessions.length >= 3) {
    const lastThree = recentSessions.slice(-3);
    const allTrendingUp = lastThree.every((s) => s.postPain - preSessionPain >= 2);
    if (allTrendingUp) {
      return {
        flag: true,
        reason:
          "Pain trending up: post-session pain exceeded pre-session pain by 2+ for 3 consecutive sessions. Consider deload or rest.",
      };
    }
  }

  return { flag: false, reason: "" };
}

// ─── Active Restrictions ──────────────────────────────────────

/**
 * Get a list of currently active restrictions based on injury context.
 * Useful for UI display and plan generation filtering.
 */
export function getActiveRestrictions(ctx: InjuryContext): string[] {
  const restrictions: string[] = [];

  // Plantar Fasciitis restrictions
  const pf = ctx.plantarFasciitis;
  switch (pf.stage) {
    case 1:
      restrictions.push("PF: No impact, standing, or weight-bearing exercises");
      restrictions.push("PF: Seated variants only");
      break;
    case 2:
      restrictions.push("PF: No impact or running");
      restrictions.push("PF: Limited standing with arch support");
      restrictions.push("PF: Seated preferred");
      break;
    case 3:
      restrictions.push("PF: No running or plyometrics");
      restrictions.push("PF: Elliptical OK, limited standing with arch support");
      break;
    case 4:
      restrictions.push("PF: Cleared — use arch support insoles for standing exercises");
      break;
  }
  if (pf.painLevel >= 5) {
    restrictions.push(`PF: Elevated pain (${pf.painLevel}/10) — monitor closely`);
  }

  // Sprained Elbow restrictions
  const elbow = ctx.sprainedElbow;
  switch (elbow.stage) {
    case 1:
      restrictions.push("Elbow: No loaded elbow flex/ext, grip, push, or pull exercises");
      restrictions.push("Elbow: Isometric rehab only");
      break;
    case 2:
      restrictions.push("Elbow: Bands and neutral grip only");
      restrictions.push("Elbow: Light weight, no heavy grip or push");
      break;
    case 3:
      restrictions.push("Elbow: Bilateral pressing with 40% weight reduction");
      restrictions.push("Elbow: No full lockout under load");
      restrictions.push("Elbow: Moderate grip OK with straps");
      break;
    case 4:
      restrictions.push("Elbow: Cleared — avoid full lockout under heavy load");
      break;
  }
  if (elbow.painLevel >= 5) {
    restrictions.push(`Elbow: Elevated pain (${elbow.painLevel}/10) — monitor closely`);
  }

  return restrictions;
}

// ─── Internal Helpers ─────────────────────────────────────────

const SAFETY_RANK: Record<ExerciseSafety, number> = {
  SAFE: 0,
  MODIFIED: 1,
  FLAG_PAIN: 2,
  AVOID: 3,
};

/** Return the most restrictive of two safety results. */
function mostRestrictive(a: SafetyResult, b: SafetyResult): SafetyResult {
  const rankA = SAFETY_RANK[a.safety];
  const rankB = SAFETY_RANK[b.safety];

  if (rankA >= rankB) {
    // If both have modifications, combine them
    if (rankA === rankB && a.modification && b.modification && a.safety === "MODIFIED") {
      return {
        ...a,
        modification: `${a.modification}; ${b.modification}`,
        reason: [a.reason, b.reason].filter(Boolean).join("; "),
      };
    }
    return a;
  }

  return b;
}
