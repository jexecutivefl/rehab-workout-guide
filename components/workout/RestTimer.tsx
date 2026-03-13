"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RestTimerProps = {
  durationSec: number;
  onComplete: () => void;
  className?: string;
};

export function RestTimer({
  durationSec,
  onComplete,
  className,
}: RestTimerProps) {
  const [totalDuration, setTotalDuration] = useState(durationSec);
  const [remaining, setRemaining] = useState(durationSec);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (remaining <= 0) {
      onCompleteRef.current();
      return;
    }

    const interval = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining]);

  const addTime = useCallback(() => {
    setRemaining((r) => r + 30);
    setTotalDuration((d) => d + 30);
  }, []);

  const skipRest = useCallback(() => {
    setRemaining(0);
  }, []);

  const progress = totalDuration > 0 ? remaining / totalDuration : 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  // Circle progress values
  const size = 160;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      {/* Circular Progress */}
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              "transition-all duration-1000 ease-linear",
              remaining > 10
                ? "text-blue-500 dark:text-blue-400"
                : "text-red-500 dark:text-red-400"
            )}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Rest
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={addTime}
          className="min-h-[48px]"
        >
          +30s
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={skipRest}
          className="min-h-[48px]"
        >
          Skip Rest
        </Button>
      </div>
    </div>
  );
}
