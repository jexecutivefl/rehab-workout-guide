import {
  analyzeWorkoutHistory,
  getExerciseRotationScore,
  getMuscleBalanceGaps,
} from "@/lib/workoutAnalyzer";
import type {
  CompletedSessionData,
  WorkoutAnalysis,
  SessionType,
} from "@/types/index";

// ─── Fixtures / Helpers ──────────────────────────────────────

const REFERENCE_DATE = new Date("2026-03-21T12:00:00Z");

/** Return an ISO date string N days before the reference date. */
function daysAgo(n: number): string {
  const d = new Date(REFERENCE_DATE.getTime() - n * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

/** Build a minimal CompletedSessionData with sensible defaults. */
function makeSession(overrides?: {
  date?: string;
  sessionType?: SessionType;
  exercises?: CompletedSessionData["exercises"];
}): CompletedSessionData {
  return {
    date: overrides?.date ?? daysAgo(1),
    sessionType: overrides?.sessionType ?? "UPPER_BODY",
    exercises: overrides?.exercises ?? [
      {
        exerciseId: "ex-bench",
        exerciseName: "Bench Press",
        muscles: ["chest", "triceps"],
        sets: [
          { reps: 10, weightLbs: 135, rpe: 6, pain: 1 },
          { reps: 8, weightLbs: 145, rpe: 7, pain: 1 },
        ],
        wasSkipped: false,
      },
    ],
  };
}

/** Build a session with multiple exercises targeting different muscles. */
function makeMultiExerciseSession(
  date: string,
  exercises: {
    id: string;
    name: string;
    muscles: string[];
    sets: { reps: number; rpe: number; pain: number }[];
    skipped?: boolean;
  }[]
): CompletedSessionData {
  return {
    date,
    sessionType: "FULL_BODY",
    exercises: exercises.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscles: ex.muscles,
      sets: ex.sets.map((s) => ({
        reps: s.reps,
        weightLbs: 100,
        rpe: s.rpe,
        pain: s.pain,
      })),
      wasSkipped: ex.skipped ?? false,
    })),
  };
}

// ─── analyzeWorkoutHistory ───────────────────────────────────

describe("analyzeWorkoutHistory", () => {
  beforeAll(() => {
    // Pin Date.now so the window cutoff is deterministic
    jest.useFakeTimers();
    jest.setSystemTime(REFERENCE_DATE);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("returns zero-value analysis for an empty sessions array", () => {
    const result = analyzeWorkoutHistory([], 28);

    expect(result.totalSessions).toBe(0);
    expect(result.exerciseFrequencies).toEqual([]);
    expect(result.muscleVolumes).toEqual([]);
    expect(result.avgPainTrend).toBe(0);
    expect(result.avgRpeTrend).toBe(0);
    expect(result.avgSessionsPerWeek).toBe(0);
    expect(result.windowDays).toBe(28);
  });

  it("counts exercise frequency = 1 for a single session", () => {
    const session = makeSession({ date: daysAgo(2) });
    const result = analyzeWorkoutHistory([session], 28);

    expect(result.totalSessions).toBe(1);
    expect(result.exerciseFrequencies).toHaveLength(1);
    expect(result.exerciseFrequencies[0].exerciseId).toBe("ex-bench");
    expect(result.exerciseFrequencies[0].countInWindow).toBe(1);
  });

  it("aggregates muscle volumes correctly across multiple sessions", () => {
    const sessions = [
      makeMultiExerciseSession(daysAgo(3), [
        {
          id: "ex-squat",
          name: "Squat",
          muscles: ["quads", "glutes"],
          sets: [
            { reps: 8, rpe: 6, pain: 0 },
            { reps: 8, rpe: 7, pain: 0 },
          ],
        },
      ]),
      makeMultiExerciseSession(daysAgo(1), [
        {
          id: "ex-squat",
          name: "Squat",
          muscles: ["quads", "glutes"],
          sets: [
            { reps: 10, rpe: 7, pain: 1 },
            { reps: 10, rpe: 8, pain: 1 },
            { reps: 10, rpe: 8, pain: 2 },
          ],
        },
      ]),
    ];

    const result = analyzeWorkoutHistory(sessions, 28);

    const quads = result.muscleVolumes.find((m) => m.muscle === "quads");
    const glutes = result.muscleVolumes.find((m) => m.muscle === "glutes");

    expect(quads).toBeDefined();
    // 2 sets from session 1 + 3 sets from session 2 = 5 total sets
    expect(quads!.totalSets).toBe(5);
    // (8+8) + (10+10+10) = 46 total reps
    expect(quads!.totalReps).toBe(46);
    // glutes mirrors quads since they share exercises
    expect(glutes!.totalSets).toBe(5);
    expect(glutes!.totalReps).toBe(46);
    // 2 distinct session dates
    expect(quads!.sessionCount).toBe(2);
  });

  it("excludes skipped exercises from analysis", () => {
    const session = makeMultiExerciseSession(daysAgo(2), [
      {
        id: "ex-curl",
        name: "Bicep Curl",
        muscles: ["biceps"],
        sets: [{ reps: 10, rpe: 5, pain: 0 }],
        skipped: true,
      },
      {
        id: "ex-press",
        name: "Overhead Press",
        muscles: ["shoulders"],
        sets: [{ reps: 8, rpe: 6, pain: 0 }],
        skipped: false,
      },
    ]);

    const result = analyzeWorkoutHistory([session], 28);

    const ids = result.exerciseFrequencies.map((f) => f.exerciseId);
    expect(ids).not.toContain("ex-curl");
    expect(ids).toContain("ex-press");

    const muscles = result.muscleVolumes.map((m) => m.muscle);
    expect(muscles).not.toContain("biceps");
    expect(muscles).toContain("shoulders");
  });

  it("filters out sessions outside the window", () => {
    const insideWindow = makeSession({ date: daysAgo(5) });
    const outsideWindow = makeSession({ date: daysAgo(40) });

    const result = analyzeWorkoutHistory(
      [insideWindow, outsideWindow],
      28
    );

    expect(result.totalSessions).toBe(1);
    expect(result.exerciseFrequencies).toHaveLength(1);
    expect(result.exerciseFrequencies[0].countInWindow).toBe(1);
  });

  it("computes negative pain trend when pain improves (lower in second half)", () => {
    // First half: higher pain; second half: lower pain
    const sessions = [
      makeMultiExerciseSession(daysAgo(20), [
        {
          id: "ex-a",
          name: "Ex A",
          muscles: ["chest"],
          sets: [{ reps: 10, rpe: 6, pain: 7 }],
        },
      ]),
      makeMultiExerciseSession(daysAgo(18), [
        {
          id: "ex-a",
          name: "Ex A",
          muscles: ["chest"],
          sets: [{ reps: 10, rpe: 6, pain: 8 }],
        },
      ]),
      makeMultiExerciseSession(daysAgo(5), [
        {
          id: "ex-a",
          name: "Ex A",
          muscles: ["chest"],
          sets: [{ reps: 10, rpe: 6, pain: 2 }],
        },
      ]),
      makeMultiExerciseSession(daysAgo(3), [
        {
          id: "ex-a",
          name: "Ex A",
          muscles: ["chest"],
          sets: [{ reps: 10, rpe: 6, pain: 1 }],
        },
      ]),
    ];

    const result = analyzeWorkoutHistory(sessions, 28);

    // Pain went from ~7.5 avg to ~1.5 avg → negative trend (improving)
    expect(result.avgPainTrend).toBeLessThan(0);
  });

  it("computes positive RPE trend when RPE worsens (higher in second half)", () => {
    const sessions = [
      makeMultiExerciseSession(daysAgo(20), [
        {
          id: "ex-a",
          name: "Ex A",
          muscles: ["chest"],
          sets: [{ reps: 10, rpe: 4, pain: 0 }],
        },
      ]),
      makeMultiExerciseSession(daysAgo(18), [
        {
          id: "ex-a",
          name: "Ex A",
          muscles: ["chest"],
          sets: [{ reps: 10, rpe: 3, pain: 0 }],
        },
      ]),
      makeMultiExerciseSession(daysAgo(5), [
        {
          id: "ex-a",
          name: "Ex A",
          muscles: ["chest"],
          sets: [{ reps: 10, rpe: 8, pain: 0 }],
        },
      ]),
      makeMultiExerciseSession(daysAgo(3), [
        {
          id: "ex-a",
          name: "Ex A",
          muscles: ["chest"],
          sets: [{ reps: 10, rpe: 9, pain: 0 }],
        },
      ]),
    ];

    const result = analyzeWorkoutHistory(sessions, 28);

    // RPE went from ~3.5 avg to ~8.5 avg → positive trend (worsening)
    expect(result.avgRpeTrend).toBeGreaterThan(0);
  });

  it("calculates avgSessionsPerWeek correctly", () => {
    const sessions = [
      makeSession({ date: daysAgo(1) }),
      makeSession({ date: daysAgo(3) }),
      makeSession({ date: daysAgo(7) }),
      makeSession({ date: daysAgo(14) }),
    ];

    const result = analyzeWorkoutHistory(sessions, 28);

    // 4 sessions in 28 days = 4 / (28/7) = 1.0 sessions per week
    expect(result.avgSessionsPerWeek).toBe(1);
  });
});

// ─── getExerciseRotationScore ────────────────────────────────

describe("getExerciseRotationScore", () => {
  const baseAnalysis: WorkoutAnalysis = {
    windowDays: 28,
    totalSessions: 10,
    avgSessionsPerWeek: 2.5,
    avgPainTrend: 0,
    avgRpeTrend: 0,
    exerciseFrequencies: [
      {
        exerciseId: "ex-bench",
        exerciseName: "Bench Press",
        countInWindow: 3,
        lastUsedDate: "2026-03-19",
        avgRpe: 6,
        avgPain: 1,
      },
      {
        exerciseId: "ex-squat",
        exerciseName: "Squat",
        countInWindow: 8,
        lastUsedDate: "2026-03-20",
        avgRpe: 7,
        avgPain: 0,
      },
    ],
    muscleVolumes: [],
  };

  it("returns 0 for an exercise not present in analysis", () => {
    const score = getExerciseRotationScore("ex-unknown", baseAnalysis);
    expect(score).toBe(0);
  });

  it("returns a value between 0 and 1 for exercises in analysis", () => {
    const score = getExerciseRotationScore("ex-bench", baseAnalysis);
    // maxExpectedUses = ceil(10 * 0.5) = 5; score = 3/5 = 0.6
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
    expect(score).toBeCloseTo(0.6);
  });

  it("returns 1 (capped) for heavily overused exercises", () => {
    const score = getExerciseRotationScore("ex-squat", baseAnalysis);
    // maxExpectedUses = ceil(10 * 0.5) = 5; 8/5 = 1.6 → capped at 1
    expect(score).toBe(1);
  });
});

// ─── getMuscleBalanceGaps ────────────────────────────────────

describe("getMuscleBalanceGaps", () => {
  it("returns muscles below 60% of average volume", () => {
    const analysis: WorkoutAnalysis = {
      windowDays: 28,
      totalSessions: 8,
      avgSessionsPerWeek: 2,
      avgPainTrend: 0,
      avgRpeTrend: 0,
      exerciseFrequencies: [],
      muscleVolumes: [
        { muscle: "chest", totalSets: 20, totalReps: 200, avgRpe: 6, sessionCount: 4 },
        { muscle: "back", totalSets: 18, totalReps: 180, avgRpe: 6, sessionCount: 4 },
        { muscle: "biceps", totalSets: 2, totalReps: 20, avgRpe: 5, sessionCount: 1 },
      ],
    };

    // avg sets = (20 + 18 + 2) / 3 ≈ 13.33; threshold = 13.33 * 0.6 ≈ 8.0
    // biceps (2 sets) is below threshold
    const gaps = getMuscleBalanceGaps(analysis, ["chest", "back", "biceps"]);

    expect(gaps).toHaveLength(1);
    expect(gaps[0].muscle).toBe("biceps");
    expect(gaps[0].totalSets).toBe(2);
  });

  it("returns muscles not present in analysis at all as gaps", () => {
    const analysis: WorkoutAnalysis = {
      windowDays: 28,
      totalSessions: 4,
      avgSessionsPerWeek: 1,
      avgPainTrend: 0,
      avgRpeTrend: 0,
      exerciseFrequencies: [],
      muscleVolumes: [
        { muscle: "chest", totalSets: 10, totalReps: 100, avgRpe: 6, sessionCount: 3 },
      ],
    };

    const gaps = getMuscleBalanceGaps(analysis, ["chest", "hamstrings", "calves"]);

    const gapMuscles = gaps.map((g) => g.muscle);
    expect(gapMuscles).toContain("hamstrings");
    expect(gapMuscles).toContain("calves");
    // chest is the only muscle and has all the volume → at the average, not a gap
    expect(gapMuscles).not.toContain("chest");

    // Untrained muscles should have zero values
    const hamstrings = gaps.find((g) => g.muscle === "hamstrings")!;
    expect(hamstrings.totalSets).toBe(0);
    expect(hamstrings.totalReps).toBe(0);
    expect(hamstrings.avgRpe).toBe(0);
    expect(hamstrings.sessionCount).toBe(0);
  });

  it("returns empty array when all muscles are balanced", () => {
    const analysis: WorkoutAnalysis = {
      windowDays: 28,
      totalSessions: 8,
      avgSessionsPerWeek: 2,
      avgPainTrend: 0,
      avgRpeTrend: 0,
      exerciseFrequencies: [],
      muscleVolumes: [
        { muscle: "chest", totalSets: 12, totalReps: 120, avgRpe: 6, sessionCount: 4 },
        { muscle: "back", totalSets: 14, totalReps: 140, avgRpe: 6, sessionCount: 4 },
        { muscle: "shoulders", totalSets: 10, totalReps: 100, avgRpe: 6, sessionCount: 3 },
      ],
    };

    // avg = (12+14+10)/3 ≈ 12; threshold = 12 * 0.6 = 7.2
    // All muscles are above 7.2
    const gaps = getMuscleBalanceGaps(analysis, ["chest", "back", "shoulders"]);
    expect(gaps).toEqual([]);
  });
});
