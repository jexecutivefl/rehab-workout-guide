import { evaluateProgression } from "@/lib/progressionRules";
import type { CompletedSet, InjuryStage } from "@/types/index";

// ─── Helpers ──────────────────────────────────────────────────

/** Build a set of CompletedSets with uniform values. */
function makeSets(
  count: number,
  overrides?: Partial<CompletedSet>
): CompletedSet[] {
  return Array.from({ length: count }, (_, i) => ({
    reps: overrides?.reps ?? 12,
    weightLbs: overrides?.weightLbs ?? 100,
    rpe: overrides?.rpe ?? 6,
    pain: overrides?.pain ?? 0,
    ...overrides,
    setNumber: i + 1,
  }));
}

// ─── evaluateProgression ─────────────────────────────────────

describe("evaluateProgression", () => {
  it("all sets hit top reps, RPE below threshold, no pain -> returns suggestion", () => {
    const sets = makeSets(3, { reps: 12, rpe: 6, pain: 0 });
    const result = evaluateProgression("ex-1", "Machine Chest Press", sets, 100, 3);

    expect(result).not.toBeNull();
    expect(result!.suggestedWeight).toBe(105); // standard 5lb increment
    expect(result!.increment).toBe(5);
    expect(result!.currentWeight).toBe(100);
    expect(result!.exerciseId).toBe("ex-1");
  });

  it("pain >= 5 on any set -> returns null", () => {
    const sets = makeSets(3, { reps: 12, rpe: 6, pain: 0 });
    sets[1] = { ...sets[1], pain: 5 }; // one set with pain
    const result = evaluateProgression("ex-1", "Machine Press", sets, 100, 3);
    expect(result).toBeNull();
  });

  it("RPE above threshold -> returns null", () => {
    // Stage 3 threshold is 8; RPE 9 should block progression
    const sets = makeSets(3, { reps: 12, rpe: 9, pain: 0 });
    const result = evaluateProgression("ex-1", "Machine Press", sets, 100, 3);
    expect(result).toBeNull();
  });

  it("no sets -> returns null", () => {
    const result = evaluateProgression("ex-1", "Machine Press", [], 100, 3);
    expect(result).toBeNull();
  });

  it("zero weight -> returns null", () => {
    const sets = makeSets(3, { reps: 12, rpe: 5, pain: 0 });
    const result = evaluateProgression("ex-1", "Plank", sets, 0, 3);
    expect(result).toBeNull();
  });

  it("dumbbell exercise -> 2.5lb increment", () => {
    const sets = makeSets(3, { reps: 12, rpe: 6, pain: 0 });
    const result = evaluateProgression("ex-1", "Dumbbell Bench Press", sets, 30, 3);

    expect(result).not.toBeNull();
    expect(result!.increment).toBe(2.5);
    expect(result!.suggestedWeight).toBe(32.5);
  });

  it("hammer curl (dumbbell pattern) -> 2.5lb increment", () => {
    const sets = makeSets(3, { reps: 12, rpe: 6, pain: 0 });
    const result = evaluateProgression("ex-1", "Hammer Curl", sets, 25, 3);

    expect(result).not.toBeNull();
    expect(result!.increment).toBe(2.5);
  });

  it("lateral raise (dumbbell pattern) -> 2.5lb increment", () => {
    const sets = makeSets(3, { reps: 10, rpe: 6, pain: 0 });
    const result = evaluateProgression("ex-1", "Lateral Raise", sets, 15, 3);

    expect(result).not.toBeNull();
    expect(result!.increment).toBe(2.5);
  });

  it("machine/barbell exercise -> 5lb increment", () => {
    const sets = makeSets(3, { reps: 10, rpe: 6, pain: 0 });
    const result = evaluateProgression("ex-1", "Barbell Bench Press", sets, 135, 3);

    expect(result).not.toBeNull();
    expect(result!.increment).toBe(5);
    expect(result!.suggestedWeight).toBe(140);
  });

  // ── Stage-specific RPE thresholds ───────────────────────────

  describe("stage 1 (RPE threshold 7)", () => {
    it("RPE 7 -> suggest", () => {
      const sets = makeSets(3, { reps: 12, rpe: 7, pain: 0 });
      const result = evaluateProgression("ex-1", "Machine Press", sets, 50, 1);
      expect(result).not.toBeNull();
    });

    it("RPE 8 -> null", () => {
      const sets = makeSets(3, { reps: 12, rpe: 8, pain: 0 });
      const result = evaluateProgression("ex-1", "Machine Press", sets, 50, 1);
      expect(result).toBeNull();
    });
  });

  describe("stage 4 (RPE threshold 8)", () => {
    it("RPE 8 -> suggest", () => {
      const sets = makeSets(3, { reps: 12, rpe: 8, pain: 0 });
      const result = evaluateProgression("ex-1", "Machine Press", sets, 100, 4);
      expect(result).not.toBeNull();
    });

    it("RPE 9 -> null", () => {
      const sets = makeSets(3, { reps: 12, rpe: 9, pain: 0 });
      const result = evaluateProgression("ex-1", "Machine Press", sets, 100, 4);
      expect(result).toBeNull();
    });
  });

  // ── Edge cases ──────────────────────────────────────────────

  it("not all sets hit target reps -> returns null", () => {
    const sets: CompletedSet[] = [
      { setNumber: 1, reps: 12, rpe: 6, pain: 0 },
      { setNumber: 2, reps: 10, rpe: 6, pain: 0 }, // fell short
      { setNumber: 3, reps: 12, rpe: 6, pain: 0 },
    ];
    const result = evaluateProgression("ex-1", "Machine Press", sets, 100, 3);
    expect(result).toBeNull();
  });

  it("duration-based sets (no reps) -> returns null", () => {
    const sets: CompletedSet[] = [
      { setNumber: 1, durationSec: 30, rpe: 5, pain: 0 },
      { setNumber: 2, durationSec: 30, rpe: 5, pain: 0 },
    ];
    const result = evaluateProgression("ex-1", "Plank", sets, 10, 3);
    expect(result).toBeNull();
  });

  it("reason string includes relevant info", () => {
    const sets = makeSets(3, { reps: 12, rpe: 6, pain: 1 });
    const result = evaluateProgression("ex-1", "Machine Press", sets, 100, 3);

    expect(result).not.toBeNull();
    expect(result!.reason).toContain("3 sets");
    expect(result!.reason).toContain("12+ reps");
    expect(result!.reason).toContain("+5lb");
  });
});
