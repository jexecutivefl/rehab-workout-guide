"use client";

import { cn } from "@/lib/utils";
import type { ChatMessageData } from "@/types/index";

interface MessageBubbleProps {
  message: ChatMessageData;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "USER";

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
        )}
      >
        <div className="whitespace-pre-wrap">{renderContent(message.content)}</div>

        {message.flaggedExercises && message.flaggedExercises.length > 0 && (
          <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
            <p className="text-xs font-semibold text-red-400">
              Filtered exercises:
            </p>
            <ul className="mt-1 text-xs text-red-300">
              {message.flaggedExercises.map((ex) => (
                <li key={ex}>- {ex} (contraindicated)</li>
              ))}
            </ul>
          </div>
        )}

        <p
          className={cn(
            "mt-1 text-xs",
            isUser
              ? "text-blue-200"
              : "text-gray-400 dark:text-gray-500"
          )}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function renderContent(content: string): string {
  // Safety badges are already inline from filterResponseExercises
  return content;
}

function formatTime(date: Date): string {
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
