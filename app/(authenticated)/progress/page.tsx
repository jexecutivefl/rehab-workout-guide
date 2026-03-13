"use client";

import { useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProgressSummary } from "@/components/progress/ProgressSummary";
import { WeightTrendChart } from "@/components/progress/WeightTrendChart";
import { VolumeChart } from "@/components/progress/VolumeChart";
import { StrengthProgressChart } from "@/components/progress/StrengthProgressChart";
import { WorkoutHeatmap } from "@/components/progress/WorkoutHeatmap";
import { Card, CardContent } from "@/components/ui/card";
import {
  useWorkoutSessions,
  useBodyMetrics,
  useUserProfile,
} from "@/hooks/useAmplifyData";
import { client } from "@/lib/amplifyClient";
import { useQuery } from "@tanstack/react-query";

/**
 * Progress Page
 *
 * All charts and stats are driven by real Amplify data:
 * - Weight trend from BodyMetric records
 * - Volume, strength, heatmap from WorkoutSession + CompletedExerciseRecord + CompletedSetRecord
 * - Summary stats computed from sessions
 */
export default function ProgressPage() {
  const { data: sessions, isLoading: sessionsLoading } = useWorkoutSessions(50);
  const { data: bodyMetrics, isLoading: metricsLoading } = useBodyMetrics(50);
  const { data: userProfile } = useUserProfile();

  // Fetch completed exercises with sets for all sessions
  const sessionIds = useMemo(
    () => sessions?.map((s) => s.id) ?? [],
    [sessions]
  );

  const { data: exerciseRecords } = useQuery({
    queryKey: ["completedExercises", sessionIds],
    queryFn: async () => {
      if (sessionIds.length === 0) return [];
      // Fetch exercise records for each session
      const allRecords = [];
      for (const sessionId of sessionIds) {
        const { data, errors } = await client.models.CompletedExerciseRecord.list({
          filter: { workoutSessionId: { eq: sessionId } },
        } as Parameters<typeof client.models.CompletedExerciseRecord.list>[0]);
        if (!errors?.length && data) {
          allRecords.push(...data.map((r) => ({ ...r, workoutSessionId: sessionId })));
        }
      }
      return allRecords;
    },
    enabled: sessionIds.length > 0,
  });

  const { data: setRecords } = useQuery({
    queryKey: ["completedSets", exerciseRecords?.length],
    queryFn: async () => {
      if (!exerciseRecords || exerciseRecords.length === 0) return [];
      const allSets = [];
      for (const ex of exerciseRecords) {
        const { data, errors } = await client.models.CompletedSetRecord.list({
          filter: { completedExerciseRecordId: { eq: ex.id } },
        } as Parameters<typeof client.models.CompletedSetRecord.list>[0]);
        if (!errors?.length && data) {
          allSets.push(
            ...data.map((s) => ({
              ...s,
              exerciseRecordId: ex.id,
              exerciseName: ex.exerciseName,
              sessionId: ex.workoutSessionId,
            }))
          );
        }
      }
      return allSets;
    },
    enabled: (exerciseRecords?.length ?? 0) > 0,
  });

  const isLoading = sessionsLoading || metricsLoading;

  // ─── Weight Trend Data ────────────────────────────────────
  const weightData = useMemo(() => {
    if (!bodyMetrics) return [];
    return [...bodyMetrics]
      .filter((m) => m.date && m.weightLbs != null)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
      .map((m) => ({
        date: m.date!,
        weightLbs: m.weightLbs!,
      }));
  }, [bodyMetrics]);

  // ─── Volume Data (sets per muscle group per week) ─────────
  const volumeData = useMemo(() => {
    if (!sessions || !exerciseRecords) return [];

    // Group sessions by week
    const weekMap = new Map<string, { chest: number; back: number; shoulders: number; legs: number; arms: number; core: number }>();

    for (const session of sessions) {
      if (!session.startedAt) continue;
      const d = new Date(session.startedAt);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { chest: 0, back: 0, shoulders: 0, legs: 0, arms: 0, core: 0 });
      }
    }

    // Count sets per exercise per week
    for (const ex of exerciseRecords) {
      const session = sessions.find((s) => s.id === ex.workoutSessionId);
      if (!session?.startedAt) continue;

      const d = new Date(session.startedAt);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const week = weekMap.get(weekKey);
      if (!week) continue;

      const setsForEx = setRecords?.filter((s) => s.exerciseRecordId === ex.id).length ?? 1;
      const name = (ex.exerciseName ?? "").toLowerCase();

      // Simple muscle group inference from exercise name
      if (name.includes("bench") || name.includes("chest") || name.includes("fly") || name.includes("push")) {
        week.chest += setsForEx;
      } else if (name.includes("row") || name.includes("pull") || name.includes("lat") || name.includes("back")) {
        week.back += setsForEx;
      } else if (name.includes("shoulder") || name.includes("press") || name.includes("delt") || name.includes("lateral")) {
        week.shoulders += setsForEx;
      } else if (name.includes("squat") || name.includes("leg") || name.includes("lunge") || name.includes("calf") || name.includes("hamstring") || name.includes("glute")) {
        week.legs += setsForEx;
      } else if (name.includes("curl") || name.includes("tricep") || name.includes("bicep") || name.includes("arm")) {
        week.arms += setsForEx;
      } else if (name.includes("core") || name.includes("plank") || name.includes("crunch") || name.includes("ab")) {
        week.core += setsForEx;
      }
    }

    return Array.from(weekMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([week, counts]) => ({ week, ...counts }));
  }, [sessions, exerciseRecords, setRecords]);

  // ─── Strength Progress Data ───────────────────────────────
  const strengthData = useMemo(() => {
    if (!setRecords || !sessions) return [];

    // Group by exercise name, track max weight per session
    const exerciseMap = new Map<string, { date: string; weightLbs: number }[]>();

    for (const set of setRecords) {
      if (!set.weightLbs || !set.exerciseName) continue;
      const session = sessions.find((s) => s.id === set.sessionId);
      if (!session?.startedAt) continue;

      const date = new Date(session.startedAt).toISOString().split("T")[0];
      const name = set.exerciseName;

      if (!exerciseMap.has(name)) exerciseMap.set(name, []);
      const entries = exerciseMap.get(name)!;

      const existing = entries.find((e) => e.date === date);
      if (existing) {
        existing.weightLbs = Math.max(existing.weightLbs, set.weightLbs);
      } else {
        entries.push({ date, weightLbs: set.weightLbs });
      }
    }

    // Only include exercises with 2+ data points
    return Array.from(exerciseMap.entries())
      .filter(([, entries]) => entries.length >= 2)
      .slice(0, 5)
      .map(([exerciseName, entries]) => ({
        exerciseName,
        entries: entries.sort((a, b) => a.date.localeCompare(b.date)),
      }));
  }, [setRecords, sessions]);

  // ─── Workout Heatmap Data ─────────────────────────────────
  const heatmapData = useMemo(() => {
    if (!sessions) return [];

    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 12 * 7);

    // Build a map of dates to session info
    const sessionDates = new Map<string, { flagged: boolean; modified: boolean }>();
    for (const s of sessions) {
      if (!s.startedAt) continue;
      const dateStr = new Date(s.startedAt).toISOString().split("T")[0];
      sessionDates.set(dateStr, {
        flagged: s.flaggedForReview ?? false,
        modified: false, // We'd need exercise records to know this
      });
    }

    const data: { date: string; status: "completed" | "modified" | "rest" | "flagged" | "none" }[] = [];
    const current = new Date(start);
    while (current <= today) {
      const dateStr = current.toISOString().split("T")[0];
      const session = sessionDates.get(dateStr);

      let status: "completed" | "modified" | "rest" | "flagged" | "none";
      if (session) {
        status = session.flagged ? "flagged" : "completed";
      } else {
        status = "rest";
      }

      data.push({ date: dateStr, status });
      current.setDate(current.getDate() + 1);
    }

    return data;
  }, [sessions]);

  // ─── Summary Stats ────────────────────────────────────────
  const summaryStats = useMemo(() => {
    if (!sessions) return { totalSessions: 0, avgWeeklyVolume: 0, currentStreak: 0, bestLifts: [] };

    const totalSessions = sessions.length;

    // Avg weekly volume (total sets / weeks with data)
    const totalSets = setRecords?.length ?? 0;
    const weeks = new Set(
      sessions
        .filter((s) => s.startedAt)
        .map((s) => {
          const d = new Date(s.startedAt!);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          return weekStart.toISOString().split("T")[0];
        })
    );
    const avgWeeklyVolume = weeks.size > 0 ? Math.round(totalSets / weeks.size) : 0;

    // Current streak
    let streak = 0;
    const sortedDates = sessions
      .filter((s) => s.startedAt)
      .map((s) => new Date(s.startedAt!).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const today = new Date();
    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (sortedDates[i] === expected.toDateString()) {
        streak++;
      } else break;
    }

    // Best lifts from set records
    const liftMap = new Map<string, number>();
    for (const set of setRecords ?? []) {
      if (!set.weightLbs || !set.exerciseName) continue;
      const current = liftMap.get(set.exerciseName) ?? 0;
      if (set.weightLbs > current) liftMap.set(set.exerciseName, set.weightLbs);
    }
    const bestLifts = Array.from(liftMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, weight]) => ({ name, weight }));

    return { totalSessions, avgWeeklyVolume, currentStreak: streak, bestLifts };
  }, [sessions, setRecords]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-gray-500 dark:text-gray-400">Loading progress data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Progress</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Track your recovery trends and training progress.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-8">
        <ProgressSummary
          totalSessions={summaryStats.totalSessions}
          avgWeeklyVolume={summaryStats.avgWeeklyVolume}
          currentStreak={summaryStats.currentStreak}
          bestLifts={summaryStats.bestLifts}
        />
      </div>

      {/* Tabbed Charts */}
      <Tabs defaultValue="weight">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="weight" className="min-h-[48px] px-5">
            Weight
          </TabsTrigger>
          <TabsTrigger value="volume" className="min-h-[48px] px-5">
            Volume
          </TabsTrigger>
          <TabsTrigger value="strength" className="min-h-[48px] px-5">
            Strength
          </TabsTrigger>
          <TabsTrigger value="activity" className="min-h-[48px] px-5">
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weight">
          {weightData.length > 0 ? (
            <WeightTrendChart
              data={weightData}
              wegovyStartDate={userProfile?.wegovyStartDate ?? undefined}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                No weight data yet. Log your body metrics to see trends.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="volume">
          {volumeData.length > 0 ? (
            <VolumeChart data={volumeData} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                Complete some workouts to see volume trends.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="strength">
          {strengthData.length > 0 ? (
            <StrengthProgressChart data={strengthData} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                Log exercises with weights to see strength progress.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <WorkoutHeatmap data={heatmapData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
