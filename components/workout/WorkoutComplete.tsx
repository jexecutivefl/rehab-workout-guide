"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ActiveSession } from "@/types/index";

type WorkoutCompleteProps = {
  session: ActiveSession;
  onSave: (postPain: number, postEnergy: number, notes?: string) => void;
  className?: string;
};

export function WorkoutComplete({
  session,
  onSave,
  className,
}: WorkoutCompleteProps) {
  const [postPain, setPostPain] = useState(0);
  const [postEnergy, setPostEnergy] = useState(5);
  const [notes, setNotes] = useState("");

  const stats = useMemo(() => {
    const completedExercises = session.completedExercises.filter(
      (ex) => !ex.wasSkipped && ex.sets.length > 0
    );
    const totalSets = session.completedExercises.reduce(
      (sum, ex) => sum + ex.sets.length,
      0
    );
    const durationMs = Date.now() - session.startedAt.getTime();
    const durationMin = Math.round(durationMs / 60000);

    return {
      exercisesCompleted: completedExercises.length,
      exercisesSkipped: session.completedExercises.filter((ex) => ex.wasSkipped).length,
      totalSets,
      durationMin,
    };
  }, [session]);

  return (
    <Card className={cn("w-full max-w-lg mx-auto", className)}>
      <CardHeader>
        <CardTitle>Workout Complete</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Great work! Let&apos;s wrap up.
        </p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.exercisesCompleted}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Exercises{stats.exercisesSkipped > 0 ? ` (${stats.exercisesSkipped} skipped)` : ""}
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalSets}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Sets Logged
            </div>
          </div>
          <div className="col-span-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.durationMin} min
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Duration
            </div>
          </div>
        </div>

        {/* Post-Session Pain Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="post-pain"
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Post-Session Pain
            </label>
            <span
              className={cn(
                "text-lg font-bold tabular-nums min-w-[3ch] text-right",
                postPain <= 3 && "text-green-600 dark:text-green-400",
                postPain > 3 && postPain < 7 && "text-yellow-600 dark:text-yellow-400",
                postPain >= 7 && "text-red-600 dark:text-red-400"
              )}
            >
              {postPain}
            </span>
          </div>
          <input
            id="post-pain"
            type="range"
            min={0}
            max={10}
            step={1}
            value={postPain}
            onChange={(e) => setPostPain(Number(e.target.value))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer accent-blue-600 bg-gray-200 dark:bg-gray-700"
            style={{ minHeight: "48px" }}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0 - None</span>
            <span>5 - Moderate</span>
            <span>10 - Severe</span>
          </div>
        </div>

        {/* Post-Session Energy Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="post-energy"
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Post-Session Energy
            </label>
            <span
              className={cn(
                "text-lg font-bold tabular-nums min-w-[3ch] text-right",
                postEnergy <= 3 && "text-orange-600 dark:text-orange-400",
                postEnergy > 3 && postEnergy < 7 && "text-yellow-600 dark:text-yellow-400",
                postEnergy >= 7 && "text-green-600 dark:text-green-400"
              )}
            >
              {postEnergy}
            </span>
          </div>
          <input
            id="post-energy"
            type="range"
            min={1}
            max={10}
            step={1}
            value={postEnergy}
            onChange={(e) => setPostEnergy(Number(e.target.value))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer accent-blue-600 bg-gray-200 dark:bg-gray-700"
            style={{ minHeight: "48px" }}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>1 - Exhausted</span>
            <span>5 - Average</span>
            <span>10 - Great</span>
          </div>
        </div>

        {/* Session Notes */}
        <div className="space-y-2">
          <label
            htmlFor="session-notes"
            className="text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            Session Notes (optional)
          </label>
          <Textarea
            id="session-notes"
            placeholder="Any observations, how the workout felt, pain notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      </CardContent>

      <CardFooter>
        <Button
          size="lg"
          onClick={() => onSave(postPain, postEnergy, notes || undefined)}
          className="w-full min-h-[48px] text-lg"
        >
          Save Session
        </Button>
      </CardFooter>
    </Card>
  );
}
