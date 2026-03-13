"use client";

import { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import outputs from "@/amplify_outputs.json";
import type { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/button";

Amplify.configure(outputs);
const client = generateClient<Schema>();

/**
 * Dashboard Page
 *
 * Example authenticated page showing:
 * - Amplify authentication with Authenticator
 * - Data querying with generateClient
 * - CRUD operations on tasks
 * - Sign out functionality
 */

export default function Dashboard() {
  return (
    <Authenticator>
      {({ signOut, user }) => <DashboardContent signOut={signOut} user={user} />}
    </Authenticator>
  );
}

function DashboardContent({ signOut, user }: any) {
  const [tasks, setTasks] = useState<Schema["Task"]["type"][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const { data } = await client.models.Task.list();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createSampleTask() {
    try {
      await client.models.Task.create({
        title: "Sample Task",
        description: "This is a sample task created from the dashboard",
        status: "todo",
        priority: "medium",
      });
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  }

  async function deleteTask(id: string) {
    try {
      await client.models.Task.delete({ id });
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Welcome back, {user?.signInDetails?.loginId || "User"}
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>

        {/* Info Card */}
        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/30">
          <h2 className="mb-2 text-xl font-semibold text-blue-900 dark:text-blue-100">
            This is an example authenticated page
          </h2>
          <p className="text-blue-700 dark:text-blue-300">
            You are viewing a protected route that requires authentication. This page demonstrates
            how to use Amplify Auth and Data together.
          </p>
        </div>

        {/* Tasks Section */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Tasks</h2>
            <Button onClick={createSampleTask}>Create Sample Task</Button>
          </div>

          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                No tasks yet. Create your first task to get started!
              </p>
              <Button onClick={createSampleTask}>Create Your First Task</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
                    {task.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        {task.status}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => deleteTask(task.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Code Example */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
            How this works
          </h2>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>This page demonstrates key Amplify Gen2 features:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Authentication:</strong> The Authenticator component handles sign-in/sign-up
              </li>
              <li>
                <strong>Data Access:</strong> generateClient provides type-safe database queries
              </li>
              <li>
                <strong>Authorization:</strong> Tasks are owner-scoped (users can only see their
                own)
              </li>
              <li>
                <strong>Real-time:</strong> Data updates automatically when modified
              </li>
            </ul>
            <p className="pt-4 text-xs">
              Check out{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">
                /app/dashboard/page.tsx
              </code>{" "}
              to see the implementation.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
