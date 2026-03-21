"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlateauSignal, PlateauAdaptation, PlateauSignalType, PlateauAdaptationAction } from "@/types/index";

interface PlateauIndicatorProps {
  signals: PlateauSignal[];
  adaptations: PlateauAdaptation[];
  className?: string;
}

const SIGNAL_TYPE_LABELS: Record<PlateauSignalType, string> = {
  WEIGHT_STALL: "Weight Plateau",
  REP_STALL: "Rep Plateau",
  RPE_CEILING: "Effort Ceiling",
  VOLUME_FLAT: "Volume Plateau",
  EXERCISE_STALENESS: "Exercise Staleness",
};

const ADAPTATION_ACTION_LABELS: Record<PlateauAdaptationAction, string> = {
  SWAP_EXERCISE: "Try a different exercise",
  CHANGE_REP_RANGE: "Change rep range",
  ADD_VOLUME: "Add more volume",
  DELOAD: "Take a deload",
  ROTATE_VARIATION: "Rotate exercise variation",
};

const SEVERITY_DOT: Record<PlateauSignal["severity"], string> = {
  mild: "bg-yellow-400 dark:bg-yellow-500",
  moderate: "bg-orange-400 dark:bg-orange-500",
  strong: "bg-red-500 dark:bg-red-400",
};

export default function PlateauIndicator({ signals, adaptations, className }: PlateauIndicatorProps) {
  if (signals.length === 0) return null;

  // Build a lookup from signal to its adaptation (match by type + exerciseId)
  const adaptationMap = new Map<string, PlateauAdaptation>();
  for (const a of adaptations) {
    const key = `${a.signal.type}:${a.signal.exerciseId ?? a.signal.muscle ?? ""}`;
    adaptationMap.set(key, a);
  }

  return (
    <Card
      className={cn(
        "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20",
        className,
      )}
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          Plateau Detected
          <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-400">
            {signals.length} {signals.length === 1 ? "signal" : "signals"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ul className="space-y-2">
          {signals.map((signal, i) => {
            const key = `${signal.type}:${signal.exerciseId ?? signal.muscle ?? ""}`;
            const adaptation = adaptationMap.get(key);

            return (
              <li key={`${key}-${i}`} className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-1 h-2 w-2 shrink-0 rounded-full",
                    SEVERITY_DOT[signal.severity],
                  )}
                  aria-label={`${signal.severity} severity`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                    {SIGNAL_TYPE_LABELS[signal.type]}
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    {signal.message}
                  </p>
                  {adaptation && (
                    <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                      <span className="font-medium">{ADAPTATION_ACTION_LABELS[adaptation.action]}:</span>{" "}
                      {adaptation.detail}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
