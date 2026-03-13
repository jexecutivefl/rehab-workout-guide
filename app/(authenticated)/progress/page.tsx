"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProgressSummary } from "@/components/progress/ProgressSummary";
import { WeightTrendChart } from "@/components/progress/WeightTrendChart";
import { VolumeChart } from "@/components/progress/VolumeChart";
import { StrengthProgressChart } from "@/components/progress/StrengthProgressChart";
import { WorkoutHeatmap } from "@/components/progress/WorkoutHeatmap";

// --- Sample Data ---

function generateWeightData() {
  const data: { date: string; weightLbs: number }[] = [];
  const startDate = new Date("2025-12-22");
  let weight = 220;

  for (let i = 0; i < 12; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 7);
    // ~1 lb/week loss with slight noise
    weight -= 0.8 + Math.random() * 0.4;
    data.push({
      date: date.toISOString().split("T")[0],
      weightLbs: Math.round(weight * 10) / 10,
    });
  }

  return data;
}

function generateVolumeData() {
  const data: {
    week: string;
    chest: number;
    back: number;
    shoulders: number;
    legs: number;
    arms: number;
    core: number;
    injuryAcute?: boolean;
  }[] = [];

  const startDate = new Date("2026-01-19");

  for (let i = 0; i < 8; i++) {
    const weekDate = new Date(startDate);
    weekDate.setDate(weekDate.getDate() + i * 7);
    const label = weekDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const isAcute = i === 2 || i === 3; // weeks 3-4 had acute injury
    const scale = isAcute ? 0.3 : 1;

    data.push({
      week: label,
      chest: Math.round((8 + Math.random() * 4) * scale),
      back: Math.round((10 + Math.random() * 4) * scale),
      shoulders: Math.round((6 + Math.random() * 3) * scale),
      legs: Math.round((12 + Math.random() * 4) * scale),
      arms: Math.round((6 + Math.random() * 3) * scale),
      core: Math.round((4 + Math.random() * 2) * scale),
      injuryAcute: isAcute,
    });
  }

  return data;
}

function generateStrengthData() {
  const exercises = [
    { name: "Bench Press", startWeight: 135, increment: 2.5 },
    { name: "Barbell Row", startWeight: 115, increment: 2.5 },
    { name: "Leg Press", startWeight: 270, increment: 5 },
  ];

  return exercises.map((ex) => {
    const entries: { date: string; weightLbs: number }[] = [];
    let weight = ex.startWeight;
    const startDate = new Date("2026-01-05");

    for (let i = 0; i < 10; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i * 7);
      entries.push({
        date: date.toISOString().split("T")[0],
        weightLbs: weight,
      });
      // Mostly increase, slight plateau / occasional dip
      if (i === 6 || i === 7) {
        weight -= ex.increment; // Simulate a regression period
      } else {
        weight += ex.increment;
      }
    }

    return { exerciseName: ex.name, entries };
  });
}

function generateHeatmapData() {
  const data: { date: string; status: "completed" | "modified" | "rest" | "flagged" | "none" }[] =
    [];
  const today = new Date("2026-03-13");
  const start = new Date(today);
  start.setDate(start.getDate() - 12 * 7);

  const current = new Date(start);
  while (current <= today) {
    const dayOfWeek = current.getDay();
    let status: "completed" | "modified" | "rest" | "flagged" | "none";

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekends: rest
      status = "rest";
    } else if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
      // M/W/F workout days
      const roll = Math.random();
      if (roll < 0.65) status = "completed";
      else if (roll < 0.8) status = "modified";
      else if (roll < 0.9) status = "flagged";
      else status = "rest";
    } else {
      // T/Th: mix of rest and occasional sessions
      status = Math.random() < 0.3 ? "completed" : "rest";
    }

    data.push({
      date: current.toISOString().split("T")[0],
      status,
    });

    current.setDate(current.getDate() + 1);
  }

  return data;
}

// Pre-generate sample data
const weightData = generateWeightData();
const volumeData = generateVolumeData();
const strengthData = generateStrengthData();
const heatmapData = generateHeatmapData();

export default function ProgressPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Progress</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Track your recovery trends and training progress.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-8">
        <ProgressSummary
          totalSessions={42}
          avgWeeklyVolume={46}
          currentStreak={5}
          bestLifts={[
            { name: "Leg Press", weight: 315 },
            { name: "Bench Press", weight: 155 },
            { name: "Barbell Row", weight: 140 },
          ]}
        />
      </div>

      {/* Tabbed Charts */}
      <Tabs defaultValue="weight">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="weight" className="min-h-[48px] px-5">
            Weight
          </TabsTrigger>
          <TabsTrigger value="volume" className="min-h-[48px] px-5">
            Volume
          </TabsTrigger>
          <TabsTrigger value="strength" className="min-h-[48px] px-5">
            Strength
          </TabsTrigger>
          <TabsTrigger value="activity" className="min-h-[48px] px-5">
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weight">
          <WeightTrendChart data={weightData} wegovyStartDate="2025-12-29" />
        </TabsContent>

        <TabsContent value="volume">
          <VolumeChart data={volumeData} />
        </TabsContent>

        <TabsContent value="strength">
          <StrengthProgressChart data={strengthData} />
        </TabsContent>

        <TabsContent value="activity">
          <WorkoutHeatmap data={heatmapData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
