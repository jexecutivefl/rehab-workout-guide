import type { DailyCheckIn } from "@/types/index";

/**
 * Readiness Score Calculator
 *
 * Computes a 0-100 readiness score from daily check-in data.
 * Used to determine workout intensity adjustments.
 *
 * Thresholds:
 *   ≤30: Rest day recommended
 *   31-50: Active recovery only
 *   51-70: Modified training (reduced volume)
 *   71-85: Normal training
 *   86-100: Good day — allow progression
 */

// ─── Weights ─────────────────────────────────────────────────

const WEIGHT_PAIN = 0.4;
const WEIGHT_ENERGY = 0.3;
const WEIGHT_SLEEP = 0.2;
const WEIGHT_STIFFNESS = 0.1;

// ─── Public API ──────────────────────────────────────────────

/**
 * Calculate readiness score (0-100) from check-in data.
 */
export function calculateReadiness(checkIn: Pick<
  DailyCheckIn,
  "elbowPain" | "shoulderPain" | "footPain" | "energyLevel" | "sleepQuality" | "stiffnessLevel"
>): number {
  const worstPain = Math.max(checkIn.elbowPain, checkIn.shoulderPain, checkIn.footPain);
  const painScore = (10 - worstPain) / 10;
  const energyScore = checkIn.energyLevel / 10;
  const sleepScore = checkIn.sleepQuality / 10;
  const stiffnessScore = (10 - checkIn.stiffnessLevel) / 10;

  const raw =
    painScore * WEIGHT_PAIN +
    energyScore * WEIGHT_ENERGY +
    sleepScore * WEIGHT_SLEEP +
    stiffnessScore * WEIGHT_STIFFNESS;

  return Math.round(raw * 100);
}

/**
 * Get a human-readable readiness level from a score.
 */
export function getReadinessLevel(score: number): {
  level: "rest" | "recovery" | "modified" | "normal" | "good";
  label: string;
  description: string;
} {
  if (score <= 30) {
    return {
      level: "rest",
      label: "Rest Day",
      description: "Your body needs recovery. Rest or very gentle movement only.",
    };
  }
  if (score <= 50) {
    return {
      level: "recovery",
      label: "Active Recovery",
      description: "Light rehab exercises and gentle cardio only. No strength work.",
    };
  }
  if (score <= 70) {
    return {
      level: "modified",
      label: "Modified Training",
      description: "Reduced volume and intensity. Stick to safe exercises.",
    };
  }
  if (score <= 85) {
    return {
      level: "normal",
      label: "Normal Training",
      description: "Follow your planned workout. Monitor pain as usual.",
    };
  }
  return {
    level: "good",
    label: "Feeling Strong",
    description: "Good day for pushing progression. Extra set on compounds allowed.",
  };
}
