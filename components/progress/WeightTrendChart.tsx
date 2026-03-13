"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface WeightDataPoint {
  date: string;
  weightLbs: number;
}

interface WeightTrendChartProps {
  data: WeightDataPoint[];
  wegovyStartDate?: string;
}

export function WeightTrendChart({ data, wegovyStartDate }: WeightTrendChartProps) {
  const { chartData, rapidLossWarning, expectedBands } = useMemo(() => {
    if (data.length === 0) {
      return { chartData: [], rapidLossWarning: false, expectedBands: [] };
    }

    const sorted = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const startWeight = sorted[0].weightLbs;
    const startDate = new Date(sorted[0].date);

    // Build chart data with expected loss band
    const processed = sorted.map((point) => {
      const weeksElapsed =
        (new Date(point.date).getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000);
      const expectedLow = startWeight - weeksElapsed * 1.5;
      const expectedHigh = startWeight - weeksElapsed * 0.5;

      return {
        date: point.date,
        displayDate: new Date(point.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        weightLbs: point.weightLbs,
        expectedLow: Math.round(expectedLow * 10) / 10,
        expectedHigh: Math.round(expectedHigh * 10) / 10,
      };
    });

    // Check for rapid weight loss (>2 lbs/week between consecutive points)
    let hasRapidLoss = false;
    for (let i = 1; i < sorted.length; i++) {
      const daysDiff =
        (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) /
        (24 * 60 * 60 * 1000);
      if (daysDiff > 0) {
        const weeklyRate =
          ((sorted[i - 1].weightLbs - sorted[i].weightLbs) / daysDiff) * 7;
        if (weeklyRate > 2) {
          hasRapidLoss = true;
          break;
        }
      }
    }

    return {
      chartData: processed,
      rapidLossWarning: hasRapidLoss,
      expectedBands: processed,
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-gray-500 dark:text-gray-400">No weight data recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  const minWeight = Math.min(...chartData.map((d) => Math.min(d.weightLbs, d.expectedLow))) - 5;
  const maxWeight = Math.max(...chartData.map((d) => Math.max(d.weightLbs, d.expectedHigh))) + 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Weight Trend</CardTitle>
        <CardDescription>
          Body weight over time with expected loss band (0.5-1.5 lbs/week)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rapidLossWarning && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Rapid weight loss detected ({">"}2 lbs/week). Consider consulting your healthcare
                provider, especially while on Wegovy.
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
                domain={[minWeight, maxWeight]}
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
                tickFormatter={(v: number) => `${v}`}
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
                formatter={((value: unknown, name: unknown) => {
                  const labels: Record<string, string> = {
                    weightLbs: "Weight",
                    expectedHigh: "Expected High",
                    expectedLow: "Expected Low",
                  };
                  const nameStr = String(name ?? "");
                  return [`${value} lbs`, labels[nameStr] || nameStr];
                }) as never}
              />
              <Legend />

              {/* Expected loss band */}
              <Line
                type="monotone"
                dataKey="expectedHigh"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={1}
                dot={false}
                name="Expected High"
              />
              <Line
                type="monotone"
                dataKey="expectedLow"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={1}
                dot={false}
                name="Expected Low"
              />

              {/* Actual weight */}
              <Line
                type="monotone"
                dataKey="weightLbs"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
                name="Weight"
              />

              {/* Wegovy start marker */}
              {wegovyStartDate && (
                <ReferenceLine
                  x={new Date(wegovyStartDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  stroke="#8b5cf6"
                  strokeDasharray="6 3"
                  strokeWidth={2}
                  label={{
                    value: "Wegovy Start",
                    position: "top",
                    fill: "#8b5cf6",
                    fontSize: 12,
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
