"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/layout/AuthGuard";
import { getActiveRestrictions } from "@/lib/injuryEngine";
import type { InjuryContext } from "@/types/index";

// ─── Hardcoded injury context (replaced by real data in Phase 3) ──
const HARDCODED_INJURY_CONTEXT: InjuryContext = {
  plantarFasciitis: { stage: 2, painLevel: 3, side: "RIGHT" },
  sprainedElbow: { stage: 1, painLevel: 5, side: "LEFT" },
};

/**
 * Dashboard Page
 *
 * Main rehab-focused dashboard showing:
 * - Welcome message + quick action
 * - Quick stats
 * - Today's workout preview
 * - Active restrictions from injury engine
 * - Injury status cards
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const displayName = user?.signInDetails?.loginId || "there";

  const restrictions = useMemo(
    () => getActiveRestrictions(HARDCODED_INJURY_CONTEXT),
    []
  );

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome + Quick Action */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Here is your recovery overview for today.
          </p>
        </div>
        <Link href="/workout/active">
          <Button size="lg" className="min-h-[48px] px-6">
            Start Workout
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Injuries</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">2</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sessions This Week</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">3</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Pain Level</p>
            <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">2.5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Streak</p>
            <p className="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-400">5 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Workout */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Workout</CardTitle>
            <CardDescription>Upper body rehab-adapted session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Seated Dumbbell Press</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">3 sets x 10 reps - Modified for elbow</p>
                </div>
                <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                  Modified
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Lat Pulldown</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">3 sets x 12 reps</p>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-300">
                  Safe
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">PF Rehab: Towel Curls</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">3 sets x 15 reps - Rehab protocol</p>
                </div>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  Rehab
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/workout/active">
                <Button className="w-full min-h-[48px]">Begin Session</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Restrictions from Injury Engine */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Active Restrictions
        </h2>
        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-2">
              {restrictions.map((restriction, i) => {
                const isElevatedPain = restriction.includes("Elevated pain");
                const isPFRule = restriction.startsWith("PF:");
                const isElbowRule = restriction.startsWith("Elbow:");
                return (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        isElevatedPain
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : isPFRule
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                            : isElbowRule
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      )}
                    >
                      {isElevatedPain ? "!" : isPFRule ? "F" : "E"}
                    </span>
                    <span
                      className={cn(
                        "text-gray-700 dark:text-gray-300",
                        isElevatedPain && "font-medium text-red-700 dark:text-red-300"
                      )}
                    >
                      {restriction}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Injury Status */}
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
        Injury Status
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Plantar Fasciitis</CardTitle>
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                Stage 2
              </span>
            </div>
            <CardDescription>Right foot - Active rehab phase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Last pain level</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">3/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Days in stage</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">12</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-2 w-1/2 rounded-full bg-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Sprained Elbow</CardTitle>
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/50 dark:text-red-300">
                Stage 1
              </span>
            </div>
            <CardDescription>Left elbow - Acute phase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Last pain level</span>
                <span className={cn(
                  "font-medium",
                  HARDCODED_INJURY_CONTEXT.sprainedElbow.painLevel >= 5
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-gray-900 dark:text-gray-100"
                )}>
                  {HARDCODED_INJURY_CONTEXT.sprainedElbow.painLevel}/10
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Days in stage</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">4</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-2 w-1/4 rounded-full bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
