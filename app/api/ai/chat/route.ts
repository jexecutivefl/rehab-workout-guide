import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { InjuryContext, UserProfileData, AIProvider } from "@/types/index";
import { buildSystemPrompt, filterResponseExercises } from "@/lib/aiCoach";
import { exercisePool } from "@/data/exercisePool";

/**
 * POST /api/ai/chat
 *
 * Proxies AI chat requests to Claude or OpenAI.
 * The client passes the API key (fetched from Amplify), injury context, and profile.
 * The response is filtered through the injury engine before returning.
 */

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type RequestBody = {
  message: string;
  provider: AIProvider;
  apiKey: string;
  injuryContext: InjuryContext;
  profile: UserProfileData;
  conversationHistory?: ChatHistoryMessage[];
};

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { message, provider, apiKey, injuryContext, profile, conversationHistory } = body;

    if (!message || !provider || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields: message, provider, apiKey" },
        { status: 400 }
      );
    }

    // Trim whitespace that may be introduced by copy-paste
    const trimmedKey = apiKey.trim();

    const systemPrompt = buildSystemPrompt(injuryContext, profile, exercisePool);

    let aiResponse: string;

    if (provider === "CLAUDE") {
      aiResponse = await callClaude(trimmedKey, systemPrompt, message, conversationHistory);
    } else if (provider === "OPENAI") {
      aiResponse = await callOpenAI(trimmedKey, systemPrompt, message, conversationHistory);
    } else {
      return NextResponse.json(
        { error: "Invalid provider. Use CLAUDE or OPENAI." },
        { status: 400 }
      );
    }

    // Filter all exercise suggestions through the injury engine
    const { safeResponse, flaggedExercises } = filterResponseExercises(
      aiResponse,
      injuryContext,
      exercisePool
    );

    return NextResponse.json({
      content: safeResponse,
      flaggedExercises,
    });
  } catch (error: unknown) {
    const statusCode =
      error != null && typeof error === "object" && "status" in error
        ? (error as { status: number }).status
        : undefined;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error("AI Coach error:", statusCode ?? "no status", errorMessage);

    // Match on HTTP status from the SDK, falling back to message keywords
    if (statusCode === 401 || errorMessage.includes("401") || errorMessage.includes("authentication")) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your key in settings." },
        { status: 401 }
      );
    }

    if (statusCode === 429 || errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get AI response. Please try again." },
      { status: 500 }
    );
  }
}

async function callClaude(
  apiKey: string,
  systemPrompt: string,
  message: string,
  history?: ChatHistoryMessage[]
): Promise<string> {
  const anthropic = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = [];

  // Add conversation history
  if (history?.length) {
    for (const msg of history) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Add current message
  messages.push({ role: "user", content: message });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "I couldn't generate a response. Please try again.";
}

async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  message: string,
  history?: ChatHistoryMessage[]
): Promise<string> {
  const openai = new OpenAI({ apiKey });

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history
  if (history?.length) {
    for (const msg of history) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Add current message
  messages.push({ role: "user", content: message });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2048,
    messages,
  });

  return (
    response.choices[0]?.message?.content ??
    "I couldn't generate a response. Please try again."
  );
}
