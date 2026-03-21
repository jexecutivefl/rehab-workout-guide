import type {
  CompletedSessionData,
  WorkoutAnalysis,
  ExerciseFrequency,
  MuscleGroupVolume,
} from "@/types/index";

/**
 * Analyzes completed workout session history within a rolling window.
 * Aggregates exercise frequency, muscle volume, and computes pain/RPE trends.
 */
export function analyzeWorkoutHistory(
  sessions: CompletedSessionData[],
  windowDays: number = 28
): WorkoutAnalysis {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const filtered = sessions.filter((s) => new Date(s.date) >= cutoff);
  const totalSessions = filtered.length;
  const avgSessionsPerWeek = totalSessions / (windowDays / 7);

  // --- Exercise frequency aggregation ---
  const exerciseMap = new Map<
    string,
    {
      exerciseName: string;
      count: number;
      lastUsedDate: string;
      rpeSum: number;
      painSum: number;
      setCount: number;
    }
  >();

  for (const session of filtered) {
    for (const ex of session.exercises) {
      if (ex.wasSkipped) continue;

      const existing = exerciseMap.get(ex.exerciseId);
      const setRpeSum = ex.sets.reduce((sum, s) => sum + s.rpe, 0);
      const setPainSum = ex.sets.reduce((sum, s) => sum + s.pain, 0);
      const setCount = ex.sets.length;

      if (existing) {
        existing.count += 1;
        existing.rpeSum += setRpeSum;
        existing.painSum += setPainSum;
        existing.setCount += setCount;
        if (session.date > existing.lastUsedDate) {
          existing.lastUsedDate = session.date;
        }
      } else {
        exerciseMap.set(ex.exerciseId, {
          exerciseName: ex.exerciseName,
          count: 1,
          lastUsedDate: session.date,
          rpeSum: setRpeSum,
          painSum: setPainSum,
          setCount,
        });
      }
    }
  }

  const exerciseFrequencies: ExerciseFrequency[] = [];
  for (const [exerciseId, data] of exerciseMap) {
    exerciseFrequencies.push({
      exerciseId,
      exerciseName: data.exerciseName,
      countInWindow: data.count,
      lastUsedDate: data.lastUsedDate,
      avgRpe: data.setCount > 0 ? data.rpeSum / data.setCount : 0,
      avgPain: data.setCount > 0 ? data.painSum / data.setCount : 0,
    });
  }

  // --- Muscle volume aggregation ---
  const muscleMap = new Map<
    string,
    { totalSets: number; totalReps: number; rpeSum: number; rpeCount: number; sessionDates: Set<string> }
  >();

  for (const session of filtered) {
    for (const ex of session.exercises) {
      if (ex.wasSkipped) continue;

      const sets = ex.sets.length;
      const reps = ex.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0);
      const rpeSum = ex.sets.reduce((sum, s) => sum + s.rpe, 0);

      for (const muscle of ex.muscles) {
        const existing = muscleMap.get(muscle);
        if (existing) {
          existing.totalSets += sets;
          existing.totalReps += reps;
          existing.rpeSum += rpeSum;
          existing.rpeCount += sets;
          existing.sessionDates.add(session.date);
        } else {
          muscleMap.set(muscle, {
            totalSets: sets,
            totalReps: reps,
            rpeSum,
            rpeCount: sets,
            sessionDates: new Set([session.date]),
          });
        }
      }
    }
  }

  const muscleVolumes: MuscleGroupVolume[] = [];
  for (const [muscle, data] of muscleMap) {
    muscleVolumes.push({
      muscle,
      totalSets: data.totalSets,
      totalReps: data.totalReps,
      avgRpe: data.rpeCount > 0 ? data.rpeSum / data.rpeCount : 0,
      sessionCount: data.sessionDates.size,
    });
  }

  // --- Pain and RPE trends (first half vs second half) ---
  const avgPainTrend = computeTrend(filtered, "pain");
  const avgRpeTrend = computeTrend(filtered, "rpe");

  return {
    windowDays,
    exerciseFrequencies,
    muscleVolumes,
    totalSessions,
    avgSessionsPerWeek,
    avgPainTrend,
    avgRpeTrend,
  };
}

/**
 * Returns a rotation score from 0 (fresh/unused) to 1 (heavily overused).
 * An exercise appearing in 50%+ of sessions is considered overused.
 */
export function getExerciseRotationScore(
  exerciseId: string,
  analysis: WorkoutAnalysis
): number {
  const freq = analysis.exerciseFrequencies.find(
    (f) => f.exerciseId === exerciseId
  );
  if (!freq) return 0;

  const maxExpectedUses = Math.ceil(analysis.totalSessions * 0.5);
  if (maxExpectedUses <= 0) return 0;

  return Math.min(freq.countInWindow / maxExpectedUses, 1);
}

/**
 * Returns muscles from targetMuscles that are significantly underworked
 * (below 60% of the average set volume across all tracked muscles).
 */
export function getMuscleBalanceGaps(
  analysis: WorkoutAnalysis,
  targetMuscles: string[]
): MuscleGroupVolume[] {
  if (analysis.muscleVolumes.length === 0) return [];

  const totalSetsAll = analysis.muscleVolumes.reduce(
    (sum, m) => sum + m.totalSets,
    0
  );
  const avgSets = totalSetsAll / analysis.muscleVolumes.length;
  const threshold = avgSets * 0.6;

  const volumeMap = new Map<string, MuscleGroupVolume>();
  for (const mv of analysis.muscleVolumes) {
    volumeMap.set(mv.muscle, mv);
  }

  const gaps: MuscleGroupVolume[] = [];
  for (const muscle of targetMuscles) {
    const vol = volumeMap.get(muscle);
    if (!vol) {
      // Muscle not trained at all — definitely a gap
      gaps.push({
        muscle,
        totalSets: 0,
        totalReps: 0,
        avgRpe: 0,
        sessionCount: 0,
      });
    } else if (vol.totalSets < threshold) {
      gaps.push(vol);
    }
  }

  return gaps;
}

// --- Internal helpers ---

function computeTrend(
  sessions: CompletedSessionData[],
  metric: "pain" | "rpe"
): number {
  if (sessions.length < 2) return 0;

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const avgForHalf = (half: CompletedSessionData[]): number => {
    let sum = 0;
    let count = 0;
    for (const session of half) {
      for (const ex of session.exercises) {
        if (ex.wasSkipped) continue;
        for (const set of ex.sets) {
          sum += metric === "pain" ? set.pain : set.rpe;
          count += 1;
        }
      }
    }
    return count > 0 ? sum / count : 0;
  };

  const firstAvg = avgForHalf(firstHalf);
  const secondAvg = avgForHalf(secondHalf);

  if (firstAvg === 0 && secondAvg === 0) return 0;

  // Normalize to -1..+1 range
  const maxVal = Math.max(firstAvg, secondAvg, 1);
  const diff = (secondAvg - firstAvg) / maxVal;

  return Math.max(-1, Math.min(1, diff));
}
