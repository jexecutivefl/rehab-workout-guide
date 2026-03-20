"use client";

import { useRouter } from "next/navigation";
import { DailyCheckIn } from "@/components/checkin/DailyCheckIn";

/**
 * Daily Check-In Page
 *
 * Users complete a readiness assessment before their workout.
 * The readiness score determines workout intensity adjustments.
 * Check-in data is stored as a BodyMetric record (notes field as JSON).
 */
export default function CheckInPage() {
  const router = useRouter();

  const handleCheckInComplete = (checkIn: {
    elbowPain: number;
    shoulderPain: number;
    footPain: number;
    energyLevel: number;
    sleepQuality: number;
    stiffnessLevel: number;
    readinessScore: number;
    notes: string;
  }) => {
    // Store check-in data in sessionStorage so the workout page can read it
    sessionStorage.setItem("dailyCheckIn", JSON.stringify({
      ...checkIn,
      date: new Date().toISOString().split("T")[0],
      overallPain: Math.max(checkIn.elbowPain, checkIn.shoulderPain, checkIn.footPain),
    }));

    // Navigate to workout
    router.push("/workout/active");
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Daily Check-In
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          How are you feeling today? This helps us adjust your workout.
        </p>
      </div>

      <DailyCheckIn onComplete={handleCheckInComplete} />
    </div>
  );
}
