import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Production-ready starter template
          </div>

          {/* Headline */}
          <h1 className="mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl dark:from-gray-100 dark:via-blue-400 dark:to-purple-400">
            Build faster with AWS Amplify Gen2
          </h1>

          {/* Subheadline */}
          <p className="mb-8 text-lg text-gray-600 sm:text-xl dark:text-gray-300">
            A modern, production-ready starter template with authentication, database, and
            everything you need to ship your next idea.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link href="https://github.com" target="_blank">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View on GitHub
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-24 max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
            Everything you need to build and scale
          </h2>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                AWS Amplify Gen2
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Type-safe backend with authentication, database, and storage out of the box.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Next.js 15 + React 19
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Latest React with Server Components, streaming, and optimized performance.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Tailwind CSS 4
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Modern utility-first CSS with dark mode, responsive design, and custom components.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Authentication Ready
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Secure user authentication with email/password, social login, and MFA support.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Type-Safe Database
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Full TypeScript support with auto-generated types from your data schema.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/50">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                Production Optimized
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                ESLint, Prettier, and best practices baked in. Deploy to AWS Amplify with one click.
              </p>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mx-auto mt-24 max-w-4xl text-center">
          <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Built with modern tools
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-600 dark:text-gray-400">
            <div className="rounded-lg border border-gray-200 bg-white px-6 py-3 font-medium dark:border-gray-800 dark:bg-gray-900/50">
              Next.js 15
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-6 py-3 font-medium dark:border-gray-800 dark:bg-gray-900/50">
              React 19
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-6 py-3 font-medium dark:border-gray-800 dark:bg-gray-900/50">
              TypeScript
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-6 py-3 font-medium dark:border-gray-800 dark:bg-gray-900/50">
              Tailwind 4
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-6 py-3 font-medium dark:border-gray-800 dark:bg-gray-900/50">
              AWS Amplify
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mx-auto mt-24 max-w-2xl rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-lg dark:border-gray-800 dark:bg-gray-900/50">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Ready to build?
          </h2>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Clone this template and start building your next big idea in minutes.
          </p>
          <Link href="/dashboard">
            <Button size="lg">Start Building Now</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
