/**
 * Alert Engine — detects overtraining, regression, and other risk signals.
 *
 * Analyzes recent session data and produces actionable alerts for the dashboard.
 */

// ─── Types ───────────────────────────────────────────────────

export type AlertSeverity = "info" | "warning" | "critical";

export type Alert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionLabel?: string;
};

export type SessionSummary = {
  date: string;
  sessionType: string;
  preSessionPain: number;
  postSessionPain: number;
  preSessionEnergy: number;
  totalSets: number;
  avgRpe: number;
  flaggedForReview: boolean;
};

// ─── Public API ──────────────────────────────────────────────

/**
 * Analyze recent sessions and return any alerts.
 * Sessions should be sorted by date ascending (oldest first).
 */
export function checkForAlerts(recentSessions: SessionSummary[]): Alert[] {
  const alerts: Alert[] = [];

  if (recentSessions.length === 0) return alerts;

  // Check: Pain trending up
  const painTrend = checkPainTrending(recentSessions);
  if (painTrend) alerts.push(painTrend);

  // Check: Volume regression
  const volumeAlert = checkVolumeRegression(recentSessions);
  if (volumeAlert) alerts.push(volumeAlert);

  // Check: Missed sessions
  const missedAlert = checkMissedSessions(recentSessions);
  if (missedAlert) alerts.push(missedAlert);

  // Check: Overtraining
  const overtrainingAlert = checkOvertraining(recentSessions);
  if (overtrainingAlert) alerts.push(overtrainingAlert);

  // Check: Stage regression risk
  const regressionAlert = checkStageRegressionRisk(recentSessions);
  if (regressionAlert) alerts.push(regressionAlert);

  return alerts;
}

// ─── Individual Checks ──────────────────────────────────────

/**
 * Pain trending up: post-session pain increased for 3 consecutive sessions.
 */
function checkPainTrending(sessions: SessionSummary[]): Alert | null {
  if (sessions.length < 3) return null;

  const lastThree = sessions.slice(-3);
  const allIncreasing =
    lastThree[1].postSessionPain > lastThree[0].postSessionPain &&
    lastThree[2].postSessionPain > lastThree[1].postSessionPain;

  if (allIncreasing && lastThree[2].postSessionPain >= 4) {
    return {
      id: "pain-trending-up",
      severity: "warning",
      title: "Pain Trending Up",
      message: `Post-session pain has increased for 3 consecutive sessions (${lastThree[0].postSessionPain} → ${lastThree[1].postSessionPain} → ${lastThree[2].postSessionPain}). Consider a deload or rest day.`,
      actionLabel: "Take a rest day",
    };
  }
  return null;
}

/**
 * Volume regression: total weekly sets decreased for 2 consecutive weeks.
 */
function checkVolumeRegression(sessions: SessionSummary[]): Alert | null {
  if (sessions.length < 6) return null;

  // Group sessions into rough weeks (last 7 days vs previous 7 days)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeek = sessions.filter((s) => new Date(s.date) >= oneWeekAgo);
  const lastWeek = sessions.filter(
    (s) => new Date(s.date) >= twoWeeksAgo && new Date(s.date) < oneWeekAgo
  );

  if (thisWeek.length === 0 || lastWeek.length === 0) return null;

  const thisWeekSets = thisWeek.reduce((sum, s) => sum + s.totalSets, 0);
  const lastWeekSets = lastWeek.reduce((sum, s) => sum + s.totalSets, 0);

  if (thisWeekSets < lastWeekSets * 0.7) {
    return {
      id: "volume-regression",
      severity: "info",
      title: "Volume Decreasing",
      message: `This week's volume (${thisWeekSets} sets) is significantly lower than last week (${lastWeekSets} sets). This is OK if it's a planned deload.`,
    };
  }
  return null;
}

/**
 * Missed sessions: fewer than 3 sessions in the past 7 days.
 */
function checkMissedSessions(sessions: SessionSummary[]): Alert | null {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = sessions.filter((s) => new Date(s.date) >= oneWeekAgo);

  if (thisWeek.length < 3 && sessions.length >= 3) {
    return {
      id: "missed-sessions",
      severity: "info",
      title: "Low Session Count",
      message: `Only ${thisWeek.length} session(s) logged this week. Aim for at least 3 to maintain progress.`,
      actionLabel: "Start a workout",
    };
  }
  return null;
}

/**
 * Overtraining: more than 6 sessions in 7 days with avg RPE > 7.
 */
function checkOvertraining(sessions: SessionSummary[]): Alert | null {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = sessions.filter((s) => new Date(s.date) >= oneWeekAgo);

  if (thisWeek.length > 6) {
    const avgRpe =
      thisWeek.reduce((sum, s) => sum + s.avgRpe, 0) / thisWeek.length;
    if (avgRpe > 7) {
      return {
        id: "overtraining-risk",
        severity: "critical",
        title: "Overtraining Risk",
        message: `${thisWeek.length} sessions in 7 days with avg RPE ${avgRpe.toFixed(1)}. Take a rest day to prevent injury regression.`,
        actionLabel: "Schedule rest",
      };
    }
  }
  return null;
}

/**
 * Stage regression risk: pain consistently ≥ 5 across recent sessions.
 * Indicates the current injury stage may be too aggressive.
 */
function checkStageRegressionRisk(sessions: SessionSummary[]): Alert | null {
  if (sessions.length < 3) return null;

  const lastThree = sessions.slice(-3);
  const allHighPain = lastThree.every((s) => s.postSessionPain >= 5);

  if (allHighPain) {
    return {
      id: "stage-regression-risk",
      severity: "critical",
      title: "Possible Stage Regression Needed",
      message: "Post-session pain has been ≥ 5 for 3 consecutive sessions. Your injury stage may be set too aggressively. Consider moving back a stage.",
      actionLabel: "Review injury stages",
    };
  }
  return null;
}
