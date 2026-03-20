"use client";

import { cn } from "@/lib/utils";
import type { InjuryType, InjuryStage } from "@/types/index";

const STAGE_LABELS: Record<InjuryType, Record<InjuryStage, string>> = {
  PLANTAR_FASCIITIS: {
    1: "Seated rehab only",
    2: "Standing tolerance",
    3: "Elliptical + limited standing",
    4: "Full clearance",
  },
  SPRAINED_ELBOW: {
    1: "Isometric holds",
    2: "Band resistance",
    3: "Light bilateral pressing",
    4: "Full clearance",
  },
  SHOULDER_INSTABILITY: {
    1: "Isometric rotator cuff only",
    2: "Band resistance + scapular control",
    3: "Light overhead + moderate pressing",
    4: "Full clearance",
  },
};

const STAGE_COLORS: Record<InjuryStage, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-yellow-500",
  4: "bg-green-500",
};

const STAGE_RING_COLORS: Record<InjuryStage, string> = {
  1: "ring-red-500",
  2: "ring-orange-500",
  3: "ring-yellow-500",
  4: "ring-green-500",
};

interface RecoveryStageGaugeProps {
  injuryType: InjuryType;
  currentStage: InjuryStage;
}

export function RecoveryStageGauge({ injuryType, currentStage }: RecoveryStageGaugeProps) {
  const labels = STAGE_LABELS[injuryType];

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="relative flex items-center gap-1">
        {([1, 2, 3, 4] as InjuryStage[]).map((s) => (
          <div key={s} className="relative flex-1">
            <div
              className={cn(
                "h-3 rounded-full transition-all",
                s <= currentStage
                  ? STAGE_COLORS[s]
                  : "bg-gray-200 dark:bg-gray-700"
              )}
            />
            {s === currentStage && (
              <div
                className={cn(
                  "absolute -top-1 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white ring-2",
                  STAGE_COLORS[currentStage],
                  STAGE_RING_COLORS[currentStage],
                  "dark:border-gray-900"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Stage labels */}
      <div className="grid grid-cols-4 gap-1">
        {([1, 2, 3, 4] as InjuryStage[]).map((s) => (
          <div
            key={s}
            className={cn(
              "text-center text-xs leading-tight",
              s === currentStage
                ? "font-semibold text-gray-900 dark:text-gray-100"
                : "text-gray-400 dark:text-gray-500"
            )}
          >
            <div className="mb-0.5 font-medium">Stage {s}</div>
            <div>{labels[s]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
