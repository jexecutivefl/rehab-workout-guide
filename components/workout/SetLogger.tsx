"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlannedExercise, CompletedSet } from "@/types/index";
import { RPESelector } from "./RPESelector";

type SetLoggerProps = {
  exercise: PlannedExercise;
  completedSets: CompletedSet[];
  onLogSet: (set: CompletedSet) => void;
  className?: string;
};

const ARM_MUSCLES = [
  "biceps",
  "triceps",
  "forearm",
  "brachialis",
  "brachioradialis",
  "wrist",
  "elbow",
];

function needsRomInput(exercise: PlannedExercise): boolean {
  const nameLower = exercise.name.toLowerCase();
  if (nameLower.includes("elbow")) return true;
  return exercise.muscles.some((m) =>
    ARM_MUSCLES.some((arm) => m.toLowerCase().includes(arm))
  );
}

export function SetLogger({
  exercise,
  completedSets,
  onLogSet,
  className,
}: SetLoggerProps) {
  const setNumber = completedSets.length + 1;
  const showRom = needsRomInput(exercise);

  const [reps, setReps] = useState(exercise.repsMin ?? 10);
  const [weight, setWeight] = useState(exercise.weightLbs ?? 0);
  const [rpe, setRpe] = useState(exercise.rpeTarget ?? 5);
  const [pain, setPain] = useState(0);
  const [rom, setRom] = useState(100);

  const handleLogSet = useCallback(() => {
    const set: CompletedSet = {
      setNumber,
      reps,
      weightLbs: weight,
      rpe,
      pain,
      ...(showRom ? { romPct: rom } : {}),
    };
    onLogSet(set);
    // Reset pain for next set but keep reps/weight/rpe
    setPain(0);
  }, [setNumber, reps, weight, rpe, pain, rom, showRom, onLogSet]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Set Number Header */}
      <div className="text-center">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Set {setNumber}
          {exercise.sets ? ` of ${exercise.sets}` : ""}
        </span>
      </div>

      {/* Reps Stepper */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Reps
        </label>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setReps((r) => Math.max(0, r - 1))}
            className="min-h-[48px] min-w-[48px] text-xl font-bold"
          >
            -
          </Button>
          <span className="text-3xl font-bold tabular-nums min-w-[3ch] text-center text-gray-900 dark:text-gray-100">
            {reps}
          </span>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setReps((r) => r + 1)}
            className="min-h-[48px] min-w-[48px] text-xl font-bold"
          >
            +
          </Button>
        </div>
      </div>

      {/* Weight Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Weight (lbs)
        </label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="text-center text-lg font-bold min-h-[48px]"
            min={0}
            step={2.5}
          />
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setWeight((w) => w + 2.5)}
            className="min-h-[48px] whitespace-nowrap"
          >
            +2.5
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setWeight((w) => w + 5)}
            className="min-h-[48px] whitespace-nowrap"
          >
            +5
          </Button>
        </div>
      </div>

      {/* RPE Selector */}
      <RPESelector value={rpe} onChange={setRpe} />

      {/* Pain Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="set-pain"
            className="text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            Pain During Set
          </label>
          <span
            className={cn(
              "text-lg font-bold tabular-nums",
              pain <= 3 && "text-green-600 dark:text-green-400",
              pain > 3 && pain < 7 && "text-yellow-600 dark:text-yellow-400",
              pain >= 7 && "text-red-600 dark:text-red-400"
            )}
          >
            {pain}
          </span>
        </div>
        <input
          id="set-pain"
          type="range"
          min={0}
          max={10}
          step={1}
          value={pain}
          onChange={(e) => setPain(Number(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer accent-blue-600 bg-gray-200 dark:bg-gray-700"
          style={{ minHeight: "48px" }}
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>0 - None</span>
          <span>5 - Moderate</span>
          <span>10 - Severe</span>
        </div>
      </div>

      {/* ROM Slider (conditional) */}
      {showRom && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="set-rom"
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Range of Motion
            </label>
            <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
              {rom}%
            </span>
          </div>
          <input
            id="set-rom"
            type="range"
            min={0}
            max={100}
            step={5}
            value={rom}
            onChange={(e) => setRom(Number(e.target.value))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer accent-blue-600 bg-gray-200 dark:bg-gray-700"
            style={{ minHeight: "48px" }}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Log Set Button */}
      <Button
        size="lg"
        onClick={handleLogSet}
        className="w-full min-h-[48px] text-lg"
      >
        Log Set {setNumber}
      </Button>

      {/* Completed Sets History */}
      {completedSets.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Completed Sets
          </h4>
          <div className="space-y-2">
            {completedSets.map((s) => (
              <Card key={s.setNumber} variant="outlined" className="bg-gray-50 dark:bg-gray-800/50">
                <CardContent className="p-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Set {s.setNumber}</span>
                    {s.reps != null && <span>{s.reps} reps</span>}
                    {s.weightLbs != null && <span>{s.weightLbs} lbs</span>}
                    <span>RPE {s.rpe}</span>
                    <span
                      className={cn(
                        s.pain >= 7 && "text-red-600 dark:text-red-400 font-medium"
                      )}
                    >
                      Pain {s.pain}
                    </span>
                    {s.romPct != null && <span>ROM {s.romPct}%</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
