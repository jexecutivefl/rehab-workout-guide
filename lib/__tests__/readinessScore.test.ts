import { calculateReadiness, getReadinessLevel } from "../readinessScore";

describe("calculateReadiness", () => {
  it("returns 100 for perfect scores (no pain, max energy/sleep, no stiffness)", () => {
    const score = calculateReadiness({
      elbowPain: 0,
      shoulderPain: 0,
      footPain: 0,
      energyLevel: 10,
      sleepQuality: 10,
      stiffnessLevel: 0,
    });
    expect(score).toBe(100);
  });

  it("returns 0 for worst possible scores", () => {
    const score = calculateReadiness({
      elbowPain: 10,
      shoulderPain: 10,
      footPain: 10,
      energyLevel: 0,
      sleepQuality: 0,
      stiffnessLevel: 10,
    });
    expect(score).toBe(0);
  });

  it("uses the worst pain across all injuries", () => {
    const highElbow = calculateReadiness({
      elbowPain: 8,
      shoulderPain: 2,
      footPain: 2,
      energyLevel: 7,
      sleepQuality: 7,
      stiffnessLevel: 3,
    });
    const highShoulder = calculateReadiness({
      elbowPain: 2,
      shoulderPain: 8,
      footPain: 2,
      energyLevel: 7,
      sleepQuality: 7,
      stiffnessLevel: 3,
    });
    // Both should produce the same score since worst pain is 8 in both cases
    expect(highElbow).toBe(highShoulder);
  });

  it("pain has the highest weight (40%)", () => {
    // High pain, everything else perfect
    const highPain = calculateReadiness({
      elbowPain: 10,
      shoulderPain: 0,
      footPain: 0,
      energyLevel: 10,
      sleepQuality: 10,
      stiffnessLevel: 0,
    });
    // Should lose 40% from pain alone
    expect(highPain).toBe(60);
  });

  it("returns a mid-range score for moderate values", () => {
    const score = calculateReadiness({
      elbowPain: 4,
      shoulderPain: 3,
      footPain: 2,
      energyLevel: 6,
      sleepQuality: 6,
      stiffnessLevel: 4,
    });
    // Pain component: (10-4)/10 * 0.4 = 0.24
    // Energy: 6/10 * 0.3 = 0.18
    // Sleep: 6/10 * 0.2 = 0.12
    // Stiffness: (10-4)/10 * 0.1 = 0.06
    // Total: 0.6 * 100 = 60
    expect(score).toBe(60);
  });
});

describe("getReadinessLevel", () => {
  it("returns rest for score ≤ 30", () => {
    expect(getReadinessLevel(0).level).toBe("rest");
    expect(getReadinessLevel(20).level).toBe("rest");
    expect(getReadinessLevel(30).level).toBe("rest");
  });

  it("returns recovery for score 31-50", () => {
    expect(getReadinessLevel(31).level).toBe("recovery");
    expect(getReadinessLevel(40).level).toBe("recovery");
    expect(getReadinessLevel(50).level).toBe("recovery");
  });

  it("returns modified for score 51-70", () => {
    expect(getReadinessLevel(51).level).toBe("modified");
    expect(getReadinessLevel(60).level).toBe("modified");
    expect(getReadinessLevel(70).level).toBe("modified");
  });

  it("returns normal for score 71-85", () => {
    expect(getReadinessLevel(71).level).toBe("normal");
    expect(getReadinessLevel(80).level).toBe("normal");
    expect(getReadinessLevel(85).level).toBe("normal");
  });

  it("returns good for score 86-100", () => {
    expect(getReadinessLevel(86).level).toBe("good");
    expect(getReadinessLevel(95).level).toBe("good");
    expect(getReadinessLevel(100).level).toBe("good");
  });
});
