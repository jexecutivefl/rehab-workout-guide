"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { SessionProvider, useSession } from "@/stores/sessionStore";
import { PreSessionCheck } from "@/components/workout/PreSessionCheck";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { SetLogger } from "@/components/workout/SetLogger";
import { RestTimer } from "@/components/workout/RestTimer";
import { WorkoutSessionHeader } from "@/components/workout/WorkoutSessionHeader";
import { WorkoutComplete } from "@/components/workout/WorkoutComplete";
import { generateWeeklyPlan } from "@/lib/workoutGenerator";
import { shouldFlagSession } from "@/lib/injuryEngine";
import type {
  PlannedExercise,
  CompletedSet,
  InjuryContext,
  UserProfileData,
} from "@/types/index";

// ─── Hardcoded context (replaced by real data in Phase 3) ────
const HARDCODED_PROFILE: UserProfileData = {
  weightLbs: 185,
  heightIn: 70,
  age: 32,
  gymPreference: "LA_FITNESS",
  onWegovy: true,
  wegovyStartDate: "2025-12-01",
};

const HARDCODED_INJURY_CONTEXT: InjuryContext = {
  plantarFasciitis: { stage: 2, painLevel: 3, side: "RIGHT" },
  sprainedElbow: { stage: 1, painLevel: 5, side: "LEFT" },
};

// ─── Flow States ─────────────────────────────────────────────
type FlowState = "PRE_CHECK" | "EXERCISING" | "RESTING" | "COMPLETE";

function ActiveWorkoutFlow() {
  const {
    state,
    startSession,
    logSet,
    skipExercise,
    nextExercise,
    completeSession,
    flagSession,
  } = useSession();

  const [flowState, setFlowState] = useState<FlowState>("PRE_CHECK");
  const [exercises, setExercises] = useState<PlannedExercise[]>([]);

  // ─── PRE_CHECK: generate exercises and start session ────
  const handlePreSessionStart = useCallback(
    (pain: number, energy: number) => {
      // Check if session should be flagged
      const flagResult = shouldFlagSession(pain, energy, []);
      if (flagResult.flag) {
        toast(flagResult.reason, {
          icon: "\u26A0\uFE0F",
          duration: 6000,
          style: {
            background: "#7f1d1d",
            color: "#fecaca",
          },
        });

        // If pain >= 7, flag and allow user to still proceed (PreSessionCheck handles the acknowledgment)
        if (pain >= 7) {
          flagSession(flagResult.reason);
        }
      }

      // Generate today's exercises using the workout generator
      const weekPlan = generateWeeklyPlan(
        HARDCODED_PROFILE,
        HARDCODED_INJURY_CONTEXT,
        1
      );

      // Pick today's day plan (use first non-REST day for demo)
      const todayPlan = weekPlan.find((d) => d.exercises.length > 0);
      const generatedExercises = todayPlan?.exercises ?? [];

      if (generatedExercises.length === 0) {
        toast.error("No exercises available for today. Try again later.");
        return;
      }

      setExercises(generatedExercises);

      // Start the session
      startSession(generatedExercises, "LA_FITNESS", pain, energy);
      setFlowState("EXERCISING");
      toast.success("Workout started! Let's go.");
    },
    [startSession, flagSession]
  );

  // ─── Current exercise tracking ─────────────────────────
  const currentIndex = state.session?.currentExerciseIndex ?? 0;
  const currentExercise = exercises[currentIndex];
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

  // ─── Save completed session ────────────────────────────
  const handleSaveSession = useCallback(
    (_postPain: number, _postEnergy: number, _notes?: string) => {
      // Placeholder save — will integrate with Amplify Data in Phase 3
      toast.success("Session saved! Great workout.");
    },
    []
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
        <PreSessionCheck onStart={handlePreSessionStart} />
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

          {/* Manual next exercise button (for when user wants to move on before finishing all sets) */}
          {!isLastExercise && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                nextExercise();
                setFlowState("EXERCISING");
              }}
              className="w-full min-h-[48px]"
            >
              Next Exercise
            </Button>
          )}

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
