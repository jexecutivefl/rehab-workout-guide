import { checkForAlerts, SessionSummary } from "../alertEngine";

function makeSession(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    date: new Date().toISOString(),
    sessionType: "UPPER_BODY",
    preSessionPain: 3,
    postSessionPain: 3,
    preSessionEnergy: 7,
    totalSets: 15,
    avgRpe: 6,
    flaggedForReview: false,
    ...overrides,
  };
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

describe("checkForAlerts", () => {
  it("returns empty array for no sessions", () => {
    expect(checkForAlerts([])).toEqual([]);
  });

  it("returns empty array for healthy sessions", () => {
    const sessions = [
      makeSession({ date: daysAgo(3), postSessionPain: 2 }),
      makeSession({ date: daysAgo(2), postSessionPain: 2 }),
      makeSession({ date: daysAgo(1), postSessionPain: 2 }),
    ];
    const alerts = checkForAlerts(sessions);
    // Should have no critical alerts (may have missed sessions info depending on timing)
    const critical = alerts.filter((a) => a.severity === "critical");
    expect(critical).toHaveLength(0);
  });

  describe("pain trending up", () => {
    it("detects 3 consecutive sessions with increasing post-pain", () => {
      const sessions = [
        makeSession({ date: daysAgo(3), postSessionPain: 3 }),
        makeSession({ date: daysAgo(2), postSessionPain: 5 }),
        makeSession({ date: daysAgo(1), postSessionPain: 7 }),
      ];
      const alerts = checkForAlerts(sessions);
      expect(alerts.some((a) => a.id === "pain-trending-up")).toBe(true);
    });

    it("does not trigger when pain is stable", () => {
      const sessions = [
        makeSession({ date: daysAgo(3), postSessionPain: 3 }),
        makeSession({ date: daysAgo(2), postSessionPain: 3 }),
        makeSession({ date: daysAgo(1), postSessionPain: 3 }),
      ];
      const alerts = checkForAlerts(sessions);
      expect(alerts.some((a) => a.id === "pain-trending-up")).toBe(false);
    });
  });

  describe("stage regression risk", () => {
    it("detects 3 consecutive high-pain sessions", () => {
      const sessions = [
        makeSession({ date: daysAgo(3), postSessionPain: 6 }),
        makeSession({ date: daysAgo(2), postSessionPain: 7 }),
        makeSession({ date: daysAgo(1), postSessionPain: 5 }),
      ];
      const alerts = checkForAlerts(sessions);
      expect(alerts.some((a) => a.id === "stage-regression-risk")).toBe(true);
    });

    it("does not trigger with low pain", () => {
      const sessions = [
        makeSession({ date: daysAgo(3), postSessionPain: 3 }),
        makeSession({ date: daysAgo(2), postSessionPain: 4 }),
        makeSession({ date: daysAgo(1), postSessionPain: 3 }),
      ];
      const alerts = checkForAlerts(sessions);
      expect(alerts.some((a) => a.id === "stage-regression-risk")).toBe(false);
    });
  });

  describe("overtraining", () => {
    it("detects 7 sessions in a week with high RPE", () => {
      const sessions = Array.from({ length: 7 }, (_, i) =>
        makeSession({ date: daysAgo(i), avgRpe: 8, totalSets: 20 })
      );
      const alerts = checkForAlerts(sessions);
      expect(alerts.some((a) => a.id === "overtraining-risk")).toBe(true);
    });

    it("does not trigger with 6 or fewer sessions", () => {
      const sessions = Array.from({ length: 6 }, (_, i) =>
        makeSession({ date: daysAgo(i), avgRpe: 8 })
      );
      const alerts = checkForAlerts(sessions);
      expect(alerts.some((a) => a.id === "overtraining-risk")).toBe(false);
    });
  });
});
