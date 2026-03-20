import type { Schema } from "@/amplify/data/resource";

/**
 * Shared type definitions — source of truth for the entire app.
 * All agents/components read from here. Never define these types locally.
 */

// Re-export schema types
export type { Schema };

// ─── Core Enums ──────────────────────────────────────────────
export type InjurySide = "LEFT" | "RIGHT" | "BILATERAL";
export type InjuryStage = 1 | 2 | 3 | 4;
export type ExerciseSafety = "SAFE" | "MODIFIED" | "AVOID" | "FLAG_PAIN";
export type SessionType =
  | "UPPER_BODY"
  | "LOWER_BODY"
  | "FULL_BODY"
  | "REHAB_FOCUSED"
  | "CARDIO_ONLY"
  | "ACTIVE_RECOVERY"
  | "REST";
export type GymLocation =
  | "LA_FITNESS"
  | "PLANET_FITNESS"
  | "HOME"
  | "OTHER";
export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
export type ExerciseCategory =
  | "WARMUP"
  | "STRENGTH"
  | "CARDIO"
  | "REHAB"
  | "STRETCH"
  | "CORE"
  | "COOLDOWN";
export type InjuryType = "PLANTAR_FASCIITIS" | "SPRAINED_ELBOW" | "SHOULDER_INSTABILITY";

// ─── Injury Context ──────────────────────────────────────────
export type InjuryContext = {
  plantarFasciitis: { stage: InjuryStage; painLevel: number; side: "RIGHT" };
  sprainedElbow: { stage: InjuryStage; painLevel: number; side: "LEFT" };
  shoulderInstability: { stage: InjuryStage; painLevel: number; side: "LEFT" };
};

// ─── Daily Check-In ──────────────────────────────────────────
export type DailyCheckIn = {
  date: string;
  overallPain: number;        // 0-10
  elbowPain: number;          // 0-10
  shoulderPain: number;       // 0-10
  footPain: number;           // 0-10
  energyLevel: number;        // 1-10
  sleepQuality: number;       // 1-10
  stiffnessLevel: number;     // 0-10
  readinessScore: number;     // computed: weighted avg (0-100)
  notes?: string;
};

export type SafetyResult = {
  safety: ExerciseSafety;
  reason?: string;
  modification?: string;
};

// ─── Exercise & Workout Planning ─────────────────────────────
export type PlannedExercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscles: string[];
  sets?: number;
  repsMin?: number;
  repsMax?: number;
  durationSec?: number;
  restSec: number;
  weightLbs?: number;
  rpeTarget?: number;
  formCues: string[];
  isRehab: boolean;
  safetyResult: SafetyResult;
  orderIndex: number;
  wgerId?: number;
};

export type DayPlan = {
  day: DayOfWeek;
  sessionType: SessionType;
  exercises: PlannedExercise[];
  notes?: string;
};

// ─── Active Session ──────────────────────────────────────────
export type ActiveSession = {
  sessionId: string;
  plannedSessionId?: string;
  startedAt: Date;
  gym: GymLocation;
  exercises: PlannedExercise[];
  currentExerciseIndex: number;
  completedExercises: CompletedExercise[];
  preSessionPain: number;
  preSessionEnergy: number;
};

export type CompletedExercise = {
  exerciseId: string;
  name: string;
  sets: CompletedSet[];
  painDuring: number;
  wasModified: boolean;
  modificationNote?: string;
  wasSkipped: boolean;
};

export type CompletedSet = {
  setNumber: number;
  reps?: number;
  weightLbs?: number;
  durationSec?: number;
  rpe: number;
  romPct?: number; // range of motion %, key for elbow rehab tracking
  pain: number;
};

// ─── Milestones ──────────────────────────────────────────────
export type Milestone = {
  id: string;
  injuryType: InjuryType;
  label: string;
  requiredStage: InjuryStage;
  unlocks: string;
  achieved: boolean;
  achievedAt?: Date;
};

// ─── Exercise Pool ───────────────────────────────────────────
export type ExerciseDefinition = {
  id: string;
  name: string;
  category: ExerciseCategory;
  movements: string[];
  muscles: string[];
  contraindications: string[];
  equipment: GymLocation[];
  isRehab: boolean;
  defaultSets?: number;
  defaultRepsMin?: number;
  defaultRepsMax?: number;
  defaultDurationSec?: number;
  defaultRestSec: number;
  formCues: string[];
  wgerId?: number;
};

// ─── Progression ─────────────────────────────────────────────
export type ProgressionSuggestion = {
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  suggestedWeight: number;
  increment: number;
  reason: string;
};

// ─── User Profile (app-level) ────────────────────────────────
export type UserProfileData = {
  weightLbs: number;
  heightIn?: number;
  age: number;
  gymPreference: GymLocation;
  onWegovy: boolean;
  wegovyStartDate?: string;
};

// ─── DB convenience types ────────────────────────────────────
export type UserProfile = Schema["UserProfile"]["type"];
export type ActiveInjuryRecord = Schema["ActiveInjury"]["type"];
export type RehabMilestoneRecord = Schema["RehabMilestone"]["type"];
export type WorkoutPlanRecord = Schema["WorkoutPlan"]["type"];
export type PlannedSessionRecord = Schema["PlannedSession"]["type"];
export type WorkoutSessionRecord = Schema["WorkoutSession"]["type"];
export type CompletedExerciseRecord = Schema["CompletedExerciseRecord"]["type"];
export type CompletedSetRecord = Schema["CompletedSetRecord"]["type"];
export type BodyMetricRecord = Schema["BodyMetric"]["type"];
