"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDeskExercises, buildDeskSession, estimateSessionDuration } from "@/lib/deskRehab";
import type { InjuryContext, PlannedExercise, DeskExerciseFilter } from "@/types/index";

interface DeskRehabCardProps {
  injuryContext: InjuryContext;
  onStartSession?: (exercises: PlannedExercise[]) => void;
}

const BODY_PART_TABS: { label: string; value: DeskExerciseFilter["bodyPart"] }[] = [
  { label: "All", value: "all" },
  { label: "Shoulder", value: "shoulder" },
  { label: "Elbow", value: "elbow" },
  { label: "Foot", value: "foot" },
];

function formatPrescription(exercise: PlannedExercise): string {
  if (exercise.durationSec) {
    return `${Math.round(exercise.durationSec / 60)} min`;
  }
  const sets = exercise.sets ?? 1;
  const reps =
    exercise.repsMin && exercise.repsMax && exercise.repsMin !== exercise.repsMax
      ? `${exercise.repsMin}-${exercise.repsMax}`
      : `${exercise.repsMax ?? exercise.repsMin ?? 10}`;
  return `${sets} x ${reps} reps`;
}

export function DeskRehabCard({ injuryContext, onStartSession }: DeskRehabCardProps) {
  const [activeBodyPart, setActiveBodyPart] = useState<DeskExerciseFilter["bodyPart"]>("all");

  const exercises = useMemo(
    () => getDeskExercises(injuryContext, { bodyPart: activeBodyPart }),
    [injuryContext, activeBodyPart]
  );

  const estimatedMinutes = useMemo(
    () => estimateSessionDuration(exercises),
    [exercises]
  );

  const handleStartSession = useCallback(() => {
    if (!onStartSession) return;
    const session = buildDeskSession(injuryContext);
    onStartSession(session);
  }, [injuryContext, onStartSession]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Desk Rehab Exercises</CardTitle>
        <div className="flex flex-wrap gap-2 pt-2">
          {BODY_PART_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveBodyPart(tab.value)}
              className={cn(
                "min-h-[48px] rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                activeBodyPart === tab.value
                  ? "bg-blue-600 text-white dark:bg-blue-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {exercises.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No exercises available for this filter.
            </p>
          )}

          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex flex-col gap-1 rounded-lg border border-gray-100 p-3 dark:border-gray-800"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {exercise.name}
                </span>
                {exercise.safetyResult.safety === "MODIFIED" && (
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                    Modified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatPrescription(exercise)}</span>
                {exercise.formCues.length > 0 && (
                  <span className="italic">{exercise.formCues[0]}</span>
                )}
              </div>
            </div>
          ))}

          {exercises.length > 0 && (
            <div className="mt-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              Estimated time: ~{estimatedMinutes} min
            </div>
          )}
        </div>
      </CardContent>

      {onStartSession && (
        <CardFooter>
          <Button
            size="lg"
            className="min-h-[48px] w-full"
            onClick={handleStartSession}
          >
            Start Quick Session
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
