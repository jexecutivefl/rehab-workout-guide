import type { Milestone } from "@/types/index";

/**
 * Static milestone data for injury rehabilitation tracking.
 * 5 milestones per injury type, spanning stages 1-4.
 */

export const milestones: Milestone[] = [
  // ─── Plantar Fasciitis Milestones ────────────────────────────

  {
    id: "pf-m1-pain-free-seated",
    injuryType: "PLANTAR_FASCIITIS",
    label: "Pain-Free Seated Rehab",
    requiredStage: 1,
    unlocks: "Seated calf raises and towel curls without pain",
    achieved: false,
  },
  {
    id: "pf-m2-standing-tolerance",
    injuryType: "PLANTAR_FASCIITIS",
    label: "Standing Tolerance (5 min)",
    requiredStage: 2,
    unlocks: "Short-duration standing exercises with arch support",
    achieved: false,
  },
  {
    id: "pf-m3-elliptical-cleared",
    injuryType: "PLANTAR_FASCIITIS",
    label: "Elliptical Cleared",
    requiredStage: 3,
    unlocks: "Elliptical trainer and moderate standing exercises",
    achieved: false,
  },
  {
    id: "pf-m4-walking-30min",
    injuryType: "PLANTAR_FASCIITIS",
    label: "30-Minute Pain-Free Walking",
    requiredStage: 3,
    unlocks: "Incline treadmill walking and extended standing work",
    achieved: false,
  },
  {
    id: "pf-m5-full-clearance",
    injuryType: "PLANTAR_FASCIITIS",
    label: "Full Activity Clearance",
    requiredStage: 4,
    unlocks: "All exercises including running and plyometrics (with insoles)",
    achieved: false,
  },

  // ─── Sprained Elbow Milestones ──────────────────────────────

  {
    id: "elbow-m1-isometric-hold",
    injuryType: "SPRAINED_ELBOW",
    label: "Pain-Free Isometric Holds",
    requiredStage: 1,
    unlocks: "Isometric elbow flexion/extension at 50% effort",
    achieved: false,
  },
  {
    id: "elbow-m2-band-resistance",
    injuryType: "SPRAINED_ELBOW",
    label: "Band Resistance Cleared",
    requiredStage: 2,
    unlocks: "Resistance band curls, rotations, and light neutral-grip work",
    achieved: false,
  },
  {
    id: "elbow-m3-light-pressing",
    injuryType: "SPRAINED_ELBOW",
    label: "Light Bilateral Pressing",
    requiredStage: 3,
    unlocks: "Machine chest press and shoulder press at 60% weight (no lockout)",
    achieved: false,
  },
  {
    id: "elbow-m4-moderate-pulling",
    injuryType: "SPRAINED_ELBOW",
    label: "Moderate Pull Exercises",
    requiredStage: 3,
    unlocks: "Lat pulldown and seated row at moderate weight with straps",
    achieved: false,
  },
  {
    id: "elbow-m5-full-clearance",
    injuryType: "SPRAINED_ELBOW",
    label: "Full Upper Body Clearance",
    requiredStage: 4,
    unlocks: "All upper body exercises (avoid full lockout under heavy load)",
    achieved: false,
  },

  // ─── Shoulder Instability Milestones ───────────────────────────

  {
    id: "shoulder-m1-isometric-hold",
    injuryType: "SHOULDER_INSTABILITY",
    label: "Pain-Free Isometric Holds",
    requiredStage: 1,
    unlocks: "Isometric rotator cuff ER/IR at 50% effort",
    achieved: false,
  },
  {
    id: "shoulder-m2-band-resistance",
    injuryType: "SHOULDER_INSTABILITY",
    label: "Band Resistance Cleared",
    requiredStage: 2,
    unlocks: "Band ER/IR, pull-aparts, wall slides, scapular control work",
    achieved: false,
  },
  {
    id: "shoulder-m3-light-overhead",
    injuryType: "SHOULDER_INSTABILITY",
    label: "Light Overhead Cleared",
    requiredStage: 3,
    unlocks: "Light shoulder press (machine), lateral raises with light weight",
    achieved: false,
  },
  {
    id: "shoulder-m4-moderate-push",
    injuryType: "SHOULDER_INSTABILITY",
    label: "Moderate Push Exercises",
    requiredStage: 3,
    unlocks: "Machine chest press at 60% weight, bilateral pressing only",
    achieved: false,
  },
  {
    id: "shoulder-m5-full-clearance",
    injuryType: "SHOULDER_INSTABILITY",
    label: "Full Shoulder Clearance",
    requiredStage: 4,
    unlocks: "All shoulder exercises with scapular warmup before pressing",
    achieved: false,
  },
];
