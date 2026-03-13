"use client";

import { useMemo, useState } from "react";
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

type FilterType = "ALL" | "UPPER_BODY" | "LOWER_BODY" | "REHAB_FOCUSED" | "ACTIVE_RECOVERY" | "CARDIO_ONLY" | "FULL_BODY";

/**
 * Workout History
 *
 * Shows all past workout sessions with type filtering.
 */
export default function WorkoutHistoryPage() {
  const { data: sessions, isLoading } = useWorkoutSessions(50);
  const [filter, setFilter] = useState<FilterType>("ALL");

  const sortedSessions = useMemo(() => {
    if (!sessions) return [];
    let filtered = [...sessions].filter((s) => s.startedAt);
    if (filter !== "ALL") {
      filtered = filtered.filter((s) => s.sessionType === filter);
    }
    return filtered.sort(
      (a, b) => new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime()
    );
  }, [sessions, filter]);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Workout History</h1>
        <Link href="/workout">
          <Button variant="outline" size="sm">Back to Workout</Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(["ALL", "UPPER_BODY", "LOWER_BODY", "REHAB_FOCUSED", "ACTIVE_RECOVERY", "CARDIO_ONLY", "FULL_BODY"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors min-h-[36px]",
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            )}
          >
            {f === "ALL" ? "All" : TYPE_LABELS[f] ?? f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
            Loading workout history...
          </CardContent>
        </Card>
      ) : sortedSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <svg className="mb-4 h-16 w-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              {filter === "ALL" ? "No workout sessions yet" : `No ${TYPE_LABELS[filter] ?? filter} sessions`}
            </h2>
            <p className="max-w-md text-gray-600 dark:text-gray-400">
              {filter === "ALL"
                ? "Complete your first workout to see it here."
                : "Try changing the filter or complete a workout of this type."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((session) => {
            const startDate = new Date(session.startedAt!);
            const dateStr = startDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
            const timeStr = startDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });
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
                  <CardDescription className="flex flex-wrap gap-x-4 gap-y-1">
                    <span>{timeStr}</span>
                    {session.durationMinutes != null && <span>{session.durationMinutes} min</span>}
                    {session.preSessionPainLevel != null && (
                      <span>Pre-pain: {session.preSessionPainLevel}/10</span>
                    )}
                    {session.postSessionPainLevel != null && (
                      <span>Post-pain: {session.postSessionPainLevel}/10</span>
                    )}
                  </CardDescription>
                </CardHeader>
                {(session.notes || session.flagReason) && (
                  <CardContent className="pt-0">
                    {session.flagReason && (
                      <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                        Flag: {session.flagReason}
                      </p>
                    )}
                    {session.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {session.notes}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
