"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

// NOTE: Amplify.configure() is called in AuthGuard.tsx
// This module provides the shared data client
export const client = generateClient<Schema>();
