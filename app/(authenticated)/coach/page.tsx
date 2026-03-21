"use client";

import { useState, useCallback, useMemo } from "react";
import { ChatInterface } from "@/components/coach/ChatInterface";
import { ConversationList } from "@/components/coach/ConversationList";
import {
  useAIConfig,
  useActiveInjuries,
  useUserProfile,
  useChatConversations,
  useChatMessages,
  useCreateConversation,
  useSaveChatMessage,
} from "@/hooks/useAmplifyData";
import type {
  ChatMessageData,
  InjuryContext,
  InjuryStage,
  UserProfileData,
  AIProvider,
} from "@/types/index";

/**
 * AI Coach Page
 *
 * Full-page chat interface with conversation history sidebar.
 * All exercise suggestions are filtered through the injury engine server-side.
 */
export default function CoachPage() {
  const { data: aiConfig } = useAIConfig();
  const { data: injuries } = useActiveInjuries();
  const { data: userProfile } = useUserProfile();
  const { data: conversations } = useChatConversations();
  const createConversation = useCreateConversation();
  const saveChatMessage = useSaveChatMessage();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const { data: dbMessages } = useChatMessages(activeConversationId);

  // Combine DB messages with any optimistic local messages
  const messages: ChatMessageData[] = useMemo(() => {
    if (!activeConversationId) return localMessages;
    const fromDb: ChatMessageData[] = (dbMessages ?? []).map((m) => ({
      id: m.id,
      role: m.role as "USER" | "ASSISTANT",
      content: m.content,
      flaggedExercises: m.flaggedExercises
        ? JSON.parse(m.flaggedExercises)
        : undefined,
      createdAt: new Date(m.createdAt ?? Date.now()),
    }));
    // Merge local messages that aren't in DB yet
    const dbIds = new Set(fromDb.map((m) => m.id));
    const newLocal = localMessages.filter((m) => !m.id || !dbIds.has(m.id));
    return [...fromDb, ...newLocal];
  }, [dbMessages, localMessages, activeConversationId]);

  const hasApiKey = useMemo(() => {
    if (!aiConfig) return false;
    const provider = (aiConfig.preferredProvider as AIProvider) || "CLAUDE";
    return provider === "CLAUDE"
      ? !!aiConfig.claudeApiKey
      : !!aiConfig.openaiApiKey;
  }, [aiConfig]);

  const injuryContext = useMemo((): InjuryContext => {
    const defaultInjury = { stage: 4 as InjuryStage, painLevel: 0 };

    if (!injuries?.length) {
      return {
        plantarFasciitis: { ...defaultInjury, side: "RIGHT" as const },
        sprainedElbow: { ...defaultInjury, side: "LEFT" as const },
        shoulderInstability: { ...defaultInjury, side: "LEFT" as const },
      };
    }

    const pf = injuries.find((i) => i.injuryType === "PLANTAR_FASCIITIS");
    const elbow = injuries.find((i) => i.injuryType === "SPRAINED_ELBOW");
    const shoulder = injuries.find((i) => i.injuryType === "SHOULDER_INSTABILITY");

    return {
      plantarFasciitis: {
        stage: (pf?.stage ?? 4) as InjuryStage,
        painLevel: pf?.currentPainLevel ?? 0,
        side: "RIGHT" as const,
      },
      sprainedElbow: {
        stage: (elbow?.stage ?? 4) as InjuryStage,
        painLevel: elbow?.currentPainLevel ?? 0,
        side: "LEFT" as const,
      },
      shoulderInstability: {
        stage: (shoulder?.stage ?? 4) as InjuryStage,
        painLevel: shoulder?.currentPainLevel ?? 0,
        side: "LEFT" as const,
      },
    };
  }, [injuries]);

  const profile = useMemo((): UserProfileData => {
    if (!userProfile) {
      return {
        weightLbs: 150,
        age: 30,
        gymPreference: "HOME",
        onWegovy: false,
      };
    }
    return {
      weightLbs: userProfile.weightLbs ?? 150,
      age: userProfile.age ?? 30,
      gymPreference: (userProfile.gymPreference as UserProfileData["gymPreference"]) ?? "HOME",
      onWegovy: userProfile.onWegovy ?? false,
      heightIn: userProfile.heightIn ?? undefined,
      wegovyStartDate: userProfile.wegovyStartDate ?? undefined,
    };
  }, [userProfile]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!aiConfig) return;

      const provider = (aiConfig.preferredProvider as AIProvider) || "CLAUDE";
      const apiKey =
        provider === "CLAUDE" ? aiConfig.claudeApiKey : aiConfig.openaiApiKey;
      if (!apiKey) return;

      // Ensure we have a conversation
      let convId = activeConversationId;
      if (!convId) {
        const title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
        const conv = await createConversation.mutateAsync(title);
        convId = conv!.id;
        setActiveConversationId(convId);
      }

      // Add user message optimistically
      const userMsg: ChatMessageData = {
        role: "USER",
        content: message,
        createdAt: new Date(),
      };
      setLocalMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Save user message to DB
        await saveChatMessage.mutateAsync({
          conversationId: convId,
          role: "USER",
          content: message,
        });

        // Build conversation history for context
        const history = messages
          .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
          .slice(-10)
          .map((m) => ({
            role: m.role.toLowerCase() as "user" | "assistant",
            content: m.content,
          }));

        // Call AI API
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            provider,
            apiKey,
            injuryContext,
            profile,
            conversationHistory: history,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to get response");
        }

        const data = await res.json();

        // Add assistant message
        const assistantMsg: ChatMessageData = {
          role: "ASSISTANT",
          content: data.content,
          flaggedExercises: data.flaggedExercises,
          createdAt: new Date(),
        };
        setLocalMessages((prev) => [...prev, assistantMsg]);

        // Save assistant message to DB
        await saveChatMessage.mutateAsync({
          conversationId: convId,
          role: "ASSISTANT",
          content: data.content,
          flaggedExercises: data.flaggedExercises?.length
            ? JSON.stringify(data.flaggedExercises)
            : undefined,
        });
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "Something went wrong";
        const errorResponse: ChatMessageData = {
          role: "ASSISTANT",
          content: `Sorry, I encountered an error: ${errMsg}`,
          createdAt: new Date(),
        };
        setLocalMessages((prev) => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      aiConfig,
      activeConversationId,
      injuryContext,
      profile,
      messages,
      createConversation,
      saveChatMessage,
    ]
  );

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setLocalMessages([]);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setLocalMessages([]);
  }, []);

  return (
    <div className="flex h-full">
      {/* Sidebar - Conversation List */}
      <div
        className={`${
          showSidebar ? "block" : "hidden"
        } absolute inset-0 z-40 w-72 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:relative md:block`}
      >
        <ConversationList
          conversations={conversations ?? []}
          activeId={activeConversationId}
          onSelect={(id) => {
            handleSelectConversation(id);
            setShowSidebar(false);
          }}
          onNew={() => {
            handleNewConversation();
            setShowSidebar(false);
          }}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile sidebar toggle */}
        <div className="flex items-center border-b border-gray-200 px-4 py-2 dark:border-gray-800 md:hidden">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Coach
          </span>
        </div>

        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          hasApiKey={hasApiKey}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}
