"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StrengthEntry {
  date: string;
  weightLbs: number;
}

interface ExerciseData {
  exerciseName: string;
  entries: StrengthEntry[];
}

interface StrengthProgressChartProps {
  data: ExerciseData[];
}

const LINE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function StrengthProgressChart({ data }: StrengthProgressChartProps) {
  const [selectedExercise, setSelectedExercise] = useState(data[0]?.exerciseName ?? "");

  const { chartData, hasRegression } = useMemo(() => {
    const exercise = data.find((d) => d.exerciseName === selectedExercise);
    if (!exercise || exercise.entries.length === 0) {
      return { chartData: [], hasRegression: false };
    }

    const sorted = [...exercise.entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const processed = sorted.map((entry) => ({
      date: entry.date,
      displayDate: new Date(entry.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weightLbs: entry.weightLbs,
    }));

    // Check for regression: 2+ consecutive drops
    let regression = false;
    let consecutiveDrops = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].weightLbs < sorted[i - 1].weightLbs) {
        consecutiveDrops++;
        if (consecutiveDrops >= 2) {
          regression = true;
          break;
        }
      } else {
        consecutiveDrops = 0;
      }
    }

    return { chartData: processed, hasRegression: regression };
  }, [data, selectedExercise]);

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-gray-500 dark:text-gray-400">No strength data recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Strength Progress</CardTitle>
        <CardDescription>Working weight over time for each exercise</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Exercise selector tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {data.map((exercise, idx) => (
            <button
              key={exercise.exerciseName}
              type="button"
              onClick={() => setSelectedExercise(exercise.exerciseName)}
              className={cn(
                "min-h-[48px] rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none",
                selectedExercise === exercise.exerciseName
                  ? "text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
              style={
                selectedExercise === exercise.exerciseName
                  ? { backgroundColor: LINE_COLORS[idx % LINE_COLORS.length] }
                  : undefined
              }
            >
              {exercise.exerciseName}
            </button>
          ))}
        </div>

        {hasRegression && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898M2.25 6h6m-6 0v6"
                />
              </svg>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Strength regression detected: weight has dropped for 2+ consecutive sessions on{" "}
                {selectedExercise}. Consider adjusting load or checking recovery.
              </p>
            </div>
          </div>
        )}

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-700"
              />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
                label={{
                  value: "lbs",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-gray-900, #111827)",
                  border: "1px solid var(--color-gray-700, #374151)",
                  borderRadius: "8px",
                  color: "var(--color-gray-100, #f3f4f6)",
                }}
                formatter={((value: unknown) => [`${value} lbs`, selectedExercise]) as never}
              />
              <Line
                type="monotone"
                dataKey="weightLbs"
                stroke={
                  LINE_COLORS[
                    data.findIndex((d) => d.exerciseName === selectedExercise) % LINE_COLORS.length
                  ]
                }
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
