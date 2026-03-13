"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PainDataPoint {
  date: string;
  prePain: number;
  postPain: number;
}

interface PainTrendChartProps {
  data: PainDataPoint[];
}

export function PainTrendChart({ data }: PainTrendChartProps) {
  const showAlert = useMemo(() => {
    if (data.length < 3) return false;
    const lastThree = data.slice(-3);
    return lastThree.every((d, i) => {
      if (i === 0) return true;
      return d.postPain > lastThree[i - 1].postPain;
    });
  }, [data]);

  return (
    <div className="space-y-3">
      {showAlert && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          <span className="font-semibold">Alert:</span> Post-session pain trending upward over last 3
          sessions. Consider deloading or consulting your provider.
        </div>
      )}

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              className="text-gray-400 dark:text-gray-500"
              tickFormatter={(value: string) => {
                const parts = value.split("-");
                return `${parts[1]}/${parts[2]}`;
              }}
            />
            <YAxis
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              className="text-gray-400 dark:text-gray-500"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-gray-900, #111827)",
                border: "1px solid var(--color-gray-700, #374151)",
                borderRadius: "8px",
                color: "#f3f4f6",
                fontSize: "12px",
              }}
              labelFormatter={(label) => `Date: ${String(label)}`}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            />
            <Line
              type="monotone"
              dataKey="prePain"
              name="Pre-Session"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#3b82f6" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="postPain"
              name="Post-Session"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3, fill: "#ef4444" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
