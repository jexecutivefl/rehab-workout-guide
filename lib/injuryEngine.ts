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

/** Contraindications that affect Shoulder Instability */
const SHOULDER_CONTRAINDICATIONS = [
  "overhead_load",
  "shoulder_internal_rotation_load",
  "push_heavy",
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

/** Movement patterns related to the shoulder */
const SHOULDER_MOVEMENTS = [
  "vertical_push",
  "horizontal_push",
  "shoulder_abduction",
  "shoulder_flexion",
  "shoulder_external_rotation",
  "shoulder_internal_rotation",
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
  const shoulderResult = evaluateShoulder(name, movements, contraindications, ctx.shoulderInstability);

  // Combine all injury results — most restrictive wins
  let result = mostRestrictive(pfResult, mostRestrictive(elbowResult, shoulderResult));

  // Apply elbow-shoulder compensation risk post-processing
  result = applyCompensationRisk(result, movements, ctx);

  return result;
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

// ─── Shoulder Instability Rules ───────────────────────────────

function evaluateShoulder(
  _name: string,
  movements: string[],
  contraindications: string[],
  shoulder: InjuryContext["shoulderInstability"]
): SafetyResult {
  const hasShoulderContra = contraindications.some((c) =>
    (SHOULDER_CONTRAINDICATIONS as readonly string[]).includes(c)
  );
  const hasShoulderMovement = movements.some((m) =>
    (SHOULDER_MOVEMENTS as readonly string[]).includes(m)
  );
  const hasOverhead = contraindications.includes("overhead_load");
  const hasPushHeavy = contraindications.includes("push_heavy");
  const hasShoulderIRLoad = contraindications.includes("shoulder_internal_rotation_load");
  const hasVerticalPush = movements.includes("vertical_push");
  const hasHorizontalPush = movements.includes("horizontal_push");
  const hasShoulderAbduction = movements.includes("shoulder_abduction");

  if (shoulder.painLevel >= 7) {
    if (hasShoulderContra || hasShoulderMovement) {
      return {
        safety: "FLAG_PAIN",
        reason: `Shoulder pain level ${shoulder.painLevel}/10 — avoid all shoulder exercises`,
      };
    }
  }

  switch (shoulder.stage) {
    case 1:
      // Stage 1: AVOID all overhead, push, and loaded shoulder movements.
      // SAFE: isometric rotator cuff, scapular retraction (no load)
      if (hasOverhead || hasPushHeavy || hasShoulderIRLoad) {
        return {
          safety: "AVOID",
          reason: "Shoulder Stage 1: No overhead, push, or loaded shoulder exercises",
        };
      }
      if (hasVerticalPush || hasHorizontalPush) {
        return {
          safety: "AVOID",
          reason: "Shoulder Stage 1: No pressing movements",
        };
      }
      if (hasShoulderAbduction) {
        return {
          safety: "AVOID",
          reason: "Shoulder Stage 1: No loaded shoulder abduction",
        };
      }
      if (hasShoulderMovement) {
        return {
          safety: "MODIFIED",
          reason: "Shoulder Stage 1: Isometric only",
          modification: "Isometric holds only. No movement under load. Stop if pain > 2.",
        };
      }
      return { safety: "SAFE" };

    case 2:
      // Stage 2: AVOID overhead load. MODIFY horizontal push to bands only.
      // SAFE: rotator cuff bands, scapular control, wall slides.
      if (hasOverhead || hasVerticalPush) {
        return {
          safety: "AVOID",
          reason: "Shoulder Stage 2: No overhead exercises",
        };
      }
      if (hasPushHeavy) {
        return {
          safety: "AVOID",
          reason: "Shoulder Stage 2: No heavy pushing",
        };
      }
      if (hasHorizontalPush) {
        return {
          safety: "MODIFIED",
          reason: "Shoulder Stage 2: Light resistance only",
          modification: "Bands or very light weight only. Pain must stay below 3. Stop immediately if sharp pain.",
        };
      }
      if (hasShoulderAbduction) {
        return {
          safety: "MODIFIED",
          reason: "Shoulder Stage 2: Light abduction only",
          modification: "Very light weight (2-3 lbs max). Controlled movement. Stop if pain > 3.",
        };
      }
      if (hasShoulderIRLoad) {
        return {
          safety: "MODIFIED",
          reason: "Shoulder Stage 2: Light bands only for rotation",
          modification: "Use light resistance band. Controlled tempo. Elbow pinned to side.",
        };
      }
      return { safety: "SAFE" };

    case 3:
      // Stage 3: MODIFY overhead to light weight. MODIFY horizontal push to moderate.
      // SAFE: face pulls, lateral raises (light), rotator cuff work.
      if (hasOverhead) {
        return {
          safety: "MODIFIED",
          reason: "Shoulder Stage 3: Light overhead only",
          modification: "Light weight only. No behind-neck movements. Stop short of full lockout.",
        };
      }
      if (hasPushHeavy) {
        return {
          safety: "MODIFIED",
          reason: "Shoulder Stage 3: Moderate pressing",
          modification: "Bilateral only. Reduce weight 30% from normal. No flared elbows.",
        };
      }
      if (hasVerticalPush) {
        return {
          safety: "MODIFIED",
          reason: "Shoulder Stage 3: Light overhead pressing",
          modification: "Light weight, machine preferred. No dumbbells overhead yet.",
        };
      }
      if (hasShoulderIRLoad) {
        return {
          safety: "MODIFIED",
          reason: "Shoulder Stage 3: Moderate rotation work",
          modification: "Moderate band resistance. Controlled tempo throughout.",
        };
      }
      return { safety: "SAFE" };

    case 4:
      // Stage 4: Full clearance with scapular warmup recommendation.
      if (hasOverhead || hasVerticalPush || hasPushHeavy) {
        return {
          safety: "SAFE",
          modification: "Perform scapular warmup before heavy pressing. Monitor shoulder fatigue.",
        };
      }
      return { safety: "SAFE" };

    default:
      return { safety: "SAFE" };
  }
}

// ─── Elbow-Shoulder Compensation Risk ────────────────────────

/**
 * Post-processing step: when both elbow and shoulder are injured,
 * prevent compensation patterns that could worsen either injury.
 */
function applyCompensationRisk(
  baseResult: SafetyResult,
  movements: string[],
  ctx: InjuryContext
): SafetyResult {
  const elbowStage = ctx.sprainedElbow.stage;
  const shoulderStage = ctx.shoulderInstability.stage;

  // If both elbow AND shoulder are in acute/early phases, block all pressing
  const hasPressMovement = movements.some((m) =>
    ["horizontal_push", "vertical_push"].includes(m)
  );

  if (elbowStage <= 2 && shoulderStage <= 2 && hasPressMovement) {
    if (baseResult.safety !== "AVOID") {
      return {
        safety: "AVOID",
        reason: "Both elbow and shoulder in early rehab — no pressing until one reaches stage 3",
      };
    }
  }

  // If elbow is lagging behind shoulder, warn about shoulder compensation
  if (elbowStage < shoulderStage && baseResult.safety === "MODIFIED" && hasPressMovement) {
    return {
      ...baseResult,
      modification: baseResult.modification
        ? `${baseResult.modification}; Elbow is more restricted — do not shift load to shoulder to compensate.`
        : "Elbow is more restricted — do not shift load to shoulder to compensate.",
    };
  }

  // If shoulder is lagging behind elbow, warn about elbow/grip compensation
  const hasGripMovement = movements.some((m) => ["grip", "horizontal_pull", "vertical_pull"].includes(m));
  if (shoulderStage < elbowStage && baseResult.safety === "MODIFIED" && hasGripMovement) {
    return {
      ...baseResult,
      modification: baseResult.modification
        ? `${baseResult.modification}; Shoulder is weaker — do not grip harder to compensate.`
        : "Shoulder is weaker — do not grip harder to compensate.",
    };
  }

  return baseResult;
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

  // Shoulder Instability restrictions
  const shoulder = ctx.shoulderInstability;
  switch (shoulder.stage) {
    case 1:
      restrictions.push("Shoulder: No overhead, push, or loaded shoulder exercises");
      restrictions.push("Shoulder: Isometric rotator cuff only");
      break;
    case 2:
      restrictions.push("Shoulder: No overhead exercises");
      restrictions.push("Shoulder: Bands and light resistance only");
      restrictions.push("Shoulder: Scapular control work OK");
      break;
    case 3:
      restrictions.push("Shoulder: Light overhead only, no behind-neck");
      restrictions.push("Shoulder: Moderate pressing with 30% weight reduction");
      restrictions.push("Shoulder: Face pulls and lateral raises OK");
      break;
    case 4:
      restrictions.push("Shoulder: Cleared — perform scapular warmup before pressing");
      break;
  }
  if (shoulder.painLevel >= 5) {
    restrictions.push(`Shoulder: Elevated pain (${shoulder.painLevel}/10) — monitor closely`);
  }

  // Compensation warnings
  if (elbow.stage <= 2 && shoulder.stage <= 2) {
    restrictions.push("COMPENSATION RISK: Both elbow and shoulder in early rehab — no pressing");
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
