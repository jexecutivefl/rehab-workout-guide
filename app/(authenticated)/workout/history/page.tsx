"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Workout History
 *
 * Placeholder — will show past workout sessions with filtering and search.
 */
export default function WorkoutHistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Workout History</h1>
        <Link href="/workout">
          <Button variant="outline" size="sm">Back to Workout</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <svg className="mb-4 h-16 w-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Workout history coming soon
          </h2>
          <p className="max-w-md text-gray-600 dark:text-gray-400">
            View and filter past workout sessions, track trends over time,
            and review pain levels across sessions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
