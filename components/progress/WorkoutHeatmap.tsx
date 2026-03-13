"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type HeatmapStatus = "completed" | "modified" | "rest" | "flagged" | "none";

interface HeatmapDataPoint {
  date: string;
  status: HeatmapStatus;
}

interface WorkoutHeatmapProps {
  data: HeatmapDataPoint[];
}

const STATUS_COLORS: Record<HeatmapStatus, string> = {
  completed: "bg-green-500 dark:bg-green-600",
  modified: "bg-yellow-400 dark:bg-yellow-500",
  rest: "bg-gray-200 dark:bg-gray-700",
  flagged: "bg-red-500 dark:bg-red-600",
  none: "bg-gray-100 dark:bg-gray-800",
};

const STATUS_LABELS: Record<HeatmapStatus, string> = {
  completed: "Completed",
  modified: "Modified",
  rest: "Rest Day",
  flagged: "Flagged",
  none: "No Data",
};

const DAY_LABELS = ["", "M", "", "W", "", "F", ""];

export function WorkoutHeatmap({ data }: WorkoutHeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => {
    // Build a date-to-status lookup
    const statusMap = new Map<string, HeatmapStatus>();
    for (const point of data) {
      statusMap.set(point.date, point.status);
    }

    // Find date range: last 12 weeks ending today
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 12 * 7);
    // Align to Monday
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    const weeksData: { date: Date; status: HeatmapStatus }[][] = [];
    const months: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;

    const current = new Date(startDate);
    let weekIndex = 0;

    while (current <= today || weeksData.length < 12) {
      const week: { date: Date; status: HeatmapStatus }[] = [];
      for (let day = 0; day < 7; day++) {
        const dateStr = current.toISOString().split("T")[0];
        const status = statusMap.get(dateStr) ?? "none";
        week.push({ date: new Date(current), status });

        // Track month changes for labels
        if (day === 0 && current.getMonth() !== lastMonth) {
          lastMonth = current.getMonth();
          months.push({
            label: current.toLocaleDateString("en-US", { month: "short" }),
            colIndex: weekIndex,
          });
        }

        current.setDate(current.getDate() + 1);
      }
      weeksData.push(week);
      weekIndex++;

      if (weeksData.length >= 12 && current > today) break;
    }

    return { weeks: weeksData, monthLabels: months };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Workout Activity</CardTitle>
        <CardDescription>Your workout activity over the last 12 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-fit">
            {/* Month labels */}
            <div className="mb-1 flex">
              <div className="w-8 shrink-0" /> {/* Spacer for day labels */}
              <div className="flex gap-[3px]">
                {weeks.map((_, weekIdx) => {
                  const monthLabel = monthLabels.find((m) => m.colIndex === weekIdx);
                  return (
                    <div
                      key={weekIdx}
                      className="flex w-[18px] items-end justify-start text-[10px] text-gray-500 dark:text-gray-400"
                    >
                      {monthLabel ? monthLabel.label : ""}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid */}
            <div className="flex">
              {/* Day labels column */}
              <div className="mr-1 flex w-7 shrink-0 flex-col gap-[3px]">
                {DAY_LABELS.map((label, i) => (
                  <div
                    key={i}
                    className="flex h-[18px] items-center justify-end pr-1 text-[10px] text-gray-500 dark:text-gray-400"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Heatmap cells */}
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIdx) => (
                      <div
                        key={dayIdx}
                        className={cn(
                          "h-[18px] w-[18px] rounded-sm transition-colors",
                          STATUS_COLORS[day.status]
                        )}
                        title={`${day.date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}: ${STATUS_LABELS[day.status]}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {(["completed", "modified", "rest", "flagged"] as HeatmapStatus[]).map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={cn("h-3 w-3 rounded-sm", STATUS_COLORS[status])} />
              <span className="text-gray-600 dark:text-gray-400">{STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
