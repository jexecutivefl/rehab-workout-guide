import {
  buildSystemPrompt,
  extractExerciseNames,
  filterResponseExercises,
} from "@/lib/aiCoach";
import type { InjuryContext, ExerciseDefinition, UserProfileData } from "@/types/index";

// ─── Helpers ──────────────────────────────────────────────────

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
      stage: overrides?.pfStage ?? 1,
      painLevel: overrides?.pfPain ?? 3,
      side: "RIGHT",
    },
    sprainedElbow: {
      stage: overrides?.elbowStage ?? 1,
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

const defaultProfile: UserProfileData = {
  weightLbs: 180,
  age: 35,
  gymPreference: "LA_FITNESS",
  onWegovy: false,
};

const testPool: ExerciseDefinition[] = [
  {
    id: "test-safe",
    name: "Towel Toe Curls",
    category: "REHAB",
    movements: ["toe_flexion"],
    muscles: ["foot_intrinsics"],
    contraindications: [],
    equipment: ["HOME"],
    isRehab: true,
    defaultSets: 3,
    defaultRepsMin: 10,
    defaultRepsMax: 15,
    defaultRestSec: 30,
    formCues: ["Curl toes"],
  },
  {
    id: "test-impact",
    name: "Box Jumps",
    category: "STRENGTH",
    movements: ["jump", "landing"],
    muscles: ["quads", "glutes"],
    contraindications: ["impact", "plyometric"],
    equipment: ["LA_FITNESS"],
    isRehab: false,
    defaultSets: 3,
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSec: 60,
    formCues: ["Land softly"],
  },
  {
    id: "test-elbow",
    name: "Barbell Curl",
    category: "STRENGTH",
    movements: ["elbow_flexion", "loaded_elbow_flexion"],
    muscles: ["biceps"],
    contraindications: ["loaded_elbow_flexion"],
    equipment: ["LA_FITNESS"],
    isRehab: false,
    defaultSets: 3,
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    defaultRestSec: 60,
    formCues: ["Control the negative"],
  },
];

// ─── buildSystemPrompt ──────────────────────────────────────

describe("buildSystemPrompt", () => {
  it("includes injury context in the prompt", () => {
    const prompt = buildSystemPrompt(makeCtx(), defaultProfile, testPool);

    expect(prompt).toContain("Plantar Fasciitis");
    expect(prompt).toContain("Stage 1/4");
    expect(prompt).toContain("Sprained Elbow");
    expect(prompt).toContain("180 lbs");
    expect(prompt).toContain("LA_FITNESS");
  });

  it("includes exercise names from the pool", () => {
    const prompt = buildSystemPrompt(makeCtx(), defaultProfile, testPool);

    expect(prompt).toContain("Towel Toe Curls");
    expect(prompt).toContain("Box Jumps");
    expect(prompt).toContain("Barbell Curl");
  });

  it("lists rehab exercises separately", () => {
    const prompt = buildSystemPrompt(makeCtx(), defaultProfile, testPool);

    // Rehab exercises section should include towel toe curls
    const rehabSection = prompt.split("Rehab-Specific Exercises")[1];
    expect(rehabSection).toContain("Towel Toe Curls");
    // Box Jumps is not a rehab exercise
    expect(rehabSection).not.toContain("Box Jumps");
  });

  it("includes Wegovy status when applicable", () => {
    const prompt = buildSystemPrompt(
      makeCtx(),
      { ...defaultProfile, onWegovy: true },
      testPool
    );

    expect(prompt).toContain("Yes");
  });

  it("includes restrictions from injury engine", () => {
    const prompt = buildSystemPrompt(
      makeCtx({ pfStage: 1, elbowStage: 1 }),
      defaultProfile,
      testPool
    );

    // At stage 1, there should be restrictions listed
    expect(prompt).not.toContain("No active restrictions");
  });
});

// ─── extractExerciseNames ───────────────────────────────────

describe("extractExerciseNames", () => {
  it("finds exercise names in AI response text", () => {
    const response =
      "I recommend starting with Towel Toe Curls for your foot, then doing some Box Jumps for power.";

    const found = extractExerciseNames(response, testPool);

    expect(found).toContain("Towel Toe Curls");
    expect(found).toContain("Box Jumps");
    expect(found).not.toContain("Barbell Curl");
  });

  it("is case-insensitive", () => {
    const response = "Try doing towel toe curls and barbell curl today.";

    const found = extractExerciseNames(response, testPool);

    expect(found).toContain("Towel Toe Curls");
    expect(found).toContain("Barbell Curl");
  });

  it("returns empty array when no exercises match", () => {
    const response = "Just rest today and drink plenty of water.";

    const found = extractExerciseNames(response, testPool);

    expect(found).toHaveLength(0);
  });

  it("deduplicates exercise names", () => {
    const response =
      "Do Towel Toe Curls in the morning. Later, repeat Towel Toe Curls before bed.";

    const found = extractExerciseNames(response, testPool);

    expect(found.filter((n) => n === "Towel Toe Curls")).toHaveLength(1);
  });
});

// ─── filterResponseExercises ────────────────────────────────

describe("filterResponseExercises", () => {
  it("flags AVOID exercises with warning", () => {
    // PF stage 1 → impact exercises should be AVOID
    const ctx = makeCtx({ pfStage: 1, pfPain: 5 });
    const response = "For cardio, try Box Jumps for a great workout.";

    const { safeResponse, flaggedExercises } = filterResponseExercises(
      response,
      ctx,
      testPool
    );

    expect(flaggedExercises).toContain("Box Jumps");
    expect(safeResponse).toContain("AVOID");
  });

  it("adds modification notes for MODIFIED exercises", () => {
    // Elbow stage 2 → loaded elbow flexion should be MODIFIED
    const ctx = makeCtx({ elbowStage: 2, elbowPain: 3, pfStage: 4, shoulderStage: 4 });
    const response = "Try Barbell Curl with light weight.";

    const { safeResponse } = filterResponseExercises(
      response,
      ctx,
      testPool
    );

    // At stage 2, loaded elbow exercises should be either MODIFIED or AVOID
    expect(
      safeResponse.includes("MODIFY") || safeResponse.includes("AVOID")
    ).toBe(true);
  });

  it("leaves SAFE exercises unchanged", () => {
    // All injuries at stage 4 → everything should be safe
    const ctx = makeCtx({ pfStage: 4, elbowStage: 4, shoulderStage: 4 });
    const response = "Do Towel Toe Curls for your foot.";

    const { safeResponse, flaggedExercises } = filterResponseExercises(
      response,
      ctx,
      testPool
    );

    expect(flaggedExercises).toHaveLength(0);
    expect(safeResponse).toBe(response);
  });

  it("handles response with no exercises", () => {
    const ctx = makeCtx();
    const response = "Make sure to rest and stay hydrated today.";

    const { safeResponse, flaggedExercises } = filterResponseExercises(
      response,
      ctx,
      testPool
    );

    expect(flaggedExercises).toHaveLength(0);
    expect(safeResponse).toBe(response);
  });
});
