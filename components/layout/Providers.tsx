"use client";

import { Toaster } from "react-hot-toast";
import { QueryProvider } from "@/hooks/useQueryProvider";
import type { ReactNode } from "react";

/**
 * Global providers wrapper.
 * Includes TanStack React Query provider and react-hot-toast Toaster.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#f9fafb",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#f9fafb",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#f9fafb",
            },
          },
        }}
      />
      {children}
    </QueryProvider>
  );
}
