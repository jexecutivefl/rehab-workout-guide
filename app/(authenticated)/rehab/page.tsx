"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InjuryStatusCard } from "@/components/rehab/InjuryStatusCard";
import { DeskRehabCard } from "@/components/rehab/DeskRehabCard";
import { getActiveRestrictions } from "@/lib/injuryEngine";
import { useActiveInjuries, useUpdateInjuryStage } from "@/hooks/useAmplifyData";
import type { InjuryStage, InjuryContext } from "@/types/index";

const SLUG_MAP: Record<string, string> = {
  PLANTAR_FASCIITIS: "plantar-fasciitis",
  SPRAINED_ELBOW: "sprained-elbow",
};

const SIDE_MAP: Record<string, string> = {
  PLANTAR_FASCIITIS: "Right Foot",
  SPRAINED_ELBOW: "Left Elbow",
};

/**
 * Rehab Overview Page
 *
 * Shows active injury cards from real DB data, persists stage changes,
 * and displays current restrictions from the injury engine.
 */
export default function RehabPage() {
  const { data: injuries, isLoading } = useActiveInjuries();
  const updateStage = useUpdateInjuryStage();

  const handleStageChange = useCallback(
    (injuryId: string, newStage: InjuryStage) => {
      updateStage.mutate(
        { injuryId, stage: newStage },
        {
          onSuccess: () => toast.success(`Stage updated to ${newStage}`),
          onError: (err) => toast.error(`Failed to update stage: ${err.message}`),
        }
      );
    },
    [updateStage]
  );

  const injuryContext = useMemo<InjuryContext>(() => {
    const pf = injuries?.find((i) => i.injuryType === "PLANTAR_FASCIITIS");
    const elbow = injuries?.find((i) => i.injuryType === "SPRAINED_ELBOW");
    const shoulder = injuries?.find((i) => i.injuryType === "SHOULDER_INSTABILITY");
    return {
      plantarFasciitis: {
        stage: (pf?.stage ?? 2) as InjuryStage,
        painLevel: pf?.currentPainLevel ?? 0,
        side: "RIGHT",
      },
      sprainedElbow: {
        stage: (elbow?.stage ?? 1) as InjuryStage,
        painLevel: elbow?.currentPainLevel ?? 0,
        side: "LEFT",
      },
      shoulderInstability: {
        stage: (shoulder?.stage ?? 1) as InjuryStage,
        painLevel: shoulder?.currentPainLevel ?? 0,
        side: "LEFT",
      },
    };
  }, [injuries]);

  const restrictions = useMemo(
    () => getActiveRestrictions(injuryContext),
    [injuryContext]
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-gray-500 dark:text-gray-400">Loading rehab data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Rehab Protocols
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Track your injury recovery and follow stage-based rehab protocols.
        </p>
      </div>

      {/* Injury Status Cards */}
      {injuries && injuries.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {injuries.map((injury) => {
            const slug = SLUG_MAP[injury.injuryType ?? ""] ?? "";
            const side = SIDE_MAP[injury.injuryType ?? ""] ?? "";

            return (
              <div key={injury.id} className="space-y-4">
                <InjuryStatusCard
                  injuryType={injury.injuryType as "PLANTAR_FASCIITIS" | "SPRAINED_ELBOW"}
                  stage={(injury.stage ?? 1) as InjuryStage}
                  painLevel={injury.currentPainLevel ?? 0}
                  side={side}
                  onsetDate={injury.onsetDate ?? undefined}
                  onStageChange={(s) => handleStageChange(injury.id, s)}
                />
                <Link href={`/rehab/${slug}`}>
                  <Button variant="primary" className="min-h-[48px] w-full">
                    View Full Protocol
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="mb-8">
          <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
            No active injuries recorded. Add injuries during onboarding or in your profile.
          </CardContent>
        </Card>
      )}

      {/* Desk Rehab Quick Session */}
      <div className="mt-8">
        <DeskRehabCard injuryContext={injuryContext} />
      </div>

      {/* Active Restrictions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Active Restrictions</CardTitle>
        </CardHeader>
        <CardContent>
          {restrictions.length > 0 ? (
            <ul className="space-y-2">
              {restrictions.map((restriction, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  {restriction}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No active restrictions. All exercises are cleared.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
