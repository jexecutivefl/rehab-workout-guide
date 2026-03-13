"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlannedExercise } from "@/types/index";

// STUB: replace with Agent C output when ready
// import { evaluateExerciseSafety } from '@/lib/injuryEngine';

type ExerciseCardProps = {
  exercise: PlannedExercise;
  isActive: boolean;
  onSkip?: () => void;
  className?: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  WARMUP: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  STRENGTH: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  CARDIO: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  REHAB: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  STRETCH: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  CORE: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  COOLDOWN: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const SAFETY_BANNERS: Record<string, { bg: string; text: string; label: string }> = {
  MODIFIED: {
    bg: "bg-yellow-50 border-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-700",
    text: "text-yellow-800 dark:text-yellow-200",
    label: "Modified",
  },
  AVOID: {
    bg: "bg-red-50 border-red-400 dark:bg-red-950/30 dark:border-red-700",
    text: "text-red-800 dark:text-red-200",
    label: "This exercise is not recommended",
  },
  FLAG_PAIN: {
    bg: "bg-orange-50 border-orange-400 dark:bg-orange-950/30 dark:border-orange-700",
    text: "text-orange-800 dark:text-orange-200",
    label: "Pain flagged — proceed with caution",
  },
};

export function ExerciseCard({
  exercise,
  isActive,
  onSkip,
  className,
}: ExerciseCardProps) {
  const { safetyResult } = exercise;
  const safetyBanner =
    safetyResult.safety !== "SAFE"
      ? SAFETY_BANNERS[safetyResult.safety]
      : null;

  const repsDisplay = exercise.repsMin
    ? exercise.repsMax && exercise.repsMax !== exercise.repsMin
      ? `${exercise.repsMin}-${exercise.repsMax}`
      : `${exercise.repsMin}`
    : null;

  return (
    <Card
      className={cn(
        "w-full transition-all",
        isActive && "ring-2 ring-blue-500 dark:ring-blue-400",
        !isActive && "opacity-70",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-xl">{exercise.name}</CardTitle>
            <div className="flex flex-wrap gap-2">
              {/* Category badge */}
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                  CATEGORY_COLORS[exercise.category] ?? CATEGORY_COLORS.COOLDOWN
                )}
              >
                {exercise.category}
              </span>
              {/* Rehab badge */}
              {exercise.isRehab && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
                  Rehab
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Safety Banner */}
        {safetyBanner && (
          <div
            className={cn(
              "rounded-lg border-2 p-3",
              safetyBanner.bg
            )}
          >
            <p className={cn("text-sm font-medium", safetyBanner.text)}>
              {safetyResult.safety === "MODIFIED" && safetyResult.modification
                ? safetyResult.modification
                : safetyBanner.label}
            </p>
            {safetyResult.reason && safetyResult.safety !== "MODIFIED" && (
              <p className={cn("text-xs mt-1", safetyBanner.text)}>
                {safetyResult.reason}
              </p>
            )}
          </div>
        )}

        {/* Target sets/reps */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
          {exercise.sets && (
            <div>
              <span className="font-medium">Sets:</span> {exercise.sets}
            </div>
          )}
          {repsDisplay && (
            <div>
              <span className="font-medium">Reps:</span> {repsDisplay}
            </div>
          )}
          {exercise.durationSec && (
            <div>
              <span className="font-medium">Duration:</span>{" "}
              {exercise.durationSec}s
            </div>
          )}
          {exercise.weightLbs != null && (
            <div>
              <span className="font-medium">Weight:</span>{" "}
              {exercise.weightLbs} lbs
            </div>
          )}
          {exercise.rpeTarget != null && (
            <div>
              <span className="font-medium">Target RPE:</span>{" "}
              {exercise.rpeTarget}
            </div>
          )}
        </div>

        {/* Form Cues */}
        {exercise.formCues.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Form Cues
            </p>
            <ul className="list-disc list-inside space-y-1">
              {exercise.formCues.map((cue, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  {cue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      {isActive && onSkip && (
        <CardFooter>
          <Button
            variant="outline"
            size="lg"
            onClick={onSkip}
            className="min-h-[48px]"
          >
            Skip Exercise
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
