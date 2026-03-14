"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { SessionProvider, useSession } from "@/stores/sessionStore";
import { PreSessionCheck, type InjuryPainEntry } from "@/components/workout/PreSessionCheck";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { SetLogger } from "@/components/workout/SetLogger";
import { RestTimer } from "@/components/workout/RestTimer";
import { WorkoutSessionHeader } from "@/components/workout/WorkoutSessionHeader";
import { WorkoutComplete } from "@/components/workout/WorkoutComplete";
import { generateWeeklyPlan } from "@/lib/workoutGenerator";
import { shouldFlagSession } from "@/lib/injuryEngine";
import { useUserProfile, useActiveInjuries, useUpdateInjuryPain } from "@/hooks/useAmplifyData";
import { useSaveSession } from "@/hooks/useSaveSession";
import type {
  PlannedExercise,
  CompletedSet,
  InjuryContext,
  InjuryStage,
  UserProfileData,
  GymLocation,
} from "@/types/index";

// ─── Flow States ─────────────────────────────────────────────
type FlowState = "PRE_CHECK" | "EXERCISING" | "RESTING" | "COMPLETE";

function ActiveWorkoutFlow() {
  const {
    state,
    startSession,
    logSet,
    skipExercise,
    prevExercise,
    nextExercise,
    completeSession,
    flagSession,
  } = useSession();

  const { data: userProfile } = useUserProfile();
  const { data: injuries } = useActiveInjuries();
  const saveSession = useSaveSession();
  const updateInjuryPain = useUpdateInjuryPain();

  // Build profile and injury context from real data
  const profile = useMemo<UserProfileData>(() => {
    if (!userProfile) {
      return { weightLbs: 185, age: 32, gymPreference: "LA_FITNESS" as GymLocation, onWegovy: false };
    }
    return {
      weightLbs: userProfile.weightLbs ?? 185,
      heightIn: userProfile.heightIn ?? undefined,
      age: userProfile.age ?? 30,
      gymPreference: (userProfile.gymPreference ?? "LA_FITNESS") as GymLocation,
      onWegovy: userProfile.onWegovy ?? false,
      wegovyStartDate: userProfile.wegovyStartDate ?? undefined,
    };
  }, [userProfile]);

  const injuryContext = useMemo<InjuryContext>(() => {
    const pf = injuries?.find((i) => i.injuryType === "PLANTAR_FASCIITIS");
    const elbow = injuries?.find((i) => i.injuryType === "SPRAINED_ELBOW");
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
    };
  }, [injuries]);

  // Build injury entries for per-injury pain sliders
  const INJURY_LABELS: Record<string, string> = {
    PLANTAR_FASCIITIS: "Right Foot (Plantar Fasciitis)",
    SPRAINED_ELBOW: "Left Elbow (Ligament/Tendon)",
  };

  const injuryEntries = useMemo<InjuryPainEntry[]>(() => {
    if (!injuries?.length) return [];
    return injuries.map((inj) => ({
      injuryId: inj.id,
      injuryType: inj.injuryType ?? "",
      side: inj.side ?? "",
      label: INJURY_LABELS[inj.injuryType ?? ""] ?? inj.injuryType ?? "Injury",
    }));
  }, [injuries]);

  const [flowState, setFlowState] = useState<FlowState>("PRE_CHECK");
  const [exercises, setExercises] = useState<PlannedExercise[]>([]);
  const [sessionFlagReason, setSessionFlagReason] = useState<string | undefined>();

  // ─── PRE_CHECK: generate exercises and start session ────
  const handlePreSessionStart = useCallback(
    (painByInjury: Record<string, number>, energy: number) => {
      const maxPain = Math.max(0, ...Object.values(painByInjury));

      // Update each injury's currentPainLevel in the DB
      for (const [injuryId, painLevel] of Object.entries(painByInjury)) {
        if (injuryId !== "general") {
          updateInjuryPain.mutate({ injuryId, painLevel });
        }
      }

      // Check if session should be flagged (using max pain across injuries)
      const flagResult = shouldFlagSession(maxPain, energy, []);
      if (flagResult.flag) {
        toast(flagResult.reason, {
          icon: "\u26A0\uFE0F",
          duration: 6000,
          style: {
            background: "#7f1d1d",
            color: "#fecaca",
          },
        });

        if (maxPain >= 7) {
          flagSession(flagResult.reason);
          setSessionFlagReason(flagResult.reason);
        }
      }

      // Build updated injury context with pre-session pain values
      const updatedInjuryContext = { ...injuryContext };
      if (injuries?.length) {
        for (const inj of injuries) {
          const reportedPain = painByInjury[inj.id];
          if (reportedPain !== undefined) {
            if (inj.injuryType === "PLANTAR_FASCIITIS") {
              updatedInjuryContext.plantarFasciitis = {
                ...updatedInjuryContext.plantarFasciitis,
                painLevel: reportedPain,
              };
            } else if (inj.injuryType === "SPRAINED_ELBOW") {
              updatedInjuryContext.sprainedElbow = {
                ...updatedInjuryContext.sprainedElbow,
                painLevel: reportedPain,
              };
            }
          }
        }
      }

      // Generate today's exercises using the workout generator with real data
      const weekPlan = generateWeeklyPlan(profile, updatedInjuryContext, 1);

      // Pick today's day plan (use first non-REST day)
      const todayPlan = weekPlan.find((d) => d.exercises.length > 0);
      const generatedExercises = todayPlan?.exercises ?? [];

      if (generatedExercises.length === 0) {
        toast.error("No exercises available for today. Try again later.");
        return;
      }

      setExercises(generatedExercises);

      // Start the session (use max pain for overall session tracking)
      const gym = profile.gymPreference;
      startSession(generatedExercises, gym, maxPain, energy);
      setFlowState("EXERCISING");
      toast.success("Workout started! Let's go.");
    },
    [startSession, flagSession, profile, injuryContext, injuries, updateInjuryPain]
  );

  // ─── Current exercise tracking ─────────────────────────
  const currentIndex = state.session?.currentExerciseIndex ?? 0;
  const currentExercise = exercises[currentIndex];
  const isFirstExercise = currentIndex === 0;
  const isLastExercise = currentIndex >= exercises.length - 1;

  const completedSetsForCurrent = useMemo(() => {
    if (!state.session || !currentExercise) return [];
    const completed = state.session.completedExercises.find(
      (ex) => ex.exerciseId === currentExercise.id
    );
    return completed?.sets ?? [];
  }, [state.session, currentExercise]);

  // ─── EXERCISING: log a set ──────────────────────────────
  const handleLogSet = useCallback(
    (set: CompletedSet) => {
      if (!currentExercise) return;
      logSet(currentExercise.id, set);

      // Warn on high pain during set
      if (set.pain >= 7) {
        toast(
          `High pain (${set.pain}/10) during ${currentExercise.name}. Consider stopping this exercise.`,
          {
            icon: "\u26A0\uFE0F",
            duration: 5000,
            style: {
              background: "#7f1d1d",
              color: "#fecaca",
            },
          }
        );
      }

      // Check if all planned sets are done
      const targetSets = currentExercise.sets ?? 3;
      const newSetCount = completedSetsForCurrent.length + 1;

      if (newSetCount >= targetSets) {
        // All sets done for this exercise
        if (isLastExercise) {
          setFlowState("COMPLETE");
          completeSession();
        } else {
          // Rest before next exercise
          setFlowState("RESTING");
        }
      }
      // Otherwise, stay in EXERCISING for the next set
    },
    [currentExercise, completedSetsForCurrent, isLastExercise, logSet, completeSession]
  );

  // ─── Skip current exercise ─────────────────────────────
  const handleSkipExercise = useCallback(() => {
    if (!currentExercise) return;
    skipExercise(currentExercise.id, "Skipped by user");

    if (isLastExercise) {
      setFlowState("COMPLETE");
      completeSession();
    } else {
      setFlowState("RESTING");
    }
  }, [currentExercise, isLastExercise, skipExercise, completeSession]);

  // ─── Advance to next exercise (after rest or manual) ───
  const handleNextExercise = useCallback(() => {
    if (isLastExercise) {
      setFlowState("COMPLETE");
      completeSession();
      return;
    }
    nextExercise();
    setFlowState("EXERCISING");
  }, [isLastExercise, nextExercise, completeSession]);

  // ─── Rest complete ─────────────────────────────────────
  const handleRestComplete = useCallback(() => {
    handleNextExercise();
  }, [handleNextExercise]);

  // ─── Save completed session to Amplify ──────────────────
  const handleSaveSession = useCallback(
    (postPain: number, postEnergy: number, notes?: string) => {
      if (!state.session) return;

      const session = state.session;
      const durationMs = Date.now() - session.startedAt.getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      saveSession.mutate(
        {
          sessionType: "UPPER_BODY",
          gym: session.gym,
          startedAt: session.startedAt.toISOString(),
          completedAt: new Date().toISOString(),
          durationMinutes,
          preSessionPainLevel: session.preSessionPain,
          postSessionPainLevel: postPain,
          preSessionEnergy: session.preSessionEnergy,
          postSessionEnergy: postEnergy,
          flaggedForReview: !!sessionFlagReason,
          flagReason: sessionFlagReason,
          notes,
          exercises: session.completedExercises,
        },
        {
          onSuccess: () => {
            toast.success("Session saved! Great workout.");
          },
          onError: (err) => {
            toast.error(`Failed to save session: ${err.message}`);
          },
        }
      );
    },
    [state.session, saveSession, sessionFlagReason]
  );

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header with back button */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {flowState === "COMPLETE" ? "Session Complete" : "Active Session"}
        </h1>
        {flowState === "PRE_CHECK" && (
          <Link href="/workout">
            <Button variant="outline" size="sm">
              Back to Workout
            </Button>
          </Link>
        )}
      </div>

      {/* PRE_CHECK */}
      {flowState === "PRE_CHECK" && (
        <PreSessionCheck injuries={injuryEntries} onStart={handlePreSessionStart} />
      )}

      {/* EXERCISING */}
      {flowState === "EXERCISING" && state.session && currentExercise && (
        <div className="space-y-6">
          <WorkoutSessionHeader
            currentIndex={currentIndex}
            totalExercises={exercises.length}
            sessionType="UPPER_BODY"
            startedAt={state.session.startedAt}
          />

          <ExerciseCard
            exercise={currentExercise}
            isActive
            onSkip={handleSkipExercise}
          />

          <SetLogger
            exercise={currentExercise}
            completedSets={completedSetsForCurrent}
            onLogSet={handleLogSet}
          />

          {/* Navigation buttons for moving between exercises */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              disabled={isFirstExercise}
              onClick={() => {
                prevExercise();
                setFlowState("EXERCISING");
              }}
              className="flex-1 min-h-[48px]"
            >
              Previous Exercise
            </Button>
            {!isLastExercise && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  nextExercise();
                  setFlowState("EXERCISING");
                }}
                className="flex-1 min-h-[48px]"
              >
                Next Exercise
              </Button>
            )}
          </div>

          {/* Finish early */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              completeSession();
              setFlowState("COMPLETE");
            }}
            className="w-full min-h-[48px] text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30"
          >
            End Workout Early
          </Button>
        </div>
      )}

      {/* RESTING */}
      {flowState === "RESTING" && currentExercise && (
        <div className="space-y-6">
          {state.session && (
            <WorkoutSessionHeader
              currentIndex={currentIndex}
              totalExercises={exercises.length}
              sessionType="UPPER_BODY"
              startedAt={state.session.startedAt}
            />
          )}

          <div className="text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              Rest before next exercise
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Next up: {exercises[currentIndex + 1]?.name ?? "Finish"}
            </p>
          </div>

          <RestTimer
            durationSec={currentExercise.restSec}
            onComplete={handleRestComplete}
          />
        </div>
      )}

      {/* COMPLETE */}
      {flowState === "COMPLETE" && state.session && (
        <WorkoutComplete
          session={state.session}
          onSave={handleSaveSession}
        />
      )}
    </div>
  );
}

/**
 * Active Workout Session page.
 * Wrapped with SessionProvider so useSession() is available.
 */
export default function ActiveWorkoutPage() {
  return (
    <SessionProvider>
      <ActiveWorkoutFlow />
    </SessionProvider>
  );
}
