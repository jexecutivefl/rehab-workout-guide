"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// STUB: replace with Agent C output when ready
// import { shouldFlagSession } from '@/lib/injuryEngine';

type PreSessionCheckProps = {
  onStart: (pain: number, energy: number) => void;
};

const PAIN_LABELS: Record<number, string> = {
  0: "None",
  1: "Minimal",
  2: "Mild",
  3: "Mild",
  4: "Moderate",
  5: "Moderate",
  6: "Moderate",
  7: "Severe",
  8: "Severe",
  9: "Very Severe",
  10: "Worst Possible",
};

export function PreSessionCheck({ onStart }: PreSessionCheckProps) {
  const [pain, setPain] = useState(0);
  const [energy, setEnergy] = useState(5);
  const [highPainAcknowledged, setHighPainAcknowledged] = useState(false);

  const isHighPain = pain >= 7;
  const isLowEnergy = energy <= 3;
  const canStart = !isHighPain || highPainAcknowledged;

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Pre-Session Check</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          How are you feeling today?
        </p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Pain Level Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="pain-slider"
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Current Pain Level
            </label>
            <span
              className={cn(
                "text-lg font-bold tabular-nums min-w-[3ch] text-right",
                pain <= 3 && "text-green-600 dark:text-green-400",
                pain > 3 && pain < 7 && "text-yellow-600 dark:text-yellow-400",
                pain >= 7 && "text-red-600 dark:text-red-400"
              )}
            >
              {pain}
            </span>
          </div>
          <input
            id="pain-slider"
            type="range"
            min={0}
            max={10}
            step={1}
            value={pain}
            onChange={(e) => {
              setPain(Number(e.target.value));
              setHighPainAcknowledged(false);
            }}
            className="w-full h-3 rounded-full appearance-none cursor-pointer accent-blue-600 bg-gray-200 dark:bg-gray-700"
            style={{ minHeight: "48px" }}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0 - None</span>
            <span>5 - Moderate</span>
            <span>10 - Severe</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {PAIN_LABELS[pain]}
          </p>
        </div>

        {/* Energy Level Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="energy-slider"
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Energy Level
            </label>
            <span
              className={cn(
                "text-lg font-bold tabular-nums min-w-[3ch] text-right",
                energy <= 3 && "text-orange-600 dark:text-orange-400",
                energy > 3 && energy < 7 && "text-yellow-600 dark:text-yellow-400",
                energy >= 7 && "text-green-600 dark:text-green-400"
              )}
            >
              {energy}
            </span>
          </div>
          <input
            id="energy-slider"
            type="range"
            min={1}
            max={10}
            step={1}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer accent-blue-600 bg-gray-200 dark:bg-gray-700"
            style={{ minHeight: "48px" }}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>1 - Exhausted</span>
            <span>5 - Average</span>
            <span>10 - Great</span>
          </div>
        </div>

        {/* High Pain Warning */}
        {isHighPain && (
          <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 dark:bg-red-950/30 dark:border-red-700">
            <p className="text-red-800 dark:text-red-200 font-medium text-sm">
              High pain detected. Consider resting today.
            </p>
            <label className="flex items-center gap-3 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={highPainAcknowledged}
                onChange={(e) => setHighPainAcknowledged(e.target.checked)}
                className="h-6 w-6 rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-red-700 dark:text-red-300">
                I understand the risk and want to continue
              </span>
            </label>
          </div>
        )}

        {/* Low Energy Warning */}
        {isLowEnergy && (
          <div className="rounded-lg border-2 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-950/30 dark:border-yellow-700">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium text-sm">
              Low energy — GLP-1 fatigue may affect your workout.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          size="lg"
          disabled={!canStart}
          onClick={() => onStart(pain, energy)}
          className="w-full min-h-[48px]"
        >
          Start Workout
        </Button>
      </CardFooter>
    </Card>
  );
}
