"use client";

import { use, useMemo, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InjuryStatusCard } from "@/components/rehab/InjuryStatusCard";
import { RecoveryStageGauge } from "@/components/rehab/RecoveryStageGauge";
import { MilestoneTracker } from "@/components/rehab/MilestoneTracker";
import { RehabProtocolCard } from "@/components/rehab/RehabProtocolCard";
import { PainTrendChart } from "@/components/rehab/PainTrendChart";
import {
  useActiveInjuries,
  useUpdateInjuryStage,
  useRehabMilestones,
  useToggleMilestone,
  useWorkoutSessions,
} from "@/hooks/useAmplifyData";
import type { InjuryType, InjuryStage } from "@/types/index";

// Map URL slug to injury type
const SLUG_TO_TYPE: Record<string, { type: InjuryType; label: string; side: string }> = {
  "plantar-fasciitis": {
    type: "PLANTAR_FASCIITIS",
    label: "Plantar Fasciitis",
    side: "Right Foot",
  },
  "sprained-elbow": {
    type: "SPRAINED_ELBOW",
    label: "Sprained Elbow",
    side: "Left Elbow",
  },
};

/**
 * Injury Detail Page
 *
 * Full rehab dashboard for a specific injury showing data from Amplify:
 * - Injury status card with persistent stage management
 * - Recovery stage gauge
 * - Milestone tracker (persisted to DB)
 * - Rehab protocol
 * - Pain trend chart from real workout sessions
 */
export default function InjuryDetailPage({
  params,
}: {
  params: Promise<{ injuryId: string }>;
}) {
  const { injuryId } = use(params);
  const config = SLUG_TO_TYPE[injuryId];

  const { data: injuries, isLoading: injuriesLoading } = useActiveInjuries();
  const { data: milestones, isLoading: milestonesLoading } = useRehabMilestones();
  const { data: sessions } = useWorkoutSessions(50);
  const updateStage = useUpdateInjuryStage();
  const toggleMilestone = useToggleMilestone();

  // Find the specific injury record
  const injury = useMemo(
    () => injuries?.find((i) => i.injuryType === config?.type),
    [injuries, config]
  );

  const stage = (injury?.stage ?? 2) as InjuryStage;

  // Filter milestones for this injury type
  const injuryMilestones = useMemo(
    () => milestones?.filter((m) => m.injuryType === config?.type) ?? [],
    [milestones, config]
  );

  const achievedIds = useMemo(
    () => injuryMilestones.filter((m) => m.achieved).map((m) => m.milestoneKey),
    [injuryMilestones]
  );

  // Build pain trend data from real workout sessions
  const painData = useMemo(() => {
    if (!sessions) return [];

    const sorted = [...sessions]
      .filter((s) => s.startedAt && s.preSessionPainLevel != null)
      .sort((a, b) => new Date(a.startedAt!).getTime() - new Date(b.startedAt!).getTime())
      .slice(-30);

    return sorted.map((s) => ({
      date: new Date(s.startedAt!).toISOString().split("T")[0],
      prePain: s.preSessionPainLevel ?? 0,
      postPain: s.postSessionPainLevel ?? 0,
    }));
  }, [sessions]);

  const handleStageChange = useCallback(
    (newStage: InjuryStage) => {
      if (!injury) return;
      updateStage.mutate(
        { injuryId: injury.id, stage: newStage },
        {
          onSuccess: () => toast.success(`Stage updated to ${newStage}`),
          onError: (err) => toast.error(`Failed to update: ${err.message}`),
        }
      );
    },
    [injury, updateStage]
  );

  const handleMilestoneToggle = useCallback(
    (milestoneKey: string, achieved: boolean) => {
      // Find the DB record by milestoneKey
      const record = injuryMilestones.find((m) => m.milestoneKey === milestoneKey);
      if (record) {
        toggleMilestone.mutate(
          { milestoneId: record.id, achieved },
          {
            onSuccess: () =>
              achieved
                ? toast.success("Milestone achieved!")
                : toast("Milestone unmarked"),
            onError: (err) => toast.error(`Failed: ${err.message}`),
          }
        );
      }
    },
    [injuryMilestones, toggleMilestone]
  );

  if (!config) {
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

  if (injuriesLoading || milestonesLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-gray-500 dark:text-gray-400">Loading rehab data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {config.label}
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
            injuryType={config.type}
            stage={stage}
            painLevel={injury?.currentPainLevel ?? 0}
            side={config.side}
            onsetDate={injury?.onsetDate ?? undefined}
            onStageChange={handleStageChange}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recovery Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <RecoveryStageGauge
                injuryType={config.type}
                currentStage={stage}
              />
            </CardContent>
          </Card>
        </div>

        {/* Middle row: Protocol + Milestones */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RehabProtocolCard
            injuryType={config.type}
            stage={stage}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <MilestoneTracker
                injuryType={config.type}
                achievedIds={achievedIds}
                onToggle={handleMilestoneToggle}
              />
            </CardContent>
          </Card>
        </div>

        {/* Bottom: Pain Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pain Trend (Recent Sessions)</CardTitle>
          </CardHeader>
          <CardContent>
            {painData.length > 0 ? (
              <PainTrendChart data={painData} />
            ) : (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Complete some workout sessions to see pain trend data.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
