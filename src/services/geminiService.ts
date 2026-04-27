import { AIPersona } from "../constants/aiPersonas";

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
  flaggedContent?: string;
}

export async function moderateMessage(text: string): Promise<ModerationResult> {
  try {
    const response = await fetch("/api/ai/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    return await response.json();
  } catch (error) {
    console.error("Moderation error:", error);
    return { isSafe: true };
  }
}

export async function summarizeChat(messages: { user: string, text: string }[]): Promise<string> {
  try {
    const response = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });
    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error("Summarization error:", error);
    return "Failed to generate summary.";
  }
}

export async function askPersona(
  query: string, 
  persona: AIPersona, 
  context: { groupName: string, recentMessages: { user: string, text: string, isAI?: boolean }[] }
): Promise<string> {
  try {
    const response = await fetch("/api/ai/persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, persona, context })
    });
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Persona response error:", error);
    return `I'm having a bit of trouble synchronizing my systems. Contact me again in a moment!`;
  }
}
