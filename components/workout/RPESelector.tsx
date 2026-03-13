"use client";

import { cn } from "@/lib/utils";

type RPESelectorProps = {
  value: number;
  onChange: (rpe: number) => void;
  className?: string;
};

const RPE_DESCRIPTORS: Record<number, string> = {
  1: "Very Easy",
  2: "Very Easy",
  3: "Easy",
  4: "Easy",
  5: "Moderate",
  6: "Moderate",
  7: "Hard",
  8: "Hard",
  9: "Very Hard",
  10: "Max Effort",
};

const RPE_COLORS: Record<number, string> = {
  1: "bg-green-500 text-white",
  2: "bg-green-400 text-white",
  3: "bg-lime-400 text-gray-900",
  4: "bg-lime-500 text-gray-900",
  5: "bg-yellow-400 text-gray-900",
  6: "bg-yellow-500 text-gray-900",
  7: "bg-orange-400 text-white",
  8: "bg-orange-500 text-white",
  9: "bg-red-500 text-white",
  10: "bg-red-600 text-white",
};

const RPE_RING_COLORS: Record<number, string> = {
  1: "ring-green-500",
  2: "ring-green-400",
  3: "ring-lime-400",
  4: "ring-lime-500",
  5: "ring-yellow-400",
  6: "ring-yellow-500",
  7: "ring-orange-400",
  8: "ring-orange-500",
  9: "ring-red-500",
  10: "ring-red-600",
};

export function RPESelector({ value, onChange, className }: RPESelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          RPE
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {RPE_DESCRIPTORS[value]}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((rpe) => (
          <button
            key={rpe}
            type="button"
            onClick={() => onChange(rpe)}
            className={cn(
              "flex items-center justify-center rounded-lg font-bold text-sm transition-all",
              "min-h-[48px] min-w-[48px]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              value === rpe
                ? cn(RPE_COLORS[rpe], "ring-2 ring-offset-2", RPE_RING_COLORS[rpe], "scale-110")
                : cn(
                    "bg-gray-100 text-gray-700 hover:bg-gray-200",
                    "dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  )
            )}
          >
            {rpe}
          </button>
        ))}
      </div>
    </div>
  );
}
