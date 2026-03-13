"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/amplifyClient";

// ─── Query Keys ─────────────────────────────────────────────
const keys = {
  userProfile: ["userProfile"] as const,
  activeInjuries: ["activeInjuries"] as const,
  workoutSessions: (limit?: number) => ["workoutSessions", limit] as const,
  bodyMetrics: (limit?: number) => ["bodyMetrics", limit] as const,
  rehabMilestones: ["rehabMilestones"] as const,
};

// ─── User Profile ───────────────────────────────────────────

export function useUserProfile() {
  return useQuery({
    queryKey: keys.userProfile,
    queryFn: async () => {
      const { data, errors } = await client.models.UserProfile.list();
      if (errors?.length) throw new Error(errors[0].message);
      // Owner-scoped — returns at most one record for current user
      return data[0] ?? null;
    },
  });
}

export function useUpdateUserProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Parameters<typeof client.models.UserProfile.update>[0]
    ) => {
      const { data, errors } = await client.models.UserProfile.update(input);
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.userProfile });
    },
  });
}

export function useCreateUserProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Parameters<typeof client.models.UserProfile.create>[0]
    ) => {
      const { data, errors } = await client.models.UserProfile.create(input);
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.userProfile });
    },
  });
}

// ─── Active Injuries ────────────────────────────────────────

export function useActiveInjuries() {
  return useQuery({
    queryKey: keys.activeInjuries,
    queryFn: async () => {
      const { data, errors } = await client.models.ActiveInjury.list();
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
  });
}

export function useCreateActiveInjury() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Parameters<typeof client.models.ActiveInjury.create>[0]
    ) => {
      const { data, errors } = await client.models.ActiveInjury.create(input);
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.activeInjuries });
    },
  });
}

export function useUpdateInjuryStage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      injuryId,
      stage,
    }: {
      injuryId: string;
      stage: number;
    }) => {
      const { data, errors } = await client.models.ActiveInjury.update({
        id: injuryId,
        stage,
        lastAssessedAt: new Date().toISOString(),
      });
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.activeInjuries });
    },
  });
}

// ─── Workout Sessions ───────────────────────────────────────

export function useWorkoutSessions(limit?: number) {
  return useQuery({
    queryKey: keys.workoutSessions(limit),
    queryFn: async () => {
      const { data, errors } = await client.models.WorkoutSession.list({
        limit: limit ?? 50,
      });
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
  });
}

export function useSaveWorkoutSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Parameters<typeof client.models.WorkoutSession.create>[0]
    ) => {
      const { data, errors } =
        await client.models.WorkoutSession.create(input);
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workoutSessions"] });
    },
  });
}

// ─── Body Metrics ───────────────────────────────────────────

export function useBodyMetrics(limit?: number) {
  return useQuery({
    queryKey: keys.bodyMetrics(limit),
    queryFn: async () => {
      const { data, errors } = await client.models.BodyMetric.list({
        limit: limit ?? 50,
      });
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
  });
}

export function useSaveBodyMetric() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Parameters<typeof client.models.BodyMetric.create>[0]
    ) => {
      const { data, errors } = await client.models.BodyMetric.create(input);
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bodyMetrics"] });
    },
  });
}

// ─── Rehab Milestones ───────────────────────────────────────

export function useRehabMilestones() {
  return useQuery({
    queryKey: keys.rehabMilestones,
    queryFn: async () => {
      const { data, errors } = await client.models.RehabMilestone.list();
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
  });
}

export function useToggleMilestone() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      milestoneId,
      achieved,
    }: {
      milestoneId: string;
      achieved: boolean;
    }) => {
      const { data, errors } = await client.models.RehabMilestone.update({
        id: milestoneId,
        achieved,
        achievedAt: achieved ? new Date().toISOString() : null,
      });
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.rehabMilestones });
    },
  });
}
