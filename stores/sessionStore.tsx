"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type {
  ActiveSession,
  CompletedExercise,
  CompletedSet,
  PlannedExercise,
  GymLocation,
} from "@/types/index";

// STUB: replace with Agent C output when ready
// import { shouldFlagSession } from '@/lib/injuryEngine';

// ─── State ──────────────────────────────────────────────────
type SessionState = {
  session: ActiveSession | null;
  isActive: boolean;
};

const initialState: SessionState = {
  session: null,
  isActive: false,
};

// ─── Actions ────────────────────────────────────────────────
type SessionAction =
  | {
      type: "START_SESSION";
      payload: {
        exercises: PlannedExercise[];
        gym: GymLocation;
        preSessionPain: number;
        preSessionEnergy: number;
      };
    }
  | { type: "LOG_SET"; payload: { exerciseId: string; set: CompletedSet } }
  | { type: "SKIP_EXERCISE"; payload: { exerciseId: string; reason: string } }
  | { type: "PREV_EXERCISE" }
  | { type: "NEXT_EXERCISE" }
  | { type: "COMPLETE_SESSION" }
  | { type: "FLAG_SESSION"; payload: { reason: string } };

// ─── Reducer ────────────────────────────────────────────────
function sessionReducer(
  state: SessionState,
  action: SessionAction
): SessionState {
  switch (action.type) {
    case "START_SESSION": {
      const { exercises, gym, preSessionPain, preSessionEnergy } =
        action.payload;
      const session: ActiveSession = {
        sessionId: crypto.randomUUID(),
        startedAt: new Date(),
        gym,
        exercises,
        currentExerciseIndex: 0,
        completedExercises: exercises.map((ex) => ({
          exerciseId: ex.id,
          name: ex.name,
          sets: [],
          painDuring: 0,
          wasModified: ex.safetyResult.safety === "MODIFIED",
          modificationNote: ex.safetyResult.modification,
          wasSkipped: false,
        })),
        preSessionPain,
        preSessionEnergy,
      };
      return { session, isActive: true };
    }

    case "LOG_SET": {
      if (!state.session) return state;
      const { exerciseId, set } = action.payload;
      const completedExercises = state.session.completedExercises.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        const sets = [...ex.sets, set];
        // Track max pain during exercise
        const painDuring = Math.max(ex.painDuring, set.pain);
        return { ...ex, sets, painDuring };
      });
      return {
        ...state,
        session: { ...state.session, completedExercises },
      };
    }

    case "SKIP_EXERCISE": {
      if (!state.session) return state;
      const { exerciseId, reason } = action.payload;
      const completedExercises = state.session.completedExercises.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        return { ...ex, wasSkipped: true, modificationNote: reason };
      });
      // Also advance to next exercise
      const nextIndex = Math.min(
        state.session.currentExerciseIndex + 1,
        state.session.exercises.length - 1
      );
      return {
        ...state,
        session: {
          ...state.session,
          completedExercises,
          currentExerciseIndex: nextIndex,
        },
      };
    }

    case "PREV_EXERCISE": {
      if (!state.session) return state;
      const prevIdx = Math.max(state.session.currentExerciseIndex - 1, 0);
      return {
        ...state,
        session: { ...state.session, currentExerciseIndex: prevIdx },
      };
    }

    case "NEXT_EXERCISE": {
      if (!state.session) return state;
      const nextIdx = Math.min(
        state.session.currentExerciseIndex + 1,
        state.session.exercises.length - 1
      );
      return {
        ...state,
        session: { ...state.session, currentExerciseIndex: nextIdx },
      };
    }

    case "COMPLETE_SESSION": {
      if (!state.session) return state;
      return { ...state, isActive: false };
    }

    case "FLAG_SESSION": {
      // In a real implementation, this would persist the flag to the backend.
      // For now we mark session as inactive with the reason logged.
      if (!state.session) return state;
      return { ...state, isActive: false };
    }

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────
type SessionContextValue = {
  state: SessionState;
  startSession: (
    exercises: PlannedExercise[],
    gym: GymLocation,
    preSessionPain: number,
    preSessionEnergy: number
  ) => void;
  logSet: (exerciseId: string, set: CompletedSet) => void;
  skipExercise: (exerciseId: string, reason: string) => void;
  prevExercise: () => void;
  nextExercise: () => void;
  completeSession: () => ActiveSession | null;
  flagSession: (reason: string) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const startSession = useCallback(
    (
      exercises: PlannedExercise[],
      gym: GymLocation,
      preSessionPain: number,
      preSessionEnergy: number
    ) => {
      dispatch({
        type: "START_SESSION",
        payload: { exercises, gym, preSessionPain, preSessionEnergy },
      });
    },
    []
  );

  const logSet = useCallback((exerciseId: string, set: CompletedSet) => {
    dispatch({ type: "LOG_SET", payload: { exerciseId, set } });
  }, []);

  const skipExercise = useCallback((exerciseId: string, reason: string) => {
    dispatch({ type: "SKIP_EXERCISE", payload: { exerciseId, reason } });
  }, []);

  const prevExercise = useCallback(() => {
    dispatch({ type: "PREV_EXERCISE" });
  }, []);

  const nextExercise = useCallback(() => {
    dispatch({ type: "NEXT_EXERCISE" });
  }, []);

  const completeSession = useCallback((): ActiveSession | null => {
    dispatch({ type: "COMPLETE_SESSION" });
    return state.session;
  }, [state.session]);

  const flagSession = useCallback((reason: string) => {
    dispatch({ type: "FLAG_SESSION", payload: { reason } });
  }, []);

  return (
    <SessionContext.Provider
      value={{
        state,
        startSession,
        logSet,
        skipExercise,
        prevExercise,
        nextExercise,
        completeSession,
        flagSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
