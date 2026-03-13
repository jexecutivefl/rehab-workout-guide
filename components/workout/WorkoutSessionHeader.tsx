"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type WorkoutSessionHeaderProps = {
  currentIndex: number;
  totalExercises: number;
  sessionType?: string;
  startedAt: Date;
  className?: string;
};

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  UPPER_BODY: "Upper Body",
  LOWER_BODY: "Lower Body",
  FULL_BODY: "Full Body",
  REHAB_FOCUSED: "Rehab Focused",
  CARDIO_ONLY: "Cardio",
  ACTIVE_RECOVERY: "Active Recovery",
  REST: "Rest Day",
};

export function WorkoutSessionHeader({
  currentIndex,
  totalExercises,
  sessionType,
  startedAt,
  className,
}: WorkoutSessionHeaderProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = Math.floor(
        (Date.now() - startedAt.getTime()) / 1000
      );
      setElapsed(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const progress = totalExercises > 0
    ? ((currentIndex + 1) / totalExercises) * 100
    : 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        {/* Exercise counter */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Exercise {currentIndex + 1}{" "}
            <span className="text-gray-500 dark:text-gray-400 font-normal">
              of {totalExercises}
            </span>
          </span>
        </div>

        {/* Elapsed time */}
        <span className="text-lg font-mono font-bold tabular-nums text-gray-700 dark:text-gray-300">
          {formatElapsed(elapsed)}
        </span>
      </div>

      {/* Session type badge */}
      {sessionType && (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          {SESSION_TYPE_LABELS[sessionType] ?? sessionType}
        </span>
      )}

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
