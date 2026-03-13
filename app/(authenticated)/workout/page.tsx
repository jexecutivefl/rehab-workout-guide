"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Placeholder data ────────────────────────────────────────
const RECENT_SESSIONS = [
  {
    id: "1",
    title: "Upper Body - Rehab Adapted",
    date: "Mar 12",
    exercises: 5,
    durationMin: 42,
    avgPain: 2.5,
    type: "UPPER_BODY" as const,
  },
  {
    id: "2",
    title: "Lower Body - Light",
    date: "Mar 10",
    exercises: 4,
    durationMin: 35,
    avgPain: 3,
    type: "LOWER_BODY" as const,
  },
  {
    id: "3",
    title: "Rehab Only Session",
    date: "Mar 9",
    exercises: 3,
    durationMin: 20,
    avgPain: 2,
    type: "REHAB_FOCUSED" as const,
  },
  {
    id: "4",
    title: "Active Recovery",
    date: "Mar 7",
    exercises: 4,
    durationMin: 25,
    avgPain: 1.5,
    type: "ACTIVE_RECOVERY" as const,
  },
];

const QUICK_STATS = {
  sessionsThisWeek: 3,
  totalThisMonth: 11,
  avgPainThisWeek: 2.3,
};

const TYPE_COLORS: Record<string, string> = {
  UPPER_BODY: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  LOWER_BODY: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  REHAB_FOCUSED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  ACTIVE_RECOVERY: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  CARDIO_ONLY: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

const TYPE_LABELS: Record<string, string> = {
  UPPER_BODY: "Upper Body",
  LOWER_BODY: "Lower Body",
  REHAB_FOCUSED: "Rehab",
  ACTIVE_RECOVERY: "Recovery",
  CARDIO_ONLY: "Cardio",
};

/**
 * Workout Hub
 *
 * Entry point for workout functionality:
 * - Start today's workout
 * - Quick stats
 * - Recent sessions list
 */
export default function WorkoutPage() {
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
            Today&apos;s Workout Ready
          </h2>
          <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
            Upper body session with modifications for your elbow and plantar fasciitis rehab exercises included.
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
              {QUICK_STATS.sessionsThisWeek}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {QUICK_STATS.totalThisMonth}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Pain</p>
            <p className={cn(
              "mt-1 text-3xl font-bold",
              QUICK_STATS.avgPainThisWeek <= 3
                ? "text-green-600 dark:text-green-400"
                : "text-yellow-600 dark:text-yellow-400"
            )}>
              {QUICK_STATS.avgPainThisWeek}
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
        {RECENT_SESSIONS.map((session) => (
          <Card key={session.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{session.title}</CardTitle>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      TYPE_COLORS[session.type] ?? "bg-gray-100 text-gray-800"
                    )}
                  >
                    {TYPE_LABELS[session.type] ?? session.type}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{session.date}</span>
              </div>
              <CardDescription>
                {session.exercises} exercises - {session.durationMin} min - Avg pain: {session.avgPain}/10
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
