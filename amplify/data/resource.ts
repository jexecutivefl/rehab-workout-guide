import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * RehabTrack Data Schema
 *
 * Models: UserProfile, ActiveInjury, RehabMilestone, WorkoutPlan,
 *         PlannedSession, WorkoutSession, CompletedExercise, CompletedSet,
 *         BodyMetric
 *
 * Resource budget: 9 models (removed Task). Each model ~20-30 CF resources.
 * Estimated total: ~250 resources — well under the 500 limit.
 */

const schema = a.schema({
  // ─── User & Injury ────────────────────────────────────────

  UserProfile: a
    .model({
      email: a.string().required(),
      displayName: a.string(),
      weightLbs: a.float(),
      heightIn: a.float(),
      age: a.integer(),
      gymPreference: a.enum(["LA_FITNESS", "PLANET_FITNESS", "HOME", "OTHER"]),
      onWegovy: a.boolean(),
      wegovyStartDate: a.date(),
      onboardingComplete: a.boolean(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  ActiveInjury: a
    .model({
      injuryType: a.enum(["PLANTAR_FASCIITIS", "SPRAINED_ELBOW", "SHOULDER_INSTABILITY"]),
      side: a.enum(["LEFT", "RIGHT", "BILATERAL"]),
      stage: a.integer().required(), // 1-4
      currentPainLevel: a.integer(), // 0-10
      onsetDate: a.date(),
      lastAssessedAt: a.datetime(),
      notes: a.string(),
      restrictions: a.string(), // JSON array of restriction strings
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  RehabMilestone: a
    .model({
      injuryType: a.enum(["PLANTAR_FASCIITIS", "SPRAINED_ELBOW", "SHOULDER_INSTABILITY"]),
      milestoneKey: a.string().required(), // e.g. "pf_stage2_standing"
      label: a.string().required(),
      requiredStage: a.integer().required(),
      unlocks: a.string(),
      achieved: a.boolean(),
      achievedAt: a.datetime(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  // ─── Workout Planning ─────────────────────────────────────

  WorkoutPlan: a
    .model({
      weekNumber: a.integer().required(), // 1-4
      startDate: a.date().required(),
      endDate: a.date(),
      status: a.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]),
      injuryContextSnapshot: a.string(), // JSON snapshot of InjuryContext at plan time
      sessions: a.hasMany("PlannedSession", "workoutPlanId"),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  PlannedSession: a
    .model({
      workoutPlanId: a.string().required(),
      workoutPlan: a.belongsTo("WorkoutPlan", "workoutPlanId"),
      dayOfWeek: a.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
      sessionType: a.enum([
        "UPPER_BODY",
        "LOWER_BODY",
        "FULL_BODY",
        "REHAB_FOCUSED",
        "CARDIO_ONLY",
        "ACTIVE_RECOVERY",
        "REST",
      ]),
      exercises: a.string(), // JSON array of PlannedExercise[]
      notes: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  // ─── Workout Sessions (Completed) ─────────────────────────

  WorkoutSession: a
    .model({
      plannedSessionId: a.string(),
      sessionType: a.enum([
        "UPPER_BODY",
        "LOWER_BODY",
        "FULL_BODY",
        "REHAB_FOCUSED",
        "CARDIO_ONLY",
        "ACTIVE_RECOVERY",
        "REST",
      ]),
      gym: a.enum(["LA_FITNESS", "PLANET_FITNESS", "HOME", "OTHER"]),
      startedAt: a.datetime().required(),
      completedAt: a.datetime(),
      durationMinutes: a.integer(),
      preSessionPainLevel: a.integer(), // 0-10
      postSessionPainLevel: a.integer(), // 0-10
      preSessionEnergy: a.integer(), // 1-10
      postSessionEnergy: a.integer(), // 1-10
      flaggedForReview: a.boolean(),
      flagReason: a.string(),
      notes: a.string(),
      completedExercises: a.hasMany("CompletedExerciseRecord", "workoutSessionId"),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  CompletedExerciseRecord: a
    .model({
      workoutSessionId: a.string().required(),
      workoutSession: a.belongsTo("WorkoutSession", "workoutSessionId"),
      exerciseId: a.string().required(), // references exercise pool ID
      exerciseName: a.string().required(),
      orderIndex: a.integer(),
      painDuring: a.integer(), // 0-10
      wasModified: a.boolean(),
      modificationNote: a.string(),
      wasSkipped: a.boolean(),
      skipReason: a.string(),
      sets: a.hasMany("CompletedSetRecord", "completedExerciseRecordId"),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  CompletedSetRecord: a
    .model({
      completedExerciseRecordId: a.string().required(),
      completedExerciseRecord: a.belongsTo(
        "CompletedExerciseRecord",
        "completedExerciseRecordId"
      ),
      setNumber: a.integer().required(),
      reps: a.integer(),
      weightLbs: a.float(),
      durationSec: a.integer(),
      rpe: a.integer(), // 1-10
      romPct: a.integer(), // 0-100, elbow ROM tracking
      pain: a.integer(), // 0-10
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  // ─── Body Metrics ─────────────────────────────────────────

  BodyMetric: a
    .model({
      date: a.date().required(),
      weightLbs: a.float(),
      bodyFatPct: a.float(),
      waistIn: a.float(),
      notes: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
