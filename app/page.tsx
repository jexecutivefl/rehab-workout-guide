import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * RehabTrack Landing Page
 *
 * Public landing page with hero, feature highlights, and CTA to get started.
 * "Get Started" links to /dashboard which triggers auth via the (authenticated) route group.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Injury-aware workout tracking
          </div>

          {/* Hero */}
          <h1 className="mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl dark:from-gray-100 dark:via-blue-400 dark:to-purple-400">
            Track Your Recovery, Build Your Strength
          </h1>

          <p className="mb-8 text-lg text-gray-600 sm:text-xl dark:text-gray-300">
            Smart workout planning that adapts to your injuries. Follow stage-based rehab protocols,
            log pain levels, and progress safely back to full strength.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mx-auto mt-24 max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
            Built for recovery
          </h2>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Injury-Aware Workouts */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Injury-Aware Workouts
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Every exercise is evaluated against your active injuries. Unsafe movements are flagged
                or substituted automatically.
              </p>
            </div>

            {/* Rehab Protocols */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Rehab Protocol Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Follow stage-based rehab protocols for each injury. Track milestones and
                progress through recovery phases.
              </p>
            </div>

            {/* Progress Analytics */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Progress Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Visualize pain trends, strength gains, and recovery milestones.
                Get weekly reports on your progress.
              </p>
            </div>

            {/* Pain Tracking */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Pain Monitoring
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Log pain levels before, during, and after workouts. Pain spikes
                trigger automatic alerts and workout modifications.
              </p>
            </div>

            {/* Smart Adaptation */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                AI-Powered Adaptation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Workout plans adapt automatically based on your recovery progress,
                pain levels, and injury stage transitions.
              </p>
            </div>

            {/* Exercise Library */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Exercise Library
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive exercise database with contraindication tagging.
                Each exercise is mapped to injury safety rules.
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mx-auto mt-24 max-w-2xl rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-lg dark:border-gray-800 dark:bg-gray-900/50">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Start your recovery journey
          </h2>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Set up your injury profile and get your first adapted workout plan in minutes.
          </p>
          <Link href="/dashboard">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
