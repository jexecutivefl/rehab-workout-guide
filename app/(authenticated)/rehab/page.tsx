"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InjuryStatusCard } from "@/components/rehab/InjuryStatusCard";
import { getActiveRestrictions } from "@/lib/injuryEngine";
import type { InjuryStage, InjuryContext } from "@/types/index";

/**
 * Rehab Overview Page
 *
 * Shows active injury cards with stage info, current restrictions,
 * and links to detail pages for each injury.
 * Uses placeholder data — real injury data fetching comes in Phase 3.
 */
export default function RehabPage() {
  const [pfStage, setPfStage] = useState<InjuryStage>(2);
  const [elbowStage, setElbowStage] = useState<InjuryStage>(2);

  const injuryContext: InjuryContext = {
    plantarFasciitis: { stage: pfStage, painLevel: 3, side: "RIGHT" },
    sprainedElbow: { stage: elbowStage, painLevel: 4, side: "LEFT" },
  };

  const restrictions = getActiveRestrictions(injuryContext);

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
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4">
          <InjuryStatusCard
            injuryType="PLANTAR_FASCIITIS"
            stage={pfStage}
            painLevel={3}
            side="Right Foot"
            onsetDate="2025-12-01"
            onStageChange={setPfStage}
          />
          <Link href="/rehab/plantar-fasciitis">
            <Button variant="primary" className="min-h-[48px] w-full">
              View Full Protocol
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <InjuryStatusCard
            injuryType="SPRAINED_ELBOW"
            stage={elbowStage}
            painLevel={4}
            side="Left Elbow"
            onsetDate="2026-01-15"
            onStageChange={setElbowStage}
          />
          <Link href="/rehab/sprained-elbow">
            <Button variant="primary" className="min-h-[48px] w-full">
              View Full Protocol
            </Button>
          </Link>
        </div>
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
