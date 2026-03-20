"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { InjuryType, InjuryStage } from "@/types/index";

interface RehabExercise {
  name: string;
  prescription: string;
  frequency: string;
}

const REHAB_PROTOCOLS: Record<InjuryType, Record<InjuryStage, { exercises: RehabExercise[]; note?: string }>> = {
  PLANTAR_FASCIITIS: {
    1: {
      exercises: [
        { name: "Towel Curls", prescription: "3 sets x 15 reps", frequency: "3x daily" },
        { name: "Arch Rolls (tennis ball)", prescription: "2 min per foot", frequency: "3x daily" },
        { name: "Seated Calf Stretch", prescription: "3 sets x 30 sec hold", frequency: "3x daily" },
      ],
    },
    2: {
      exercises: [
        { name: "Towel Curls", prescription: "3 sets x 15 reps", frequency: "3x daily" },
        { name: "Arch Rolls (tennis ball)", prescription: "2 min per foot", frequency: "3x daily" },
        { name: "Seated Calf Stretch", prescription: "3 sets x 30 sec hold", frequency: "3x daily" },
        { name: "Eccentric Heel Drops", prescription: "3 sets x 12 reps", frequency: "2x daily" },
        { name: "Soleus Stretch", prescription: "3 sets x 30 sec hold", frequency: "2x daily" },
      ],
    },
    3: {
      exercises: [
        { name: "Towel Curls", prescription: "3 sets x 15 reps", frequency: "2x daily" },
        { name: "Arch Rolls (tennis ball)", prescription: "2 min per foot", frequency: "2x daily" },
        { name: "Eccentric Heel Drops", prescription: "3 sets x 15 reps", frequency: "2x daily" },
        { name: "Soleus Stretch", prescription: "3 sets x 30 sec hold", frequency: "2x daily" },
        { name: "Marble Pickups", prescription: "3 sets x 20 reps", frequency: "1x daily" },
        { name: "Stationary Bike", prescription: "15-20 min, low resistance", frequency: "3x weekly" },
      ],
    },
    4: {
      exercises: [
        { name: "Walking Program", prescription: "30 min, flat terrain", frequency: "Daily" },
        { name: "Eccentric Heel Drops", prescription: "3 sets x 15 reps", frequency: "1x daily" },
        { name: "Marble Pickups", prescription: "3 sets x 20 reps", frequency: "1x daily" },
      ],
      note: "Use arch support insoles for all standing/walking exercises.",
    },
  },
  SPRAINED_ELBOW: {
    1: {
      exercises: [
        { name: "Isometric Holds", prescription: "5 sets x 10 sec hold at 50% effort", frequency: "3x daily" },
        { name: "Wrist Curls (no weight)", prescription: "3 sets x 15 reps", frequency: "2x daily" },
      ],
    },
    2: {
      exercises: [
        { name: "Isometric Holds", prescription: "5 sets x 10 sec hold at 70% effort", frequency: "2x daily" },
        { name: "Wrist Curls (no weight)", prescription: "3 sets x 15 reps", frequency: "2x daily" },
        { name: "Band Rotations", prescription: "3 sets x 12 reps (light band)", frequency: "2x daily" },
        { name: "Light Wrist Extensions", prescription: "3 sets x 12 reps (1-2 lbs)", frequency: "1x daily" },
      ],
    },
    3: {
      exercises: [
        { name: "Isometric Holds", prescription: "3 sets x 15 sec hold at 80% effort", frequency: "1x daily" },
        { name: "Band Rotations", prescription: "3 sets x 15 reps (medium band)", frequency: "1x daily" },
        { name: "Light Wrist Extensions", prescription: "3 sets x 12 reps (3-5 lbs)", frequency: "1x daily" },
        { name: "Ball Squeeze", prescription: "3 sets x 20 reps", frequency: "2x daily" },
        { name: "Light Bilateral Pressing", prescription: "3 sets x 10 reps at 60% max", frequency: "3x weekly" },
      ],
    },
    4: {
      exercises: [
        { name: "Full Upper Body Program", prescription: "Normal programming", frequency: "Per plan" },
        { name: "Band Rotations (maintenance)", prescription: "2 sets x 15 reps", frequency: "Pre-workout" },
      ],
      note: "Avoid full lockout under heavy load. Continue warm-up band work before pressing sessions.",
    },
  },
  SHOULDER_INSTABILITY: {
    1: {
      exercises: [
        { name: "Isometric External Rotation", prescription: "3 sets x 15 sec hold at 50% effort", frequency: "3x daily" },
        { name: "Isometric Internal Rotation", prescription: "3 sets x 15 sec hold at 50% effort", frequency: "3x daily" },
        { name: "Scapular Retraction Squeeze", prescription: "3 sets x 15 reps, hold 5 sec", frequency: "3x daily" },
      ],
    },
    2: {
      exercises: [
        { name: "Band External Rotation", prescription: "3 sets x 12-15 reps (light band)", frequency: "2x daily" },
        { name: "Band Internal Rotation", prescription: "3 sets x 12-15 reps (light band)", frequency: "2x daily" },
        { name: "Band Pull-Apart", prescription: "3 sets x 15 reps", frequency: "2x daily" },
        { name: "Wall Slides", prescription: "3 sets x 10-12 reps", frequency: "2x daily" },
        { name: "Prone Y-Raise", prescription: "3 sets x 10 reps (no weight)", frequency: "1x daily" },
      ],
    },
    3: {
      exercises: [
        { name: "Band ER/IR (medium band)", prescription: "3 sets x 15 reps", frequency: "Pre-workout + 1x daily" },
        { name: "Band Pull-Apart", prescription: "3 sets x 15 reps", frequency: "Pre-workout" },
        { name: "Prone Y/T-Raise", prescription: "3 sets x 12 reps (1-2 lbs)", frequency: "1x daily" },
        { name: "Light Lateral Raise", prescription: "3 sets x 12-15 reps (2-3 lbs)", frequency: "3x weekly" },
        { name: "Light Shoulder Press (machine)", prescription: "3 sets x 10 reps at 50% max", frequency: "2x weekly" },
      ],
      note: "Always perform scapular warmup before any pressing. No behind-neck movements.",
    },
    4: {
      exercises: [
        { name: "Full Shoulder Program", prescription: "Normal programming", frequency: "Per plan" },
        { name: "Band ER/IR (maintenance)", prescription: "2 sets x 15 reps", frequency: "Pre-workout" },
        { name: "Band Pull-Apart (warmup)", prescription: "2 sets x 15 reps", frequency: "Pre-workout" },
      ],
      note: "Perform scapular warmup before all pressing sessions. Monitor shoulder fatigue during heavy overhead work.",
    },
  },
};

interface RehabProtocolCardProps {
  injuryType: InjuryType;
  stage: InjuryStage;
}

export function RehabProtocolCard({ injuryType, stage }: RehabProtocolCardProps) {
  const protocol = REHAB_PROTOCOLS[injuryType][stage];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Today&apos;s Rehab Protocol</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {protocol.exercises.map((exercise, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-1 rounded-lg border border-gray-100 p-3 dark:border-gray-800"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {exercise.name}
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{exercise.prescription}</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {exercise.frequency}
                </span>
              </div>
            </div>
          ))}
          {protocol.note && (
            <div className="mt-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {protocol.note}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
