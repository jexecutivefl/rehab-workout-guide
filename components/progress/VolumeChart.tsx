"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface VolumeDataPoint {
  week: string;
  chest: number;
  back: number;
  shoulders: number;
  legs: number;
  arms: number;
  core: number;
  injuryAcute?: boolean;
}

interface VolumeChartProps {
  data: VolumeDataPoint[];
}

const MUSCLE_GROUPS = [
  { key: "chest", label: "Chest", color: "#ef4444", colorMuted: "#7f1d1d" },
  { key: "back", label: "Back", color: "#3b82f6", colorMuted: "#1e3a5f" },
  { key: "shoulders", label: "Shoulders", color: "#f59e0b", colorMuted: "#78350f" },
  { key: "legs", label: "Legs", color: "#10b981", colorMuted: "#064e3b" },
  { key: "arms", label: "Arms", color: "#8b5cf6", colorMuted: "#4c1d95" },
  { key: "core", label: "Core", color: "#ec4899", colorMuted: "#831843" },
] as const;

export function VolumeChart({ data }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-gray-500 dark:text-gray-400">No volume data recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    displayWeek: d.week,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Weekly Volume</CardTitle>
        <CardDescription>
          Total sets per muscle group each week. Grayed-out weeks indicate acute injury (stage 1-2).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-700"
              />
              <XAxis
                dataKey="displayWeek"
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
                label={{
                  value: "Sets",
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
                formatter={((value: unknown, name: unknown) => [`${value} sets`, String(name ?? "")]) as never}
              />
              <Legend />

              {MUSCLE_GROUPS.map((group) => (
                <Bar
                  key={group.key}
                  dataKey={group.key}
                  stackId="volume"
                  name={group.label}
                  fill={group.color}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${group.key}-${index}`}
                      fill={entry.injuryAcute ? "#6b7280" : group.color}
                      opacity={entry.injuryAcute ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {data.some((d) => d.injuryAcute) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="h-3 w-3 rounded bg-gray-400 opacity-40" />
            <span>Grayed-out weeks had an acute injury (stage 1-2)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
