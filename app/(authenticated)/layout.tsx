"use client";

import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "@/components/layout/Providers";
import { FloatingCoachWidget } from "@/components/coach/FloatingCoachWidget";

/**
 * Authenticated Layout
 *
 * All routes inside the (authenticated) route group require auth.
 * Wraps children with AuthGuard (Amplify Authenticator), Providers (Toaster etc.), and AppShell (sidebar + nav).
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Providers>
        <AppShell>{children}</AppShell>
        <FloatingCoachWidget />
      </Providers>
    </AuthGuard>
  );
}
