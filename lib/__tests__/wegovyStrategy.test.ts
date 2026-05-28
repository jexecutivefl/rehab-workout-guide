import {
  WEGOVY_PROTEIN_TARGET_G,
  WEGOVY_CREATINE_DAILY_G,
  WEGOVY_GOALS,
  epleyOneRepMax,
  getWegovyPhase,
  computeWegovyGoalProgress,
  computeAllWegovyGoalProgress,
  type WegovySetInput,
} from "../wegovyStrategy";

// ─── Constants ────────────────────────────────────────────────

describe("Wegovy constants", () => {
  it("uses 170–200g protein band", () => {
    expect(WEGOVY_PROTEIN_TARGET_G.min).toBe(170);
    expect(WEGOVY_PROTEIN_TARGET_G.max).toBe(200);
  });

  it("uses 5g daily creatine", () => {
    expect(WEGOVY_CREATINE_DAILY_G).toBe(5);
  });

  it("defines all five performance goals", () => {
    expect(WEGOVY_GOALS).toHaveLength(5);
    const ids = WEGOVY_GOALS.map((g) => g.id);
    expect(ids).toEqual([
      "bench-225x5",
      "squat-315x5",
      "rdl-275x8",
      "incline-walk-30min",
      "farmer-carry-bw",
    ]);
  });
});

// ─── Epley ────────────────────────────────────────────────────

describe("epleyOneRepMax", () => {
  it("computes weight * (1 + reps / 30)", () => {
    expect(epleyOneRepMax(225, 5)).toBeCloseTo(262.5, 5);
    expect(epleyOneRepMax(315, 5)).toBeCloseTo(367.5, 5);
    expect(epleyOneRepMax(275, 8)).toBeCloseTo(348.333, 2);
  });

  it("returns 0 for invalid inputs", () => {
    expect(epleyOneRepMax(0, 5)).toBe(0);
    expect(epleyOneRepMax(225, 0)).toBe(0);
    expect(epleyOneRepMax(-50, 5)).toBe(0);
  });

  it("a single rep equals the weight (Epley reduces to W*1.033 at reps=1)", () => {
    // sanity check
    expect(epleyOneRepMax(200, 1)).toBeCloseTo(200 * (1 + 1 / 30), 5);
  });
});

// ─── Phase tracker ────────────────────────────────────────────

describe("getWegovyPhase", () => {
  it("returns Pre-Wegovy with no start date", () => {
    const info = getWegovyPhase(null);
    expect(info.phase).toBe("ramp");
    expect(info.label).toBe("Pre-Wegovy");
  });

  it("falls back to Pre-Wegovy for an invalid date string", () => {
    const info = getWegovyPhase("not-a-date");
    expect(info.phase).toBe("ramp");
    expect(info.label).toBe("Pre-Wegovy");
  });

  it("returns ramp during month 1", () => {
    const start = "2026-05-01";
    const now = new Date("2026-05-20");
    const info = getWegovyPhase(start, now);
    expect(info.phase).toBe("ramp");
    expect(info.label).toContain("Ramp");
  });

  it("returns phase1 during months 1–3", () => {
    const start = "2026-02-01";
    const now = new Date("2026-04-15");
    const info = getWegovyPhase(start, now);
    expect(info.phase).toBe("phase1");
    expect(info.expectedCumulativeLossLbs).toEqual({ min: 10, max: 20 });
  });

  it("returns phase2 during months 4–6", () => {
    const start = "2025-11-01";
    const now = new Date("2026-04-15");
    const info = getWegovyPhase(start, now);
    expect(info.phase).toBe("phase2");
    expect(info.expectedCumulativeLossLbs.max).toBeGreaterThanOrEqual(20);
  });

  it("returns maintenance after month 6", () => {
    const start = "2025-01-01";
    const now = new Date("2026-05-15");
    const info = getWegovyPhase(start, now);
    expect(info.phase).toBe("maintenance");
  });
});

// ─── Goal progress: strength (1RM) ───────────────────────────

describe("computeWegovyGoalProgress — strength goals", () => {
  const benchGoal = WEGOVY_GOALS.find((g) => g.id === "bench-225x5")!;
  const squatGoal = WEGOVY_GOALS.find((g) => g.id === "squat-315x5")!;
  const rdlGoal = WEGOVY_GOALS.find((g) => g.id === "rdl-275x8")!;

  it("reports not_started when no matching sets", () => {
    const progress = computeWegovyGoalProgress(benchGoal, []);
    expect(progress.status).toBe("not_started");
    expect(progress.percentComplete).toBe(0);
    expect(progress.achieved).toBe(false);
  });

  it("ignores sets from non-matching exercises", () => {
    const sets: WegovySetInput[] = [
      { exerciseId: "shoulder-db-lateral-raise", weightLbs: 200, reps: 5 },
    ];
    const progress = computeWegovyGoalProgress(benchGoal, sets);
    expect(progress.status).toBe("not_started");
  });

  it("ignores sets with missing weight or reps", () => {
    const sets: WegovySetInput[] = [
      { exerciseId: "chest-machine-press", weightLbs: 0, reps: 5 },
      { exerciseId: "chest-machine-press", weightLbs: 150, reps: 0 },
      { exerciseId: "chest-machine-press", weightLbs: null, reps: 5 },
    ];
    const progress = computeWegovyGoalProgress(benchGoal, sets);
    expect(progress.status).toBe("not_started");
  });

  it("counts machine-press at face value", () => {
    const sets: WegovySetInput[] = [
      { exerciseId: "chest-machine-press", weightLbs: 150, reps: 8 },
    ];
    const progress = computeWegovyGoalProgress(benchGoal, sets);
    expect(progress.bestObserved?.estimatedOneRepMaxLbs).toBe(
      Math.round(epleyOneRepMax(150, 8))
    );
    expect(progress.status).toBe("in_progress");
  });

  it("doubles dumbbell weight (one per hand) for DB bench", () => {
    // 80 lb DBs × 6 reps = effective 160 × 6 → 1RM ≈ 192
    const sets: WegovySetInput[] = [
      { exerciseId: "chest-db-bench", weightLbs: 80, reps: 6 },
    ];
    const progress = computeWegovyGoalProgress(benchGoal, sets);
    expect(progress.bestObserved?.weightLbs).toBe(160);
    expect(progress.bestObserved?.estimatedOneRepMaxLbs).toBe(
      Math.round(epleyOneRepMax(160, 6))
    );
  });

  it("doubles dumbbell weight for DB RDL", () => {
    const sets: WegovySetInput[] = [
      { exerciseId: "legs-rdl-db", weightLbs: 100, reps: 8 },
    ];
    const progress = computeWegovyGoalProgress(rdlGoal, sets);
    expect(progress.bestObserved?.weightLbs).toBe(200);
  });

  it("uses the best set across multiple logged sets", () => {
    const sets: WegovySetInput[] = [
      { exerciseId: "chest-machine-press", weightLbs: 135, reps: 10 },
      { exerciseId: "chest-machine-press", weightLbs: 185, reps: 5 },
      { exerciseId: "chest-machine-press", weightLbs: 155, reps: 8 },
    ];
    const progress = computeWegovyGoalProgress(benchGoal, sets);
    // 185×5 1RM = 215.83; 155×8 1RM = 196.33; 135×10 1RM = 180. Best = 215.83.
    expect(progress.bestObserved?.estimatedOneRepMaxLbs).toBe(216);
  });

  it("marks a goal achieved when 1RM meets target", () => {
    const sets: WegovySetInput[] = [
      // 225 × 5 → exactly the target 1RM (262.5)
      { exerciseId: "chest-machine-press", weightLbs: 225, reps: 5 },
    ];
    const progress = computeWegovyGoalProgress(benchGoal, sets);
    expect(progress.achieved).toBe(true);
    expect(progress.status).toBe("achieved");
    expect(progress.percentComplete).toBe(100);
  });

  it("caps percentComplete at 100 even when exceeding the target", () => {
    const sets: WegovySetInput[] = [
      { exerciseId: "legs-leg-press", weightLbs: 500, reps: 5 },
    ];
    const progress = computeWegovyGoalProgress(squatGoal, sets);
    expect(progress.percentComplete).toBe(100);
    expect(progress.achieved).toBe(true);
  });
});

// ─── Goal progress: duration ─────────────────────────────────

describe("computeWegovyGoalProgress — duration goals", () => {
  const walkGoal = WEGOVY_GOALS.find((g) => g.id === "incline-walk-30min")!;

  it("reports not_started when no matching duration logged", () => {
    const progress = computeWegovyGoalProgress(walkGoal, []);
    expect(progress.status).toBe("not_started");
  });

  it("takes the longest matching duration", () => {
    const sets: WegovySetInput[] = [
      { exerciseId: "cardio-treadmill-walk", durationSec: 900 },
      { exerciseId: "cardio-treadmill-walk", durationSec: 1500 },
      { exerciseId: "cardio-treadmill-walk", durationSec: 1200 },
    ];
    const progress = computeWegovyGoalProgress(walkGoal, sets);
    expect(progress.bestObserved?.durationSec).toBe(1500);
    expect(progress.percentComplete).toBe(83); // 1500/1800
    expect(progress.status).toBe("in_progress");
  });

  it("marks achieved at full duration", () => {
    const sets: WegovySetInput[] = [
      { exerciseId: "cardio-treadmill-walk", durationSec: 1800 },
    ];
    const progress = computeWegovyGoalProgress(walkGoal, sets);
    expect(progress.achieved).toBe(true);
    expect(progress.percentComplete).toBe(100);
  });

  it("ignores non-matching cardio durations", () => {
    const sets: WegovySetInput[] = [
      { exerciseId: "cardio-stationary-bike", durationSec: 1800 },
    ];
    const progress = computeWegovyGoalProgress(walkGoal, sets);
    expect(progress.status).toBe("not_started");
  });
});

// ─── Manual goals ─────────────────────────────────────────────

describe("computeWegovyGoalProgress — manual goals", () => {
  const carryGoal = WEGOVY_GOALS.find((g) => g.id === "farmer-carry-bw")!;

  it("always returns not_started", () => {
    const sets: WegovySetInput[] = [
      { exerciseId: "anything", weightLbs: 500, reps: 10 },
    ];
    const progress = computeWegovyGoalProgress(carryGoal, sets);
    expect(progress.status).toBe("not_started");
    expect(progress.percentComplete).toBe(0);
  });
});

// ─── Bulk progress ────────────────────────────────────────────

describe("computeAllWegovyGoalProgress", () => {
  it("returns one progress object per defined goal", () => {
    const progress = computeAllWegovyGoalProgress([]);
    expect(progress).toHaveLength(WEGOVY_GOALS.length);
    expect(progress.map((p) => p.goal.id)).toEqual(WEGOVY_GOALS.map((g) => g.id));
  });
});
