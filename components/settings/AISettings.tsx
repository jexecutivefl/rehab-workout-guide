"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Radio } from "@/components/ui/radio";
import { useAIConfig, useSaveAIConfig } from "@/hooks/useAmplifyData";
import toast from "react-hot-toast";
import type { AIProvider } from "@/types/index";

export function AISettings() {
  const { data: aiConfig, isLoading } = useAIConfig();
  const saveConfig = useSaveAIConfig();

  const [claudeKey, setClaudeKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [provider, setProvider] = useState<AIProvider>("CLAUDE");
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (aiConfig) {
      setClaudeKey(aiConfig.claudeApiKey || "");
      setOpenaiKey(aiConfig.openaiApiKey || "");
      setProvider((aiConfig.preferredProvider as AIProvider) || "CLAUDE");
    }
  }, [aiConfig]);

  const handleSave = async () => {
    try {
      await saveConfig.mutateAsync({
        id: aiConfig?.id,
        claudeApiKey: claudeKey.trim() || null,
        openaiApiKey: openaiKey.trim() || null,
        preferredProvider: provider,
      });
      toast.success("AI settings saved");
    } catch (err) {
      toast.error("Failed to save settings");
    }
  };

  const handleTest = async () => {
    const key = provider === "CLAUDE" ? claudeKey : openaiKey;
    if (!key) {
      toast.error(`Please enter your ${provider === "CLAUDE" ? "Claude" : "OpenAI"} API key first`);
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Say hello in one sentence.",
          provider,
          apiKey: key,
          injuryContext: {
            plantarFasciitis: { stage: 4, painLevel: 0, side: "RIGHT" },
            sprainedElbow: { stage: 4, painLevel: 0, side: "LEFT" },
            shoulderInstability: { stage: 4, painLevel: 0, side: "LEFT" },
          },
          profile: {
            weightLbs: 150,
            age: 30,
            gymPreference: "HOME",
            onWegovy: false,
          },
        }),
      });

      if (res.ok) {
        toast.success("Connection successful!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Connection failed");
      }
    } catch {
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  function maskKey(key: string): string {
    if (!key || key.length < 8) return key;
    return "****" + key.slice(-4);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-gray-400">Loading AI settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI Coach Settings</CardTitle>
        <CardDescription>
          Configure your AI provider and API keys for the coach feature.
          Keys are stored securely in the database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Preferred Provider
          </label>
          <div className="flex gap-6">
            <Radio
              name="ai-provider"
              label="Claude (Anthropic)"
              checked={provider === "CLAUDE"}
              onChange={() => setProvider("CLAUDE")}
            />
            <Radio
              name="ai-provider"
              label="ChatGPT (OpenAI)"
              checked={provider === "OPENAI"}
              onChange={() => setProvider("OPENAI")}
            />
          </div>
        </div>

        {/* Claude API Key */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Claude API Key
          </label>
          <div className="flex gap-2">
            <Input
              type={showClaudeKey ? "text" : "password"}
              placeholder="sk-ant-..."
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClaudeKey(!showClaudeKey)}
              className="shrink-0"
            >
              {showClaudeKey ? "Hide" : "Show"}
            </Button>
          </div>
          {aiConfig?.claudeApiKey && !claudeKey && (
            <p className="mt-1 text-xs text-gray-400">
              Saved: {maskKey(aiConfig.claudeApiKey)}
            </p>
          )}
        </div>

        {/* OpenAI API Key */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            OpenAI API Key
          </label>
          <div className="flex gap-2">
            <Input
              type={showOpenaiKey ? "text" : "password"}
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOpenaiKey(!showOpenaiKey)}
              className="shrink-0"
            >
              {showOpenaiKey ? "Hide" : "Show"}
            </Button>
          </div>
          {aiConfig?.openaiApiKey && !openaiKey && (
            <p className="mt-1 text-xs text-gray-400">
              Saved: {maskKey(aiConfig.openaiApiKey)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saveConfig.isPending}>
            {saveConfig.isPending ? "Saving..." : "Save Settings"}
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? "Testing..." : "Test Connection"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
