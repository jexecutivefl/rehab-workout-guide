"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/amplifyClient";
import type { CompletedExercise, GymLocation, SessionType } from "@/types";

/**
 * Input shape for saving a full workout session.
 */
export interface SaveSessionInput {
  plannedSessionId?: string;
  sessionType: SessionType;
  gym: GymLocation;
  startedAt: string; // ISO datetime
  completedAt: string; // ISO datetime
  durationMinutes: number;
  preSessionPainLevel: number;
  postSessionPainLevel: number;
  preSessionEnergy: number;
  postSessionEnergy: number;
  flaggedForReview?: boolean;
  flagReason?: string;
  notes?: string;
  exercises: CompletedExercise[];
}

/**
 * useSaveSession — persists a full workout to the database.
 *
 * 1. Creates a WorkoutSession record.
 * 2. For each completed exercise, creates a CompletedExerciseRecord.
 * 3. For each set in each exercise, creates a CompletedSetRecord.
 */
export function useSaveSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveSessionInput) => {
      // 1. Create the WorkoutSession
      const { data: session, errors: sessionErrors } =
        await client.models.WorkoutSession.create({
          plannedSessionId: input.plannedSessionId,
          sessionType: input.sessionType,
          gym: input.gym,
          startedAt: input.startedAt,
          completedAt: input.completedAt,
          durationMinutes: input.durationMinutes,
          preSessionPainLevel: input.preSessionPainLevel,
          postSessionPainLevel: input.postSessionPainLevel,
          preSessionEnergy: input.preSessionEnergy,
          postSessionEnergy: input.postSessionEnergy,
          flaggedForReview: input.flaggedForReview ?? false,
          flagReason: input.flagReason,
          notes: input.notes,
        });

      if (sessionErrors?.length) {
        throw new Error(
          `Failed to create session: ${sessionErrors[0].message}`
        );
      }
      if (!session) throw new Error("Failed to create session: no data");

      const sessionId = session.id;

      // 2. Create CompletedExerciseRecords + their sets
      for (let i = 0; i < input.exercises.length; i++) {
        const ex = input.exercises[i];

        const { data: exerciseRecord, errors: exErrors } =
          await client.models.CompletedExerciseRecord.create({
            workoutSessionId: sessionId,
            exerciseId: ex.exerciseId,
            exerciseName: ex.name,
            orderIndex: i,
            painDuring: ex.painDuring,
            wasModified: ex.wasModified,
            modificationNote: ex.modificationNote,
            wasSkipped: ex.wasSkipped,
            skipReason: undefined,
          });

        if (exErrors?.length) {
          throw new Error(
            `Failed to save exercise "${ex.name}": ${exErrors[0].message}`
          );
        }
        if (!exerciseRecord) {
          throw new Error(`Failed to save exercise "${ex.name}": no data`);
        }

        // 3. Create CompletedSetRecords for this exercise
        for (const set of ex.sets) {
          const { errors: setErrors } =
            await client.models.CompletedSetRecord.create({
              completedExerciseRecordId: exerciseRecord.id,
              setNumber: set.setNumber,
              reps: set.reps,
              weightLbs: set.weightLbs,
              durationSec: set.durationSec,
              rpe: set.rpe,
              romPct: set.romPct,
              pain: set.pain,
            });

          if (setErrors?.length) {
            throw new Error(
              `Failed to save set ${set.setNumber} for "${ex.name}": ${setErrors[0].message}`
            );
          }
        }
      }

      return session;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workoutSessions"] });
    },
  });
}
