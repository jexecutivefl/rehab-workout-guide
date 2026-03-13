"use client";

import { Amplify } from "aws-amplify";
import { LoginForm } from "@/components/auth/login-form";
import outputs from "@/amplify_outputs.json";

Amplify.configure(outputs);

/**
 * Login Page
 *
 * Standalone login page using the Amplify Authenticator.
 * Users can sign in, sign up, or reset their password.
 */

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-100">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to your account to continue</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900/50">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
