"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calculateReadiness, getReadinessLevel } from "@/lib/readinessScore";

interface DailyCheckInProps {
  onComplete: (checkIn: {
    elbowPain: number;
    shoulderPain: number;
    footPain: number;
    energyLevel: number;
    sleepQuality: number;
    stiffnessLevel: number;
    readinessScore: number;
    notes: string;
  }) => void;
}

function PainSlider({
  label,
  value,
  onChange,
  max = 10,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  const color =
    value <= 2
      ? "bg-green-500"
      : value <= 5
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="font-mono font-medium">{value}/{max}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${
            value <= 2 ? "#22c55e" : value <= 5 ? "#eab308" : "#ef4444"
          } ${(value / max) * 100}%, #d1d5db ${(value / max) * 100}%)`,
        }}
      />
    </div>
  );
}

export function DailyCheckIn({ onComplete }: DailyCheckInProps) {
  const [elbowPain, setElbowPain] = useState(0);
  const [shoulderPain, setShoulderPain] = useState(0);
  const [footPain, setFootPain] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [stiffnessLevel, setStiffnessLevel] = useState(0);
  const [notes, setNotes] = useState("");

  const readinessScore = useMemo(
    () =>
      calculateReadiness({
        elbowPain,
        shoulderPain,
        footPain,
        energyLevel,
        sleepQuality,
        stiffnessLevel,
      }),
    [elbowPain, shoulderPain, footPain, energyLevel, sleepQuality, stiffnessLevel]
  );

  const readiness = useMemo(() => getReadinessLevel(readinessScore), [readinessScore]);

  const readinessColor =
    readiness.level === "rest" || readiness.level === "recovery"
      ? "text-red-600 dark:text-red-400"
      : readiness.level === "modified"
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-green-600 dark:text-green-400";

  const handleSubmit = () => {
    onComplete({
      elbowPain,
      shoulderPain,
      footPain,
      energyLevel,
      sleepQuality,
      stiffnessLevel,
      readinessScore,
      notes,
    });
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Pain Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pain Levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PainSlider label="Left Elbow" value={elbowPain} onChange={setElbowPain} />
          <PainSlider label="Left Shoulder" value={shoulderPain} onChange={setShoulderPain} />
          <PainSlider label="Right Foot (PF)" value={footPain} onChange={setFootPain} />
        </CardContent>
      </Card>

      {/* Energy & Recovery */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Energy & Recovery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PainSlider label="Energy Level" value={energyLevel} onChange={setEnergyLevel} />
          <PainSlider label="Sleep Quality" value={sleepQuality} onChange={setSleepQuality} />
          <PainSlider label="Stiffness" value={stiffnessLevel} onChange={setStiffnessLevel} />
        </CardContent>
      </Card>

      {/* Readiness Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className={cn("text-4xl font-bold", readinessColor)}>
              {readinessScore}
            </div>
            <div className={cn("text-lg font-medium mt-1", readinessColor)}>
              {readiness.label}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {readiness.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-6">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about how you're feeling today..."
            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none"
            rows={3}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} className="w-full" size="lg">
        Get Today&apos;s Workout
      </Button>
    </div>
  );
}
