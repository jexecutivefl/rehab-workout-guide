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
  aiConfig: ["aiConfig"] as const,
  chatConversations: ["chatConversations"] as const,
  chatMessages: (conversationId: string) =>
    ["chatMessages", conversationId] as const,
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

export function useUpdateInjuryPain() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      injuryId,
      painLevel,
    }: {
      injuryId: string;
      painLevel: number;
    }) => {
      const { data, errors } = await client.models.ActiveInjury.update({
        id: injuryId,
        currentPainLevel: painLevel,
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

// ─── AI Config ─────────────────────────────────────────────

export function useAIConfig() {
  return useQuery({
    queryKey: keys.aiConfig,
    queryFn: async () => {
      const { data, errors } = await client.models.UserAIConfig.list();
      if (errors?.length) throw new Error(errors[0].message);
      return data[0] ?? null;
    },
  });
}

export function useSaveAIConfig() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id?: string;
      claudeApiKey?: string | null;
      openaiApiKey?: string | null;
      preferredProvider?: "CLAUDE" | "OPENAI" | null;
    }) => {
      if (input.id) {
        // Update existing config
        const { data, errors } = await client.models.UserAIConfig.update({
          id: input.id,
          claudeApiKey: input.claudeApiKey,
          openaiApiKey: input.openaiApiKey,
          preferredProvider: input.preferredProvider,
          updatedAt: new Date().toISOString(),
        });
        if (errors?.length) throw new Error(errors[0].message);
        return data;
      } else {
        // Create new config
        const { data, errors } = await client.models.UserAIConfig.create({
          claudeApiKey: input.claudeApiKey,
          openaiApiKey: input.openaiApiKey,
          preferredProvider: input.preferredProvider,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        if (errors?.length) throw new Error(errors[0].message);
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.aiConfig });
    },
  });
}

// ─── Chat Conversations ────────────────────────────────────

export function useChatConversations() {
  return useQuery({
    queryKey: keys.chatConversations,
    queryFn: async () => {
      const { data, errors } = await client.models.ChatConversation.list();
      if (errors?.length) throw new Error(errors[0].message);
      // Sort by most recent
      return data.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const { data, errors } = await client.models.ChatConversation.create({
        title,
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (errors?.length) throw new Error(errors[0].message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.chatConversations });
    },
  });
}

export function useChatMessages(conversationId: string | null) {
  return useQuery({
    queryKey: keys.chatMessages(conversationId ?? ""),
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, errors } = await client.models.ChatMessage.list({
        filter: { conversationId: { eq: conversationId! } },
      } as any);
      if (errors?.length) throw new Error(errors[0].message);
      // Sort by creation time
      return data.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });
    },
  });
}

export function useSaveChatMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      conversationId: string;
      role: "USER" | "ASSISTANT";
      content: string;
      flaggedExercises?: string;
    }) => {
      const { data, errors } = await client.models.ChatMessage.create({
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        flaggedExercises: input.flaggedExercises,
        createdAt: new Date().toISOString(),
      });
      if (errors?.length) throw new Error(errors[0].message);

      // Update conversation lastMessageAt
      await client.models.ChatConversation.update({
        id: input.conversationId,
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: keys.chatMessages(variables.conversationId),
      });
      qc.invalidateQueries({ queryKey: keys.chatConversations });
    },
  });
}
