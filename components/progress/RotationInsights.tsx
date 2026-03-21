"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WorkoutAnalysis, PlateauSignal } from "@/types/index";

interface RotationInsightsProps {
  analysis: WorkoutAnalysis | null;
  signals: PlateauSignal[];
  className?: string;
}

function formatMuscle(muscle: string): string {
  return muscle
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function frequencyColor(count: number, totalSessions: number): string {
  const ratio = count / totalSessions;
  if (ratio >= 0.75) return "bg-red-500 dark:bg-red-600";
  if (ratio >= 0.5) return "bg-yellow-500 dark:bg-yellow-500";
  return "bg-green-500 dark:bg-green-600";
}

function frequencyTextColor(count: number, totalSessions: number): string {
  const ratio = count / totalSessions;
  if (ratio >= 0.75) return "text-red-600 dark:text-red-400";
  if (ratio >= 0.5) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

function severityDotColor(severity: PlateauSignal["severity"]): string {
  switch (severity) {
    case "strong":
      return "bg-red-500";
    case "moderate":
      return "bg-yellow-500";
    case "mild":
      return "bg-blue-400";
  }
}

export function RotationInsights({
  analysis,
  signals,
  className,
}: RotationInsightsProps) {
  if (!analysis) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const topExercises = [...analysis.exerciseFrequencies]
    .sort((a, b) => b.countInWindow - a.countInWindow)
    .slice(0, 10);

  const sortedVolumes = [...analysis.muscleVolumes].sort(
    (a, b) => b.totalSets - a.totalSets
  );
  const maxVolume = sortedVolumes.length > 0 ? sortedVolumes[0].totalSets : 1;
  const avgVolume =
    sortedVolumes.length > 0
      ? sortedVolumes.reduce((sum, v) => sum + v.totalSets, 0) /
        sortedVolumes.length
      : 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Rotation &amp; Balance Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6 pt-2">
        {/* Section 1: Exercise Frequency */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Exercise Frequency
            <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
              (top 10 of {analysis.totalSessions} sessions)
            </span>
          </h3>
          {topExercises.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No exercise data yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {topExercises.map((ex) => {
                const pct =
                  analysis.totalSessions > 0
                    ? (ex.countInWindow / analysis.totalSessions) * 100
                    : 0;
                return (
                  <li key={ex.exerciseId}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium text-gray-800 dark:text-gray-200">
                        {ex.exerciseName}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            frequencyTextColor(
                              ex.countInWindow,
                              analysis.totalSessions
                            )
                          )}
                        >
                          {ex.countInWindow}x
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          RPE {ex.avgRpe.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          frequencyColor(
                            ex.countInWindow,
                            analysis.totalSessions
                          )
                        )}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Section 2: Muscle Balance */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Muscle Balance
          </h3>
          {sortedVolumes.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No volume data yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {sortedVolumes.map((mv) => {
                const pct = maxVolume > 0 ? (mv.totalSets / maxVolume) * 100 : 0;
                let barColor: string;
                if (mv.totalSets < avgVolume) {
                  barColor = "bg-red-500 dark:bg-red-600";
                } else if (mv.totalSets > avgVolume * 1.25) {
                  barColor = "bg-blue-500 dark:bg-blue-600";
                } else {
                  barColor = "bg-green-500 dark:bg-green-600";
                }
                return (
                  <li key={mv.muscle}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {formatMuscle(mv.muscle)}
                      </span>
                      <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                        {mv.totalSets} sets
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          barColor
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Section 3: Active Plateau Signals */}
        {signals.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Active Plateau Signals
            </h3>
            <ul className="space-y-1.5">
              {signals.map((sig, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      severityDotColor(sig.severity)
                    )}
                  />
                  <span className="text-gray-600 dark:text-gray-300">
                    {sig.message}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
