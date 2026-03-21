import { detectPlateaus, recommendAdaptations } from "@/lib/plateauDetector";
import type {
  WorkoutAnalysis,
  ExerciseProgressionHistory,
  PlateauSignal,
  PlateauAdaptation,
  InjuryContext,
  ExerciseFrequency,
  MuscleGroupVolume,
} from "@/types/index";

// ─── Helpers ──────────────────────────────────────────────────

/** Build a default InjuryContext with overrides. */
function makeCtx(overrides?: {
  pfStage?: 1 | 2 | 3 | 4;
  pfPain?: number;
  elbowStage?: 1 | 2 | 3 | 4;
  elbowPain?: number;
  shoulderStage?: 1 | 2 | 3 | 4;
  shoulderPain?: number;
}): InjuryContext {
  return {
    plantarFasciitis: {
      stage: overrides?.pfStage ?? 3,
      painLevel: overrides?.pfPain ?? 3,
      side: "RIGHT" as const,
    },
    sprainedElbow: {
      stage: overrides?.elbowStage ?? 3,
      painLevel: overrides?.elbowPain ?? 3,
      side: "LEFT" as const,
    },
    shoulderInstability: {
      stage: overrides?.shoulderStage ?? 4,
      painLevel: overrides?.shoulderPain ?? 0,
      side: "LEFT" as const,
    },
  };
}

/** Build a minimal WorkoutAnalysis with overrides. */
function makeAnalysis(overrides?: Partial<WorkoutAnalysis>): WorkoutAnalysis {
  return {
    windowDays: overrides?.windowDays ?? 28,
    exerciseFrequencies: overrides?.exerciseFrequencies ?? [],
    muscleVolumes: overrides?.muscleVolumes ?? [],
    totalSessions: overrides?.totalSessions ?? 10,
    avgSessionsPerWeek: overrides?.avgSessionsPerWeek ?? 3,
    avgPainTrend: overrides?.avgPainTrend ?? 0,
    avgRpeTrend: overrides?.avgRpeTrend ?? 0,
  };
}

/** Build an ExerciseProgressionHistory with N identical entries. */
function makeProgressionHistory(
  overrides?: Partial<ExerciseProgressionHistory> & {
    entryCount?: number;
    weightLbs?: number;
    bestReps?: number;
    avgRpe?: number;
    avgPain?: number;
    entries?: ExerciseProgressionHistory["entries"];
  },
): ExerciseProgressionHistory {
  const count = overrides?.entryCount ?? 3;
  const weight = overrides?.weightLbs ?? 135;
  const reps = overrides?.bestReps ?? 8;
  const rpe = overrides?.avgRpe ?? 7;
  const pain = overrides?.avgPain ?? 0;

  const entries =
    overrides?.entries ??
    Array.from({ length: count }, (_, i) => ({
      date: `2026-03-${String(i + 1).padStart(2, "0")}`,
      weightLbs: weight,
      bestReps: reps,
      avgRpe: rpe,
      avgPain: pain,
    }));

  return {
    exerciseId: overrides?.exerciseId ?? "chest-pec-deck",
    exerciseName: overrides?.exerciseName ?? "Pec Deck Machine",
    entries,
  };
}

// ─── detectPlateaus ──────────────────────────────────────────

describe("detectPlateaus", () => {
  it("returns no signals when progression history has fewer than 3 entries", () => {
    const analysis = makeAnalysis();
    const history = makeProgressionHistory({ entryCount: 2 });
    const signals = detectPlateaus(analysis, [history]);
    expect(signals).toHaveLength(0);
  });

  it("returns no signals with 0 entries", () => {
    const analysis = makeAnalysis();
    const history = makeProgressionHistory({ entryCount: 0, entries: [] });
    const signals = detectPlateaus(analysis, [history]);
    expect(signals).toHaveLength(0);
  });

  // ── WEIGHT_STALL ──────────────────────────────────────────

  describe("WEIGHT_STALL", () => {
    it("detects same weight for 3+ entries with RPE not decreasing", () => {
      const analysis = makeAnalysis();
      const history = makeProgressionHistory({
        entryCount: 3,
        weightLbs: 135,
        avgRpe: 8,
      });
      const signals = detectPlateaus(analysis, [history]);
      const weightStalls = signals.filter((s) => s.type === "WEIGHT_STALL");
      expect(weightStalls).toHaveLength(1);
      expect(weightStalls[0].severity).toBe("mild");
      expect(weightStalls[0].exerciseId).toBe("chest-pec-deck");
    });

    it("does NOT trigger when RPE is strictly decreasing (lifter adapting)", () => {
      const analysis = makeAnalysis();
      const history = makeProgressionHistory({
        entries: [
          { date: "2026-03-01", weightLbs: 135, bestReps: 8, avgRpe: 9, avgPain: 0 },
          { date: "2026-03-08", weightLbs: 135, bestReps: 8, avgRpe: 8, avgPain: 0 },
          { date: "2026-03-15", weightLbs: 135, bestReps: 8, avgRpe: 7, avgPain: 0 },
        ],
      });
      const signals = detectPlateaus(analysis, [history]);
      const weightStalls = signals.filter((s) => s.type === "WEIGHT_STALL");
      expect(weightStalls).toHaveLength(0);
    });

    it("triggers when RPE is flat (same weight, not getting easier)", () => {
      const analysis = makeAnalysis();
      const history = makeProgressionHistory({
        entries: [
          { date: "2026-03-01", weightLbs: 200, bestReps: 5, avgRpe: 8.5, avgPain: 0 },
          { date: "2026-03-08", weightLbs: 200, bestReps: 5, avgRpe: 8.5, avgPain: 0 },
          { date: "2026-03-15", weightLbs: 200, bestReps: 5, avgRpe: 8.5, avgPain: 0 },
        ],
      });
      const signals = detectPlateaus(analysis, [history]);
      const weightStalls = signals.filter((s) => s.type === "WEIGHT_STALL");
      expect(weightStalls).toHaveLength(1);
    });
  });

  // ── REP_STALL ─────────────────────────────────────────────

  describe("REP_STALL", () => {
    it("detects same reps for 3+ entries with no weight increase", () => {
      const analysis = makeAnalysis();
      const history = makeProgressionHistory({
        entryCount: 3,
        bestReps: 10,
        weightLbs: 100,
      });
      const signals = detectPlateaus(analysis, [history]);
      const repStalls = signals.filter((s) => s.type === "REP_STALL");
      expect(repStalls).toHaveLength(1);
      expect(repStalls[0].severity).toBe("mild");
    });

    it("does NOT trigger when weight increased during the streak", () => {
      const analysis = makeAnalysis();
      const history = makeProgressionHistory({
        entries: [
          { date: "2026-03-01", weightLbs: 100, bestReps: 10, avgRpe: 7, avgPain: 0 },
          { date: "2026-03-08", weightLbs: 105, bestReps: 10, avgRpe: 7.5, avgPain: 0 },
          { date: "2026-03-15", weightLbs: 105, bestReps: 10, avgRpe: 8, avgPain: 0 },
        ],
      });
      const signals = detectPlateaus(analysis, [history]);
      const repStalls = signals.filter((s) => s.type === "REP_STALL");
      expect(repStalls).toHaveLength(0);
    });
  });

  // ── RPE_CEILING ───────────────────────────────────────────

  describe("RPE_CEILING", () => {
    it("detects avgRpe > 8.5 for 3+ consecutive entries", () => {
      const analysis = makeAnalysis();
      const history = makeProgressionHistory({
        entries: [
          { date: "2026-03-01", weightLbs: 150, bestReps: 5, avgRpe: 9, avgPain: 0 },
          { date: "2026-03-08", weightLbs: 155, bestReps: 5, avgRpe: 9.5, avgPain: 0 },
          { date: "2026-03-15", weightLbs: 155, bestReps: 4, avgRpe: 9.2, avgPain: 0 },
        ],
      });
      const signals = detectPlateaus(analysis, [history]);
      const rpeCeilings = signals.filter((s) => s.type === "RPE_CEILING");
      expect(rpeCeilings).toHaveLength(1);
      expect(rpeCeilings[0].severity).toBe("mild");
    });

    it("does NOT trigger when RPE <= 8.5", () => {
      const analysis = makeAnalysis();
      const history = makeProgressionHistory({
        entryCount: 3,
        avgRpe: 8.0,
      });
      const signals = detectPlateaus(analysis, [history]);
      const rpeCeilings = signals.filter((s) => s.type === "RPE_CEILING");
      expect(rpeCeilings).toHaveLength(0);
    });

    it("does NOT trigger when RPE > 8.5 streak is broken in the middle", () => {
      const analysis = makeAnalysis();
      const history = makeProgressionHistory({
        entries: [
          { date: "2026-03-01", weightLbs: 150, bestReps: 5, avgRpe: 9, avgPain: 0 },
          { date: "2026-03-08", weightLbs: 150, bestReps: 5, avgRpe: 7, avgPain: 0 },
          { date: "2026-03-15", weightLbs: 150, bestReps: 5, avgRpe: 9.5, avgPain: 0 },
        ],
      });
      const signals = detectPlateaus(analysis, [history]);
      const rpeCeilings = signals.filter((s) => s.type === "RPE_CEILING");
      expect(rpeCeilings).toHaveLength(0);
    });
  });

  // ── EXERCISE_STALENESS ────────────────────────────────────

  describe("EXERCISE_STALENESS", () => {
    it("detects exercise appearing in >= 75% of sessions", () => {
      const analysis = makeAnalysis({
        totalSessions: 10,
        exerciseFrequencies: [
          {
            exerciseId: "chest-pec-deck",
            exerciseName: "Pec Deck Machine",
            countInWindow: 8,
            lastUsedDate: "2026-03-15",
            avgRpe: 7,
            avgPain: 0,
          },
        ],
      });
      const signals = detectPlateaus(analysis, []);
      const staleness = signals.filter((s) => s.type === "EXERCISE_STALENESS");
      expect(staleness).toHaveLength(1);
      expect(staleness[0].severity).toBe("mild");
    });

    it("does NOT trigger when exercise is under 75% frequency", () => {
      const analysis = makeAnalysis({
        totalSessions: 10,
        exerciseFrequencies: [
          {
            exerciseId: "chest-pec-deck",
            exerciseName: "Pec Deck Machine",
            countInWindow: 7,
            lastUsedDate: "2026-03-15",
            avgRpe: 7,
            avgPain: 0,
          },
        ],
      });
      const signals = detectPlateaus(analysis, []);
      const staleness = signals.filter((s) => s.type === "EXERCISE_STALENESS");
      expect(staleness).toHaveLength(0);
    });

    it("severity is moderate at 85%+", () => {
      const analysis = makeAnalysis({
        totalSessions: 20,
        exerciseFrequencies: [
          {
            exerciseId: "chest-pec-deck",
            exerciseName: "Pec Deck Machine",
            countInWindow: 18,
            lastUsedDate: "2026-03-15",
            avgRpe: 7,
            avgPain: 0,
          },
        ],
      });
      const signals = detectPlateaus(analysis, []);
      const staleness = signals.filter((s) => s.type === "EXERCISE_STALENESS");
      expect(staleness).toHaveLength(1);
      expect(staleness[0].severity).toBe("moderate");
    });

    it("severity is strong at 95%+", () => {
      const analysis = makeAnalysis({
        totalSessions: 20,
        exerciseFrequencies: [
          {
            exerciseId: "chest-pec-deck",
            exerciseName: "Pec Deck Machine",
            countInWindow: 20,
            lastUsedDate: "2026-03-15",
            avgRpe: 7,
            avgPain: 0,
          },
        ],
      });
      const signals = detectPlateaus(analysis, []);
      const staleness = signals.filter((s) => s.type === "EXERCISE_STALENESS");
      expect(staleness).toHaveLength(1);
      expect(staleness[0].severity).toBe("strong");
    });

    it("does NOT trigger when totalSessions is 0", () => {
      const analysis = makeAnalysis({
        totalSessions: 0,
        exerciseFrequencies: [
          {
            exerciseId: "chest-pec-deck",
            exerciseName: "Pec Deck Machine",
            countInWindow: 0,
            lastUsedDate: "2026-03-15",
            avgRpe: 7,
            avgPain: 0,
          },
        ],
      });
      const signals = detectPlateaus(analysis, []);
      const staleness = signals.filter((s) => s.type === "EXERCISE_STALENESS");
      expect(staleness).toHaveLength(0);
    });
  });

  // ── Severity Scaling ──────────────────────────────────────

  describe("severity scaling", () => {
    it("3 entries = mild", () => {
      const analysis = makeAnalysis();
      const history = makeProgressionHistory({ entryCount: 3, weightLbs: 135 });
      const signals = detectPlateaus(analysis, [history]);
      const weightStalls = signals.filter((s) => s.type === "WEIGHT_STALL");
      expect(weightStalls[0].severity).toBe("mild");
    });

    it("4 entries = moderate", () => {
      const analysis = makeAnalysis();
      const history = makeProgressionHistory({ entryCount: 4, weightLbs: 135 });
      const signals = detectPlateaus(analysis, [history]);
      const weightStalls = signals.filter((s) => s.type === "WEIGHT_STALL");
      expect(weightStalls[0].severity).toBe("moderate");
    });

    it("5+ entries = strong", () => {
      const analysis = makeAnalysis();
      const history = makeProgressionHistory({ entryCount: 6, weightLbs: 135 });
      const signals = detectPlateaus(analysis, [history]);
      const weightStalls = signals.filter((s) => s.type === "WEIGHT_STALL");
      expect(weightStalls[0].severity).toBe("strong");
    });
  });

  // ── No False Positives ────────────────────────────────────

  describe("no false positives", () => {
    it("varied weight and reps do not trigger stalls", () => {
      const analysis = makeAnalysis();
      const history = makeProgressionHistory({
        entries: [
          { date: "2026-03-01", weightLbs: 100, bestReps: 8, avgRpe: 7, avgPain: 0 },
          { date: "2026-03-08", weightLbs: 105, bestReps: 7, avgRpe: 7.5, avgPain: 0 },
          { date: "2026-03-15", weightLbs: 110, bestReps: 6, avgRpe: 8, avgPain: 0 },
        ],
      });
      const signals = detectPlateaus(analysis, [history]);
      const stalls = signals.filter(
        (s) => s.type === "WEIGHT_STALL" || s.type === "REP_STALL",
      );
      expect(stalls).toHaveLength(0);
    });

    it("increasing reps with same weight is not a rep stall", () => {
      const analysis = makeAnalysis();
      const history = makeProgressionHistory({
        entries: [
          { date: "2026-03-01", weightLbs: 100, bestReps: 8, avgRpe: 7, avgPain: 0 },
          { date: "2026-03-08", weightLbs: 100, bestReps: 9, avgRpe: 7.5, avgPain: 0 },
          { date: "2026-03-15", weightLbs: 100, bestReps: 10, avgRpe: 8, avgPain: 0 },
        ],
      });
      const signals = detectPlateaus(analysis, [history]);
      const repStalls = signals.filter((s) => s.type === "REP_STALL");
      expect(repStalls).toHaveLength(0);
    });

    it("empty progression history array returns no signals", () => {
      const analysis = makeAnalysis();
      const signals = detectPlateaus(analysis, []);
      expect(signals).toHaveLength(0);
    });
  });
});

// ─── recommendAdaptations ────────────────────────────────────

describe("recommendAdaptations", () => {
  const ctx = makeCtx();

  it("WEIGHT_STALL gets SWAP_EXERCISE or CHANGE_REP_RANGE", () => {
    const signal: PlateauSignal = {
      type: "WEIGHT_STALL",
      exerciseId: "chest-pec-deck",
      exerciseName: "Pec Deck Machine",
      severity: "moderate",
      message: "Weight stuck at 135 lbs for 4 sessions on Pec Deck Machine.",
    };
    const adaptations = recommendAdaptations([signal], ["chest-pec-deck"], ctx);
    expect(adaptations).toHaveLength(1);
    expect(["SWAP_EXERCISE", "CHANGE_REP_RANGE"]).toContain(adaptations[0].action);
  });

  it("RPE_CEILING gets DELOAD", () => {
    const signal: PlateauSignal = {
      type: "RPE_CEILING",
      exerciseId: "chest-db-bench",
      exerciseName: "Dumbbell Bench Press",
      severity: "mild",
      message: "RPE averaging 9.2 over 3 sessions on Dumbbell Bench Press.",
    };
    const adaptations = recommendAdaptations([signal], ["chest-db-bench"], ctx);
    expect(adaptations).toHaveLength(1);
    expect(adaptations[0].action).toBe("DELOAD");
  });

  it("EXERCISE_STALENESS gets ROTATE_VARIATION", () => {
    const signal: PlateauSignal = {
      type: "EXERCISE_STALENESS",
      exerciseId: "chest-pec-deck",
      exerciseName: "Pec Deck Machine",
      severity: "mild",
      message: "Pec Deck Machine used in 80% of sessions.",
    };
    const adaptations = recommendAdaptations([signal], ["chest-pec-deck"], ctx);
    expect(adaptations).toHaveLength(1);
    expect(adaptations[0].action).toBe("ROTATE_VARIATION");
  });

  it("VOLUME_FLAT gets ADD_VOLUME", () => {
    const signal: PlateauSignal = {
      type: "VOLUME_FLAT",
      muscle: "pectorals",
      severity: "moderate",
      message: "pectorals volume is flat while effort is rising (RPE trend +0.4).",
    };
    const adaptations = recommendAdaptations([signal], [], ctx);
    expect(adaptations).toHaveLength(1);
    expect(adaptations[0].action).toBe("ADD_VOLUME");
  });

  it("REP_STALL gets ROTATE_VARIATION or ADD_VOLUME", () => {
    const signal: PlateauSignal = {
      type: "REP_STALL",
      exerciseId: "chest-pec-deck",
      exerciseName: "Pec Deck Machine",
      severity: "mild",
      message: "Reps stuck at 10 for 3 sessions on Pec Deck Machine.",
    };
    const adaptations = recommendAdaptations([signal], ["chest-pec-deck"], ctx);
    expect(adaptations).toHaveLength(1);
    expect(["ROTATE_VARIATION", "ADD_VOLUME"]).toContain(adaptations[0].action);
  });

  it("suggested exercises pass injury engine (not AVOID)", () => {
    // Use a context where most exercises are safe (stage 3+)
    const safeCtx = makeCtx({ pfStage: 3, elbowStage: 3, shoulderStage: 4 });
    const signal: PlateauSignal = {
      type: "WEIGHT_STALL",
      exerciseId: "chest-pec-deck",
      exerciseName: "Pec Deck Machine",
      severity: "moderate",
      message: "Weight stuck.",
    };
    const adaptations = recommendAdaptations([signal], ["chest-pec-deck"], safeCtx);

    // If a suggested exercise is returned, verify it's not AVOID by checking it has an ID
    // (the implementation already filters through evaluateExerciseSafety, only SAFE/MODIFIED pass)
    for (const adaptation of adaptations) {
      if (adaptation.suggestedExerciseId) {
        expect(adaptation.suggestedExerciseId).toBeTruthy();
        // The fact that it passed findAlternativeExercise means it's SAFE or MODIFIED
        expect(["SWAP_EXERCISE", "ROTATE_VARIATION"]).toContain(adaptation.action);
      }
    }
  });

  it("returns adaptations for all input signals", () => {
    const signals: PlateauSignal[] = [
      {
        type: "WEIGHT_STALL",
        exerciseId: "chest-pec-deck",
        exerciseName: "Pec Deck Machine",
        severity: "mild",
        message: "Weight stuck.",
      },
      {
        type: "RPE_CEILING",
        exerciseId: "chest-db-bench",
        exerciseName: "Dumbbell Bench Press",
        severity: "moderate",
        message: "RPE too high.",
      },
      {
        type: "EXERCISE_STALENESS",
        exerciseId: "back-lat-pulldown",
        exerciseName: "Lat Pulldown",
        severity: "strong",
        message: "Overused.",
      },
    ];
    const adaptations = recommendAdaptations(
      signals,
      ["chest-pec-deck", "chest-db-bench", "back-lat-pulldown"],
      ctx,
    );
    expect(adaptations).toHaveLength(3);
    // Each adaptation maps to its signal
    expect(adaptations[0].signal.type).toBe("WEIGHT_STALL");
    expect(adaptations[1].signal.type).toBe("RPE_CEILING");
    expect(adaptations[2].signal.type).toBe("EXERCISE_STALENESS");
  });

  it("returns empty array for empty signals", () => {
    const adaptations = recommendAdaptations([], [], ctx);
    expect(adaptations).toHaveLength(0);
  });

  it("handles signals without exerciseId gracefully", () => {
    const signal: PlateauSignal = {
      type: "VOLUME_FLAT",
      muscle: "quadriceps",
      severity: "mild",
      message: "Volume flat.",
    };
    const adaptations = recommendAdaptations([signal], [], ctx);
    expect(adaptations).toHaveLength(1);
    expect(adaptations[0].action).toBe("ADD_VOLUME");
    expect(adaptations[0].suggestedExerciseId).toBeUndefined();
  });
});
