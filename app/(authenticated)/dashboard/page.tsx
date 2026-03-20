"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/layout/AuthGuard";
import { getActiveRestrictions } from "@/lib/injuryEngine";
import { useActiveInjuries, useWorkoutSessions } from "@/hooks/useAmplifyData";
import type { InjuryContext, InjuryStage } from "@/types/index";

/**
 * Dashboard Page
 *
 * Main rehab-focused dashboard showing:
 * - Welcome message + quick action
 * - Quick stats from real data
 * - Today's workout preview
 * - Active restrictions from injury engine
 * - Injury status cards
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const displayName = user?.signInDetails?.loginId || "there";

  const { data: injuries, isLoading: injuriesLoading } = useActiveInjuries();
  const { data: sessions, isLoading: sessionsLoading } = useWorkoutSessions(50);

  // Build InjuryContext from real DB records
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

  // Compute stats from real session data
  const stats = useMemo(() => {
    if (!sessions) return { activeInjuries: 0, sessionsThisWeek: 0, avgPain: 0, streak: 0 };

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekSessions = sessions.filter(
      (s) => s.startedAt && new Date(s.startedAt) >= startOfWeek
    );

    const painValues = thisWeekSessions
      .map((s) => s.postSessionPainLevel)
      .filter((p): p is number => p != null);
    const avgPain = painValues.length > 0
      ? Math.round((painValues.reduce((a, b) => a + b, 0) / painValues.length) * 10) / 10
      : 0;

    // Streak: consecutive days with sessions (working backwards from today)
    let streak = 0;
    const sortedDates = sessions
      .filter((s) => s.startedAt)
      .map((s) => new Date(s.startedAt!).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const today = new Date();
    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (sortedDates[i] === expected.toDateString()) {
        streak++;
      } else break;
    }

    return {
      activeInjuries: injuries?.length ?? 0,
      sessionsThisWeek: thisWeekSessions.length,
      avgPain,
      streak,
    };
  }, [sessions, injuries]);

  const pfInjury = injuries?.find((i) => i.injuryType === "PLANTAR_FASCIITIS");
  const elbowInjury = injuries?.find((i) => i.injuryType === "SPRAINED_ELBOW");

  const isLoading = injuriesLoading || sessionsLoading;

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
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isLoading ? "—" : stats.activeInjuries}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sessions This Week</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isLoading ? "—" : stats.sessionsThisWeek}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Pain Level</p>
            <p className={cn(
              "mt-1 text-3xl font-bold",
              stats.avgPain <= 3
                ? "text-green-600 dark:text-green-400"
                : "text-yellow-600 dark:text-yellow-400"
            )}>
              {isLoading ? "—" : stats.avgPain}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Streak</p>
            <p className="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {isLoading ? "—" : `${stats.streak} days`}
            </p>
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
        {injuries && injuries.length > 0 ? (
          injuries.map((injury) => {
            const stage = (injury.stage ?? 1) as InjuryStage;
            const painLevel = injury.currentPainLevel ?? 0;
            const label = injury.injuryType === "PLANTAR_FASCIITIS" ? "Plantar Fasciitis" : "Sprained Elbow";
            const sideLabel = injury.injuryType === "PLANTAR_FASCIITIS" ? "Right foot" : "Left elbow";
            const stageNames: Record<number, string> = { 1: "Acute phase", 2: "Active rehab phase", 3: "Progressive loading", 4: "Full clearance" };
            const stageColors: Record<number, { badge: string; bar: string; width: string }> = {
              1: { badge: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300", bar: "bg-red-500", width: "w-1/4" },
              2: { badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300", bar: "bg-orange-500", width: "w-1/2" },
              3: { badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300", bar: "bg-yellow-500", width: "w-3/4" },
              4: { badge: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300", bar: "bg-green-500", width: "w-full" },
            };
            const colors = stageColors[stage] ?? stageColors[1];
            const daysSinceAssessed = injury.lastAssessedAt
              ? Math.floor((Date.now() - new Date(injury.lastAssessedAt).getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <Card key={injury.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{label}</CardTitle>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", colors.badge)}>
                      Stage {stage}
                    </span>
                  </div>
                  <CardDescription>{sideLabel} - {stageNames[stage]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Last pain level</span>
                      <span className={cn(
                        "font-medium",
                        painLevel >= 5
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-gray-900 dark:text-gray-100"
                      )}>
                        {painLevel}/10
                      </span>
                    </div>
                    {daysSinceAssessed !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Days since assessment</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{daysSinceAssessed}</span>
                      </div>
                    )}
                    <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className={cn("h-2 rounded-full", colors.bar, colors.width)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : !isLoading ? (
          <Card className="col-span-2">
            <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
              No active injuries recorded. Add injuries in your profile.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
