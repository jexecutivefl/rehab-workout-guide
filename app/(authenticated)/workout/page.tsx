"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useWorkoutSessions } from "@/hooks/useAmplifyData";

const TYPE_COLORS: Record<string, string> = {
  UPPER_BODY: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  LOWER_BODY: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  REHAB_FOCUSED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  ACTIVE_RECOVERY: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  CARDIO_ONLY: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  FULL_BODY: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
};

const TYPE_LABELS: Record<string, string> = {
  UPPER_BODY: "Upper Body",
  LOWER_BODY: "Lower Body",
  REHAB_FOCUSED: "Rehab",
  ACTIVE_RECOVERY: "Recovery",
  CARDIO_ONLY: "Cardio",
  FULL_BODY: "Full Body",
};

/**
 * Workout Hub
 *
 * Entry point for workout functionality:
 * - Start today's workout
 * - Quick stats from real data
 * - Recent sessions list from Amplify
 */
export default function WorkoutPage() {
  const { data: sessions, isLoading } = useWorkoutSessions(50);

  const recentSessions = useMemo(() => {
    if (!sessions) return [];
    return [...sessions]
      .filter((s) => s.startedAt)
      .sort((a, b) => new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime())
      .slice(0, 4);
  }, [sessions]);

  const quickStats = useMemo(() => {
    if (!sessions) return { sessionsThisWeek: 0, totalThisMonth: 0, avgPainThisWeek: 0 };

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisWeek = sessions.filter(
      (s) => s.startedAt && new Date(s.startedAt) >= startOfWeek
    );
    const thisMonth = sessions.filter(
      (s) => s.startedAt && new Date(s.startedAt) >= startOfMonth
    );

    const painValues = thisWeek
      .map((s) => s.postSessionPainLevel)
      .filter((p): p is number => p != null);
    const avgPain = painValues.length > 0
      ? Math.round((painValues.reduce((a, b) => a + b, 0) / painValues.length) * 10) / 10
      : 0;

    return {
      sessionsThisWeek: thisWeek.length,
      totalThisMonth: thisMonth.length,
      avgPainThisWeek: avgPain,
    };
  }, [sessions]);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Workout</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Injury-aware training sessions adapted to your recovery.
        </p>
      </div>

      {/* Start Workout CTA */}
      <Card className="mb-8">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <svg
            className="mb-4 h-16 w-16 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 6h2m0 0a2 2 0 104 0m-4 0a2 2 0 114 0m0 0h2m0 0a2 2 0 104 0m-4 0a2 2 0 114 0m0 0h2M3 18h2m0 0a2 2 0 104 0m-4 0a2 2 0 114 0m0 0h2m0 0a2 2 0 104 0m-4 0a2 2 0 114 0m0 0h2"
            />
          </svg>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Ready to Train?
          </h2>
          <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
            Your workout will be auto-generated based on your injury stages and recovery progress.
          </p>
          <Link href="/workout/active">
            <Button size="lg" className="min-h-[48px] text-lg px-8">
              Start Today&apos;s Workout
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isLoading ? "—" : quickStats.sessionsThisWeek}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isLoading ? "—" : quickStats.totalThisMonth}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Pain</p>
            <p className={cn(
              "mt-1 text-3xl font-bold",
              quickStats.avgPainThisWeek <= 3
                ? "text-green-600 dark:text-green-400"
                : "text-yellow-600 dark:text-yellow-400"
            )}>
              {isLoading ? "—" : quickStats.avgPainThisWeek}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Sessions</h2>
        <Link href="/workout/history">
          <Button variant="ghost" size="sm">View All</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
              Loading sessions...
            </CardContent>
          </Card>
        ) : recentSessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
              No sessions yet. Start your first workout above!
            </CardContent>
          </Card>
        ) : (
          recentSessions.map((session) => {
            const dateStr = session.startedAt
              ? new Date(session.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "";
            const sessionType = session.sessionType ?? "UPPER_BODY";

            return (
              <Card key={session.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">
                        {TYPE_LABELS[sessionType] ?? sessionType} Session
                      </CardTitle>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          TYPE_COLORS[sessionType] ?? "bg-gray-100 text-gray-800"
                        )}
                      >
                        {TYPE_LABELS[sessionType] ?? sessionType}
                      </span>
                      {session.flaggedForReview && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300">
                          Flagged
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{dateStr}</span>
                  </div>
                  <CardDescription>
                    {session.durationMinutes ? `${session.durationMinutes} min` : "—"}
                    {session.postSessionPainLevel != null ? ` - Pain: ${session.postSessionPainLevel}/10` : ""}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
