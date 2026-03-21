import {
  getDeskExercises,
  buildDeskSession,
  estimateSessionDuration,
} from "@/lib/deskRehab";
import type { InjuryContext, InjuryStage } from "@/types/index";

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

// ─── getDeskExercises ─────────────────────────────────────────

describe("getDeskExercises", () => {
  it("returns only exercises with isDesk === true (all IDs start with 'desk-')", () => {
    const ctx = makeCtx();
    const exercises = getDeskExercises(ctx);
    expect(exercises.length).toBeGreaterThan(0);
    for (const ex of exercises) {
      expect(ex.id).toMatch(/^desk-/);
    }
  });

  it("all returned exercises have safetyResult that is NOT 'AVOID'", () => {
    const ctx = makeCtx();
    const exercises = getDeskExercises(ctx);
    for (const ex of exercises) {
      expect(ex.safetyResult.safety).not.toBe("AVOID");
    }
  });

  it("body part filter 'shoulder' returns only desk-shoulder-* exercises", () => {
    const ctx = makeCtx();
    const exercises = getDeskExercises(ctx, { bodyPart: "shoulder" });
    expect(exercises.length).toBeGreaterThan(0);
    for (const ex of exercises) {
      expect(ex.id).toMatch(/^desk-shoulder-/);
    }
  });

  it("body part filter 'elbow' returns only desk-elbow-* exercises", () => {
    const ctx = makeCtx();
    const exercises = getDeskExercises(ctx, { bodyPart: "elbow" });
    expect(exercises.length).toBeGreaterThan(0);
    for (const ex of exercises) {
      expect(ex.id).toMatch(/^desk-elbow-/);
    }
  });

  it("body part filter 'foot' returns only desk-pf-* exercises", () => {
    const ctx = makeCtx();
    const exercises = getDeskExercises(ctx, { bodyPart: "foot" });
    expect(exercises.length).toBeGreaterThan(0);
    for (const ex of exercises) {
      expect(ex.id).toMatch(/^desk-pf-/);
    }
  });

  it("with 'all' filter returns all desk exercises", () => {
    const ctx = makeCtx();
    const allExercises = getDeskExercises(ctx);
    const filteredAll = getDeskExercises(ctx, { bodyPart: "all" });
    expect(filteredAll.length).toBe(allExercises.length);
  });

  it("with no filter returns all desk exercises", () => {
    const ctx = makeCtx();
    const noFilter = getDeskExercises(ctx);
    const undefinedFilter = getDeskExercises(ctx, undefined);
    expect(noFilter.length).toBe(undefinedFilter.length);
    expect(noFilter.length).toBeGreaterThan(0);
  });

  it("results sorted: SAFE before MODIFIED", () => {
    const ctx = makeCtx();
    const exercises = getDeskExercises(ctx);
    let seenModified = false;
    for (const ex of exercises) {
      if (ex.safetyResult.safety === "MODIFIED") {
        seenModified = true;
      }
      if (seenModified && ex.safetyResult.safety === "SAFE") {
        fail("Found SAFE exercise after MODIFIED — sort order violated");
      }
    }
  });

  it("stage 1 injuries still get safe desk exercises (desk exercises have no contraindications)", () => {
    const ctx = makeCtx({
      pfStage: 1,
      pfPain: 5,
      elbowStage: 1,
      elbowPain: 5,
      shoulderStage: 1,
      shoulderPain: 5,
    });
    const exercises = getDeskExercises(ctx);
    expect(exercises.length).toBeGreaterThan(0);
    for (const ex of exercises) {
      expect(ex.safetyResult.safety).not.toBe("AVOID");
    }
  });
});

// ─── buildDeskSession ─────────────────────────────────────────

describe("buildDeskSession", () => {
  it("returns a balanced set (exercises from multiple body parts)", () => {
    const ctx = makeCtx();
    const session = buildDeskSession(ctx);
    const bodyParts = new Set(
      session.map((ex) => {
        if (ex.id.startsWith("desk-shoulder-")) return "shoulder";
        if (ex.id.startsWith("desk-elbow-")) return "elbow";
        if (ex.id.startsWith("desk-pf-")) return "foot";
        return "general";
      })
    );
    expect(bodyParts.size).toBeGreaterThanOrEqual(2);
  });

  it("all exercises pass injury engine (safetyResult not AVOID)", () => {
    const ctx = makeCtx();
    const session = buildDeskSession(ctx);
    for (const ex of session) {
      expect(ex.safetyResult.safety).not.toBe("AVOID");
    }
  });

  it("exercises have sequential orderIndex (0, 1, 2, ...)", () => {
    const ctx = makeCtx();
    const session = buildDeskSession(ctx);
    expect(session.length).toBeGreaterThan(0);
    for (let i = 0; i < session.length; i++) {
      expect(session[i].orderIndex).toBe(i);
    }
  });

  it("default time budget (~10 min) limits the number of exercises", () => {
    const ctx = makeCtx();
    const session = buildDeskSession(ctx);
    // With a 10-minute budget, we shouldn't get all 14 desk exercises
    const allExercises = getDeskExercises(ctx);
    expect(session.length).toBeLessThanOrEqual(allExercises.length);
    // Should be a reasonable subset — at most 7 (2 per body part + 1 general)
    expect(session.length).toBeLessThanOrEqual(7);
    expect(session.length).toBeGreaterThan(0);
  });

  it("custom maxMinutes parameter is respected", () => {
    const ctx = makeCtx();
    const shortSession = buildDeskSession(ctx, 3);
    const longSession = buildDeskSession(ctx, 30);
    expect(longSession.length).toBeGreaterThanOrEqual(shortSession.length);
  });
});

// ─── estimateSessionDuration ──────────────────────────────────

describe("estimateSessionDuration", () => {
  it("returns a number > 0 for non-empty exercise list", () => {
    const ctx = makeCtx();
    const session = buildDeskSession(ctx);
    const duration = estimateSessionDuration(session);
    expect(duration).toBeGreaterThan(0);
  });

  it("returns 0 for empty list", () => {
    const duration = estimateSessionDuration([]);
    expect(duration).toBe(0);
  });

  it("estimates are reasonable (< 15 min for a typical desk session)", () => {
    const ctx = makeCtx();
    const session = buildDeskSession(ctx);
    const duration = estimateSessionDuration(session);
    expect(duration).toBeLessThanOrEqual(15);
  });
});
