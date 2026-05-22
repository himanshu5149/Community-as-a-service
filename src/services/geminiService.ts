import { AIPersona } from "../constants/aiPersonas";

let BASE_URL = "/api";
const envUrl = import.meta.env.VITE_API_URL;
if (envUrl && !envUrl.includes("<your-project-id>") && !envUrl.includes("<") && !envUrl.includes(">")) {
  BASE_URL = envUrl;
}

async function callFunction(endpoint: string, body: object): Promise<any> {
  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Function ${endpoint} returned ${res.status}`);
  return res.json();
}

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
  riskLevel?: string;
  flaggedContent?: string;
}

export async function moderateMessage(text: string): Promise<ModerationResult> {
  try {
    return await callFunction("ai/moderate", { text });
  } catch (e) {
    console.error("Moderation error:", e);
    return { isSafe: true };
  }
}

export async function summarizeChat(messages: { user: string; text: string }[]): Promise<string> {
  try {
    const data = await callFunction("ai/summarize", { messages });
    return data.summary;
  } catch (e) {
    console.error("Summarize error:", e);
    return "Failed to generate summary.";
  }
}

export async function askPersona(
  query: string,
  persona: AIPersona,
  context: { groupName: string; recentMessages: { user: string; text: string; isAI?: boolean }[] }
): Promise<string> {
  try {
    const data = await callFunction("ai/persona", { query, persona, context });
    return data.response;
  } catch (e) {
    console.error("Persona error:", e);
    return `${persona.name} is having trouble connecting. Try again in a moment!`;
  }
}

export async function callAiAgent(
  query: string,
  agentId: string,
  agentName: string,
  context: { groupName: string; channelName?: string },
  history?: string,
  persona?: {
    role?: string;
    personality?: string;
    expertise?: string;
    systemInstruction?: string;
    model?: string;
  }
): Promise<string> {
  try {
    const data = await callFunction("ai/agent", { 
      query, 
      agentId, 
      agentName, 
      context, 
      history, 
      persona,
      model: persona?.model 
    });
    return data.response || data.reply;
  } catch (e) {
    console.error("Agent error:", e);
    return `${agentName} is temporarily offline. Please try again shortly.`;
  }
}
