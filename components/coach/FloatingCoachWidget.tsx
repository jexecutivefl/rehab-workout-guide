"use client";

import { useState, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { ChatInterface } from "@/components/coach/ChatInterface";
import {
  useAIConfig,
  useActiveInjuries,
  useUserProfile,
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
 * Floating AI Coach Widget
 *
 * A collapsible chat bubble that appears on all authenticated pages
 * (except the dedicated /coach page where it would be redundant).
 */
export function FloatingCoachWidget() {
  const pathname = usePathname();
  const { data: aiConfig } = useAIConfig();
  const { data: injuries } = useActiveInjuries();
  const { data: userProfile } = useUserProfile();
  const createConversation = useCreateConversation();
  const saveChatMessage = useSaveChatMessage();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Hide on the dedicated coach page
  if (pathname?.startsWith("/coach")) return null;

  const hasApiKey = (() => {
    if (!aiConfig) return false;
    const provider = (aiConfig.preferredProvider as AIProvider) || "CLAUDE";
    return provider === "CLAUDE"
      ? !!aiConfig.claudeApiKey
      : !!aiConfig.openaiApiKey;
  })();

  const injuryContext: InjuryContext = (() => {
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
  })();

  const profile: UserProfileData = (() => {
    if (!userProfile) {
      return { weightLbs: 150, age: 30, gymPreference: "HOME" as const, onWegovy: false };
    }
    return {
      weightLbs: userProfile.weightLbs ?? 150,
      age: userProfile.age ?? 30,
      gymPreference:
        (userProfile.gymPreference as UserProfileData["gymPreference"]) ?? "HOME",
      onWegovy: userProfile.onWegovy ?? false,
    };
  })();

  const handleSendMessage = async (message: string) => {
    if (!aiConfig) return;

    const provider = (aiConfig.preferredProvider as AIProvider) || "CLAUDE";
    const apiKey =
      provider === "CLAUDE" ? aiConfig.claudeApiKey : aiConfig.openaiApiKey;
    if (!apiKey) return;

    let convId = conversationId;
    if (!convId) {
      const title = "Quick chat: " + message.slice(0, 30);
      const conv = await createConversation.mutateAsync(title);
      convId = conv!.id;
      setConversationId(convId);
    }

    const userMsg: ChatMessageData = {
      role: "USER",
      content: message,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      await saveChatMessage.mutateAsync({
        conversationId: convId,
        role: "USER",
        content: message,
      });

      const history = messages.slice(-6).map((m) => ({
        role: m.role.toLowerCase() as "user" | "assistant",
        content: m.content,
      }));

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

      const assistantMsg: ChatMessageData = {
        role: "ASSISTANT",
        content: data.content,
        flaggedExercises: data.flaggedExercises,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      await saveChatMessage.mutateAsync({
        conversationId: convId,
        role: "ASSISTANT",
        content: data.content,
        flaggedExercises: data.flaggedExercises?.length
          ? JSON.stringify(data.flaggedExercises)
          : undefined,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          role: "ASSISTANT",
          content: `Sorry, I encountered an error: ${errMsg}`,
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[60vh] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 md:bottom-8 md:right-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                AI Coach
              </span>
            </div>
            <div className="flex items-center gap-1">
              <a
                href="/coach"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                title="Open full chat"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            hasApiKey={hasApiKey}
            compact
          />
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-transform hover:scale-105 md:bottom-8 md:right-8"
        title="AI Coach"
      >
        {isOpen ? (
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        )}
      </button>
    </>
  );
}
