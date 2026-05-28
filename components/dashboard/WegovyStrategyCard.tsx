"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { client } from "@/lib/amplifyClient";
import {
  WEGOVY_PROTEIN_TARGET_G,
  WEGOVY_CREATINE_DAILY_G,
  WEGOVY_PROTEIN_SOURCES,
  computeAllWegovyGoalProgress,
  getWegovyPhase,
  type WegovySetInput,
  type WegovyGoalProgress,
} from "@/lib/wegovyStrategy";

type WegovyStrategyCardProps = {
  wegovyStartDate?: string | null;
};

/**
 * Surfaces the Wegovy-specific training strategy:
 *   - daily protein target + creatine reminder
 *   - current phase + expected timeline
 *   - five performance goals with Epley-1RM progress from logged sets
 *
 * Renders only when the parent decides the user is on Wegovy. Fetches its own
 * completed-exercise data lazily; the dashboard does not need to be modified
 * beyond conditional mount.
 */
export function WegovyStrategyCard({ wegovyStartDate }: WegovyStrategyCardProps) {
  const phase = useMemo(() => getWegovyPhase(wegovyStartDate ?? null), [wegovyStartDate]);

  // Pull all completed exercise + set records the user has logged.
  // Same shape progress/page.tsx uses; intentionally inline so we don't add a
  // new hook for one consumer.
  const { data: sets, isLoading } = useQuery<WegovySetInput[]>({
    queryKey: ["wegovyStrategySets"],
    queryFn: async () => {
      const { data: exerciseRecords, errors } =
        await client.models.CompletedExerciseRecord.list({ limit: 500 });
      if (errors?.length || !exerciseRecords) return [];

      const allSets: WegovySetInput[] = [];
      for (const ex of exerciseRecords) {
        const { data: setRecords, errors: setErrors } =
          await client.models.CompletedSetRecord.list({
            filter: { completedExerciseRecordId: { eq: ex.id } },
          } as Parameters<typeof client.models.CompletedSetRecord.list>[0]);
        if (setErrors?.length || !setRecords) continue;
        for (const s of setRecords) {
          allSets.push({
            exerciseId: ex.exerciseId,
            weightLbs: s.weightLbs,
            reps: s.reps,
            durationSec: s.durationSec,
            completedAt: s.createdAt ?? undefined,
          });
        }
      }
      return allSets;
    },
  });

  const goalProgress = useMemo(
    () => computeAllWegovyGoalProgress(sets ?? []),
    [sets]
  );

  return (
    <Card className="border-purple-200 dark:border-purple-900/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Wegovy Strategy</CardTitle>
          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            {phase.label}
          </span>
        </div>
        <CardDescription>
          Preserve muscle, lose fat, get stronger every month. Don&apos;t chase scale weight.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phase focus */}
        <p className="rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-900 dark:bg-purple-900/20 dark:text-purple-200">
          {phase.focus}
        </p>

        {/* Daily targets */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Daily Protein
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {WEGOVY_PROTEIN_TARGET_G.min}–{WEGOVY_PROTEIN_TARGET_G.max}
              <span className="ml-1 text-base font-medium text-gray-500 dark:text-gray-400">
                g
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              If that&apos;s all you hit consistently, you&apos;re ahead of most people.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Daily Creatine
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {WEGOVY_CREATINE_DAILY_G}
              <span className="ml-1 text-base font-medium text-gray-500 dark:text-gray-400">
                g
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Monohydrate, any brand. Helps strength + muscle retention.
            </p>
          </div>
        </div>

        {/* Protein examples */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
            Protein sources
            <span className="ml-1 text-gray-400 group-open:hidden">+</span>
            <span className="ml-1 text-gray-400 hidden group-open:inline">−</span>
          </summary>
          <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
            {WEGOVY_PROTEIN_SOURCES.map((src) => (
              <li
                key={src.name}
                className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 dark:bg-gray-800/50"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {src.name}
                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                    ({src.unit})
                  </span>
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {src.proteinGrams}g
                </span>
              </li>
            ))}
          </ul>
        </details>

        {/* Performance goals */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Performance Goals
          </h3>
          <ul className="space-y-3">
            {goalProgress.map((p) => (
              <GoalRow key={p.goal.id} progress={p} loading={isLoading} />
            ))}
          </ul>
        </div>

        <p className="border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          Progress estimates use the Epley formula on your best logged set per
          exercise. Dumbbell loads count both hands.
        </p>
      </CardContent>
    </Card>
  );
}

function GoalRow({
  progress,
  loading,
}: {
  progress: WegovyGoalProgress;
  loading: boolean;
}) {
  const { goal, percentComplete, achieved, status, bestObserved } = progress;

  const barColor = achieved
    ? "bg-green-500"
    : percentComplete >= 75
      ? "bg-blue-500"
      : percentComplete >= 40
        ? "bg-yellow-500"
        : "bg-gray-400";

  const statusLabel =
    goal.metric === "MANUAL"
      ? "Track manually"
      : loading
        ? "Loading…"
        : status === "not_started"
          ? "Not started"
          : achieved
            ? "Achieved"
            : `${percentComplete}%`;

  const bestLine = (() => {
    if (!bestObserved) return null;
    if (goal.metric === "ONE_REP_MAX" && bestObserved.estimatedOneRepMaxLbs) {
      return `Best: ${bestObserved.weightLbs} lbs × ${bestObserved.reps} → ~${bestObserved.estimatedOneRepMaxLbs} lb est. 1RM`;
    }
    if (goal.metric === "DURATION_SEC" && bestObserved.durationSec) {
      const min = Math.floor(bestObserved.durationSec / 60);
      const sec = bestObserved.durationSec % 60;
      return `Best: ${min}m ${sec.toString().padStart(2, "0")}s`;
    }
    return null;
  })();

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {goal.label}
        </p>
        <span
          className={cn(
            "text-xs font-semibold tabular-nums",
            achieved
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-400"
          )}
        >
          {statusLabel}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        {goal.description}
      </p>
      {goal.metric !== "MANUAL" && (
        <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={cn("h-1.5 rounded-full transition-all", barColor)}
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      )}
      {bestLine && (
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          {bestLine}
        </p>
      )}
    </li>
  );
}
