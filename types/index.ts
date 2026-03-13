import type { Schema } from "@/amplify/data/resource";

/**
 * Type definitions for the application
 * These types are derived from the Amplify Data schema
 */

// Export the full schema type
export type { Schema };

// Convenience types for models
export type UserProfile = Schema["UserProfile"]["type"];
export type Task = Schema["Task"]["type"];

// Example: Custom types for your application
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
