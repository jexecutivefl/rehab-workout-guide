"use client";

import { milestones } from "@/data/milestones";
import { cn } from "@/lib/utils";
import type { InjuryType, InjuryStage } from "@/types/index";

const STAGE_BADGE_COLORS: Record<InjuryStage, string> = {
  1: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  2: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  3: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  4: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
};

interface MilestoneTrackerProps {
  injuryType: InjuryType;
  achievedIds: string[];
  onToggle: (milestoneId: string, achieved: boolean) => void;
}

export function MilestoneTracker({ injuryType, achievedIds, onToggle }: MilestoneTrackerProps) {
  const filtered = milestones
    .filter((m) => m.injuryType === injuryType)
    .sort((a, b) => a.requiredStage - b.requiredStage);

  return (
    <div className="space-y-3">
      {filtered.map((milestone) => {
        const isAchieved = achievedIds.includes(milestone.id);
        return (
          <label
            key={milestone.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
              isAchieved
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
            )}
          >
            <input
              type="checkbox"
              checked={isAchieved}
              onChange={() => onToggle(milestone.id, !isAchieved)}
              className="mt-0.5 h-5 w-5 min-w-[20px] cursor-pointer rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-gray-600"
            />
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isAchieved
                      ? "text-green-800 line-through dark:text-green-300"
                      : "text-gray-900 dark:text-gray-100"
                  )}
                >
                  {milestone.label}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    STAGE_BADGE_COLORS[milestone.requiredStage]
                  )}
                >
                  Stage {milestone.requiredStage}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Unlocks: {milestone.unlocks}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
