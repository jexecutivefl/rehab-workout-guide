"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InjuryType, InjuryStage } from "@/types/index";

const INJURY_LABELS: Record<InjuryType, string> = {
  PLANTAR_FASCIITIS: "Plantar Fasciitis",
  SPRAINED_ELBOW: "Sprained Elbow",
};

const STAGE_COLORS: Record<InjuryStage, { bg: string; text: string; darkBg: string; darkText: string }> = {
  1: { bg: "bg-red-100", text: "text-red-800", darkBg: "dark:bg-red-900/50", darkText: "dark:text-red-300" },
  2: { bg: "bg-orange-100", text: "text-orange-800", darkBg: "dark:bg-orange-900/50", darkText: "dark:text-orange-300" },
  3: { bg: "bg-yellow-100", text: "text-yellow-800", darkBg: "dark:bg-yellow-900/50", darkText: "dark:text-yellow-300" },
  4: { bg: "bg-green-100", text: "text-green-800", darkBg: "dark:bg-green-900/50", darkText: "dark:text-green-300" },
};

const STAGE_NAMES: Record<InjuryStage, string> = {
  1: "Acute Protection",
  2: "Early Rehab",
  3: "Progressive Loading",
  4: "Full Clearance",
};

interface InjuryStatusCardProps {
  injuryType: InjuryType;
  stage: InjuryStage;
  painLevel: number;
  side: string;
  onsetDate?: string;
  onStageChange: (stage: InjuryStage) => void;
}

export function InjuryStatusCard({
  injuryType,
  stage,
  painLevel,
  side,
  onsetDate,
  onStageChange,
}: InjuryStatusCardProps) {
  const [showStageSelector, setShowStageSelector] = useState(false);

  const stageColor = STAGE_COLORS[stage];
  const daysSinceOnset = onsetDate
    ? Math.floor((Date.now() - new Date(onsetDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">{INJURY_LABELS[injuryType]}</CardTitle>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              stageColor.bg,
              stageColor.text,
              stageColor.darkBg,
              stageColor.darkText
            )}
          >
            Stage {stage}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Side</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{side}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Current Pain</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{painLevel}/10</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Phase</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{STAGE_NAMES[stage]}</span>
          </div>
          {daysSinceOnset !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Days Since Onset</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{daysSinceOnset}</span>
            </div>
          )}

          {showStageSelector ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Select new stage:</p>
              <div className="grid grid-cols-4 gap-2">
                {([1, 2, 3, 4] as InjuryStage[]).map((s) => {
                  const color = STAGE_COLORS[s];
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        onStageChange(s);
                        setShowStageSelector(false);
                      }}
                      className={cn(
                        "min-h-[48px] rounded-lg border-2 text-sm font-semibold transition-all",
                        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                        s === stage
                          ? cn("border-current", color.bg, color.text, color.darkBg, color.darkText)
                          : "border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500"
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[48px] w-full"
                onClick={() => setShowStageSelector(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="mt-4 min-h-[48px] w-full"
              onClick={() => setShowStageSelector(true)}
            >
              Update Stage
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
