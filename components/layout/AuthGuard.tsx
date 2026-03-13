"use client";

import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import outputs from "@/amplify_outputs.json";

Amplify.configure(outputs);

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard
 *
 * Wraps content with Amplify Authenticator to require authentication.
 * Configures Amplify and passes user context to children via render prop internally.
 * Shows loading/auth UI while auth resolves.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <AuthContext.Provider value={{ signOut, user }}>
          {children}
        </AuthContext.Provider>
      )}
    </Authenticator>
  );
}

// Context to pass auth info to children without prop drilling
import { createContext, useContext } from "react";

interface AuthContextType {
  signOut?: () => void;
  user?: any;
}

const AuthContext = createContext<AuthContextType>({});

export function useAuth() {
  return useContext(AuthContext);
}
