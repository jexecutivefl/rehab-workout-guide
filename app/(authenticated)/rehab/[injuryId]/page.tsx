"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InjuryStatusCard } from "@/components/rehab/InjuryStatusCard";
import { RecoveryStageGauge } from "@/components/rehab/RecoveryStageGauge";
import { MilestoneTracker } from "@/components/rehab/MilestoneTracker";
import { RehabProtocolCard } from "@/components/rehab/RehabProtocolCard";
import { PainTrendChart } from "@/components/rehab/PainTrendChart";
import type { InjuryType, InjuryStage } from "@/types/index";

// Map URL slug to InjuryType
const INJURY_MAP: Record<string, { type: InjuryType; label: string; side: string; painLevel: number; onsetDate: string }> = {
  "plantar-fasciitis": {
    type: "PLANTAR_FASCIITIS",
    label: "Plantar Fasciitis",
    side: "Right Foot",
    painLevel: 3,
    onsetDate: "2025-12-01",
  },
  "sprained-elbow": {
    type: "SPRAINED_ELBOW",
    label: "Sprained Elbow",
    side: "Left Elbow",
    painLevel: 4,
    onsetDate: "2026-01-15",
  },
};

// Generate 30 days of sample pain data
function generateSamplePainData(): { date: string; prePain: number; postPain: number }[] {
  const data: { date: string; prePain: number; postPain: number }[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Simulate a general downward trend with some noise
    const basePre = Math.max(1, Math.min(8, 6 - (29 - i) * 0.12 + (Math.random() * 2 - 1)));
    const basePost = Math.max(1, Math.min(9, basePre + (Math.random() * 2 - 0.5)));

    data.push({
      date: dateStr,
      prePain: Math.round(basePre * 10) / 10,
      postPain: Math.round(basePost * 10) / 10,
    });
  }

  return data;
}

// Placeholder achieved milestones
const INITIAL_ACHIEVED: Record<InjuryType, string[]> = {
  PLANTAR_FASCIITIS: ["pf-m1-pain-free-seated"],
  SPRAINED_ELBOW: ["elbow-m1-isometric-hold"],
};

/**
 * Injury Detail Page
 *
 * Full rehab dashboard for a specific injury showing:
 * - Injury status card with stage management
 * - Recovery stage gauge
 * - Milestone tracker
 * - Rehab protocol
 * - Pain trend chart
 */
export default function InjuryDetailPage({
  params,
}: {
  params: Promise<{ injuryId: string }>;
}) {
  const { injuryId } = use(params);

  const injuryConfig = INJURY_MAP[injuryId];

  const [stage, setStage] = useState<InjuryStage>(2);
  const [achievedIds, setAchievedIds] = useState<string[]>(
    injuryConfig ? INITIAL_ACHIEVED[injuryConfig.type] : []
  );

  const painData = useMemo(() => generateSamplePainData(), []);

  if (!injuryConfig) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Injury Not Found
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            No rehab protocol found for &quot;{injuryId}&quot;.
          </p>
          <Link href="/rehab" className="mt-4 inline-block">
            <Button variant="outline" className="min-h-[48px]">
              Back to Rehab Overview
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  function handleMilestoneToggle(milestoneId: string, achieved: boolean) {
    setAchievedIds((prev) =>
      achieved ? [...prev, milestoneId] : prev.filter((id) => id !== milestoneId)
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {injuryConfig.label}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Rehab protocol and progress tracking
          </p>
        </div>
        <Link href="/rehab">
          <Button variant="outline" className="min-h-[48px]">
            Back to Rehab
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        {/* Top row: Status Card + Stage Gauge */}
        <div className="grid gap-6 lg:grid-cols-2">
          <InjuryStatusCard
            injuryType={injuryConfig.type}
            stage={stage}
            painLevel={injuryConfig.painLevel}
            side={injuryConfig.side}
            onsetDate={injuryConfig.onsetDate}
            onStageChange={setStage}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recovery Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <RecoveryStageGauge
                injuryType={injuryConfig.type}
                currentStage={stage}
              />
            </CardContent>
          </Card>
        </div>

        {/* Middle row: Protocol + Milestones */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RehabProtocolCard
            injuryType={injuryConfig.type}
            stage={stage}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <MilestoneTracker
                injuryType={injuryConfig.type}
                achievedIds={achievedIds}
                onToggle={handleMilestoneToggle}
              />
            </CardContent>
          </Card>
        </div>

        {/* Bottom: Pain Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pain Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <PainTrendChart data={painData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
