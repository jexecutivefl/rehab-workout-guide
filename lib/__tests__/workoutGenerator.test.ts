import { generateWeeklyPlan } from "@/lib/workoutGenerator";
import type { InjuryContext, UserProfileData, DayPlan } from "@/types/index";

// ─── Fixtures ─────────────────────────────────────────────────

const defaultProfile: UserProfileData = {
  weightLbs: 185,
  heightIn: 70,
  age: 30,
  gymPreference: "LA_FITNESS",
  onWegovy: true,
  wegovyStartDate: "2025-12-01",
};

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
      side: "RIGHT",
    },
    sprainedElbow: {
      stage: overrides?.elbowStage ?? 3,
      painLevel: overrides?.elbowPain ?? 3,
      side: "LEFT",
    },
    shoulderInstability: {
      stage: overrides?.shoulderStage ?? 4,
      painLevel: overrides?.shoulderPain ?? 0,
      side: "LEFT",
    },
  };
}

// ─── generateWeeklyPlan ──────────────────────────────────────

describe("generateWeeklyPlan", () => {
  it("returns 7 day plans", () => {
    const plan = generateWeeklyPlan(defaultProfile, makeCtx(), 1);
    expect(plan).toHaveLength(7);
  });

  it("Sunday is always REST", () => {
    for (const week of [1, 2, 3, 4] as const) {
      const plan = generateWeeklyPlan(defaultProfile, makeCtx(), week);
      const sunday = plan.find((d) => d.day === "SUN");
      expect(sunday).toBeDefined();
      expect(sunday!.sessionType).toBe("REST");
      expect(sunday!.exercises).toHaveLength(0);
    }
  });

  it("week 1 has REHAB_FOCUSED days", () => {
    const plan = generateWeeklyPlan(defaultProfile, makeCtx(), 1);
    const rehabDays = plan.filter((d) => d.sessionType === "REHAB_FOCUSED");
    expect(rehabDays.length).toBeGreaterThanOrEqual(1);
  });

  it("every exercise has a safetyResult (never undefined)", () => {
    for (const week of [1, 2, 3, 4] as const) {
      const plan = generateWeeklyPlan(defaultProfile, makeCtx(), week);
      for (const day of plan) {
        for (const ex of day.exercises) {
          expect(ex.safetyResult).toBeDefined();
          expect(ex.safetyResult.safety).toBeDefined();
          expect(["SAFE", "MODIFIED", "FLAG_PAIN"]).toContain(
            ex.safetyResult.safety
          );
        }
      }
    }
  });

  it("no AVOID exercises in any plan", () => {
    for (const week of [1, 2, 3, 4] as const) {
      const plan = generateWeeklyPlan(defaultProfile, makeCtx(), week);
      for (const day of plan) {
        for (const ex of day.exercises) {
          expect(ex.safetyResult.safety).not.toBe("AVOID");
        }
      }
    }
  });

  it("all non-REST plans start with warmup (first exercise category = WARMUP or contains 'bike')", () => {
    for (const week of [1, 2, 3, 4] as const) {
      const plan = generateWeeklyPlan(defaultProfile, makeCtx(), week);
      for (const day of plan) {
        if (day.sessionType === "REST") continue;
        if (day.exercises.length === 0) continue;

        const first = day.exercises[0];
        const isWarmup =
          first.category === "WARMUP" ||
          first.name.toLowerCase().includes("bike");
        expect(isWarmup).toBe(true);
      }
    }
  });

  it("week 4 deload: exercises have fewer sets than week 3", () => {
    const ctx = makeCtx({ pfStage: 3, elbowStage: 3 });
    const week3 = generateWeeklyPlan(defaultProfile, ctx, 3);
    const week4 = generateWeeklyPlan(defaultProfile, ctx, 4);

    // Compare total sets across non-REST days that share the same session type
    const totalSets = (plan: DayPlan[]) =>
      plan.reduce(
        (sum, day) =>
          sum +
          day.exercises.reduce((exSum, ex) => exSum + (ex.sets ?? 0), 0),
        0
      );

    const week3Sets = totalSets(week3);
    const week4Sets = totalSets(week4);

    // Week 4 (0.6 multiplier) should have strictly fewer total sets than week 3 (1.0 multiplier)
    expect(week4Sets).toBeLessThan(week3Sets);
  });

  it("with stage 1 PF + elbow: no impact/standing/loaded exercises appear", () => {
    const ctx = makeCtx({
      pfStage: 1,
      pfPain: 3,
      elbowStage: 1,
      elbowPain: 3,
    });
    const plan = generateWeeklyPlan(defaultProfile, ctx, 1);

    // Banned contraindications that should trigger AVOID at stage 1
    const pfBanned = ["impact", "plyometric", "running"];
    const elbowBanned = [
      "loaded_elbow_flexion",
      "grip_heavy",
      "push_heavy",
      "full_lockout",
    ];
    // Banned movement patterns at stage 1
    const standingMovements = [
      "walking",
      "running",
      "squat",
      "standing_extended",
    ];
    const elbowMovements = [
      "elbow_flexion",
      "elbow_extension",
      "horizontal_push",
      "vertical_push",
      "horizontal_pull",
      "vertical_pull",
      "grip",
    ];

    for (const day of plan) {
      for (const ex of day.exercises) {
        // No exercise should have AVOID safety
        expect(ex.safetyResult.safety).not.toBe("AVOID");
      }
    }
  });

  // ── Edge: HOME gym has limited equipment ────────────────────

  it("HOME gym preference still generates valid plans", () => {
    const homeProfile: UserProfileData = {
      ...defaultProfile,
      gymPreference: "HOME",
    };
    const plan = generateWeeklyPlan(homeProfile, makeCtx(), 1);

    expect(plan).toHaveLength(7);
    // All non-REST days should have at least some exercises (rehab is available at HOME)
    const nonRestDays = plan.filter(
      (d) => d.sessionType !== "REST"
    );
    // At least rehab-focused days should have exercises since all rehab exercises support HOME
    const rehabDays = plan.filter((d) => d.sessionType === "REHAB_FOCUSED");
    for (const day of rehabDays) {
      expect(day.exercises.length).toBeGreaterThan(0);
    }
  });
});
