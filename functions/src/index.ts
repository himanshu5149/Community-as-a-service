import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import * as crypto from "crypto";

// ─── Initialize Admin SDK Safely ──────────────────────────────────────────
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// ─── Gemini Core Helper (Modern @google/genai Standards) ─────────────────────
let verifiedModel: string | null = null;

function getGemini(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;
  if (!key) {
    console.error("CRITICAL RUNTIME ERROR: GEMINI_API_KEY is not configured.");
    throw new Error("GEMINI_API_KEY_MISSING");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

async function callGemini(prompt: string, jsonMode = false, modelOption = "gemini-flash-latest"): Promise<string> {
  const ai = getGemini();
  const modelsToTry: string[] = [];

  if (verifiedModel) {
    modelsToTry.push(verifiedModel);
  }

  modelsToTry.push(modelOption);
  modelsToTry.push("gemini-flash-latest");
  modelsToTry.push("gemini-2.5-flash");
  modelsToTry.push("gemini-3.5-flash");

  const uniqueModels = Array.from(new Set(modelsToTry)).filter(Boolean) as string[];
  let lastError = null;

  for (const modelToTry of uniqueModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelToTry,
        contents: prompt,
        ...(jsonMode ? {
          config: {
            responseMimeType: "application/json"
          }
        } : {})
      });
      
      const textOutput = response.text;
      if (textOutput === undefined) {
        throw new Error("Model returned an empty response.");
      }
      if (!verifiedModel) {
        verifiedModel = modelToTry;
      }
      return textOutput;
    } catch (err: any) {
      lastError = err;
      if (err?.message?.includes("API_KEY_INVALID") || err?.status === 403) {
        throw new Error("INVALID_GEMINI_API_KEY");
      }
      if (modelToTry === uniqueModels[uniqueModels.length - 1]) {
        console.error("Gemini fallback chain failed to resolve:", err);
      }
    }
  }
  throw lastError || new Error("All fallback models failed.");
}

// ─── In-memory Cache Engine (Mitigate Cold Starts & Speed Up Responses) ───
const memCache = new Map<string, { v: string; t: number }>();
function cacheKey(text: string): string {
  return crypto.createHash("sha256").update(text.trim().toLowerCase()).digest("hex").slice(0, 40);
}
function fromCache(key: string, ttlHours: number): string | null {
  const hit = memCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.t > ttlHours * 3_600_000) {
    memCache.delete(key);
    return null;
  }
  return hit.v;
}
function toCache(key: string, v: string) {
  memCache.set(key, { v, t: Date.now() });
}

// ─── CORS Control Helper ──────────────────────────────────────────────────
function corsHeaders(res: functions.Response) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Max-Age", "3600");
}

// ─── 1. HEALTH CHECK ENDPOINT ─────────────────────────────────────────────
export const health = functions.https.onRequest((req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  res.json({
    status: "healthy",
    service: "CaaS Firebase Functions Node.js Backend",
    timestamp: new Date().toISOString(),
    apiStandard: "@google/genai@1.50.1",
    engine: `Node ${process.version}`
  });
});

// ─── 2. AI MODERATION ENDPOINT ────────────────────────────────────────────
export const aiModerate = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST method required" });
    return;
  }

  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: "text parameter is required" });
    return;
  }

  // Optimize throughput: Skip short messages which pose zero safety risk
  if (text.trim().length < 15) {
    res.json({ isSafe: true, riskLevel: "none" });
    return;
  }

  const key = cacheKey(text);
  const cached = fromCache(key, 168); // Cached for 7 days
  if (cached) {
    res.json(JSON.parse(cached));
    return;
  }

  try {
    const result = await callGemini(
      `Analyze this community message for spam, harassment, hate speech, or harmful content.
Message: "${text}"
Return ONLY JSON: { "isSafe": boolean, "reason": "string", "riskLevel": "none"|"low"|"medium"|"high" }`,
      true
    );
    const parsed = JSON.parse(result);
    toCache(key, JSON.stringify(parsed));
    res.json(parsed);
  } catch (e: any) {
    console.error("AI Moderation processing error:", e.message);
    res.json({ isSafe: true, riskLevel: "none" }); // Fail open for seamless UX
  }
});

// ─── 3. AI AGENT ENDPOINT ──────────────────────────────────────────────────
export const aiAgent = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST method required" });
    return;
  }

  const { query, message, agentId, agentName: providedName, context, persona, history, systemContext, model } = req.body;
  const userInput = query || message;
  const agentName = providedName || "Assistant";

  if (!userInput) {
    res.status(400).json({ error: "query or message and agentName are required" });
    return;
  }

  let expertise = "general community assistance";
  let personality = "be helpful, on-topic, and concise";
  let role = "Assistant";
  let systemInstruction = systemContext || "";

  if (persona) {
    expertise = persona.expertise || expertise;
    personality = persona.personality || personality;
    role = persona.role || role;
    if (persona.systemInstruction) systemInstruction = persona.systemInstruction;
  } else {
    const expertiseMap: Record<string, string> = {
      aria_fitness: "fitness, nutrition, health, and metabolic optimization",
      nexus_tech:   "software engineering, code reviews, cloud architecture, and technology",
      lumina_art:   "creative arts, design, visual aesthetics, and artistic philosophy",
      sage_study:   "education, history, academic research, and knowledge synthesis",
      orbit_social: "community management, introductions, social dynamics, and group cohesion",
      aria:         "fitness, nutrition, health, and metabolic optimization",
      nexus:        "software engineering, code, cloud architecture, and technology",
      lumina:       "creative arts, design, visual aesthetics, and artistic philosophy",
      sage:         "education, history, academic research, and knowledge synthesis",
      orbit:        "community management, social dynamics, introductions, and group cohesion",
    };
    expertise = expertiseMap[agentId || ""] || expertise;
  }

  const prompt = `You are ${agentName}, an AI member of the CaaS community platform.
Your Role: ${role}
Your Expertise: ${expertise}
Your Personality: ${personality}
${systemInstruction ? `\nSystem Instruction: ${systemInstruction}\n` : ""}
Context:
Community: "${context?.groupName || "Unknown"}" | Channel: "${context?.channelName || "general"}"

${history ? `Recent Conversation:\n${history}\n` : ""}
User message: ${userInput}

OUTPUT GUIDELINES (COMPLIANCE IS ABSOLUTELY MANDATORY):
- Always respond in character as ${agentName}.
- Provide your response in SHORT bullet points ONLY.
- Do NOT write long paragraphs under any circumstances.
- Start every single point with a standard asterisk bullet ("* ") followed naturally by an emoji and clear action-oriented description.
- Keep each point short, conversational, exciting, friendly, and highly readable.
- Highlight key terms or ideas with **bold text**.
- Do NOT write any introduction or conclusion paragraphs of prose. Just output the list of bullet points directly.

Required Format Example:
* 👋 **Welcome onboard!** Glad to have you here in our secure frequency.
* 🚀 **Explore channels** to connect with community members instantly.
* 💡 **Share innovative ideas** to collaborate and build together.
* 😊 **What projects are you starting today?**`;

  try {
    let chosenModel = model || persona?.model || "gemini-flash-latest";
    if (chosenModel.includes("gemini-1.5") || chosenModel.includes("gemini-2.5") || chosenModel.includes("gemini-3.1") || chosenModel.includes("gemini-2.0")) {
      chosenModel = "gemini-flash-latest";
    }
    const response = await callGemini(prompt, false, chosenModel);
    res.json({ response, reply: response });
  } catch (e: any) {
    console.error("AI Agent response sequence failed:", e.message);
    res.json({
      response: `${agentName} is temporarily offline sync. Ensure GEMINI_API_KEY is defined in functions settings.`,
      reply: `${agentName} is offline.`
    });
  }
});

// ─── 4. SUMMARIZE ENDPOINT ────────────────────────────────────────────────
export const aiSummarize = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST method required" });
    return;
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "messages array parameter is required" });
    return;
  }

  const conversation = messages.map((m: any) => `${m.user || m.userName || "User"}: ${m.text}`).join("\n");
  const key = cacheKey(conversation);
  const cached = fromCache(key, 6); // Cache summaries for 6 hours
  if (cached) {
    res.json({ summary: cached });
    return;
  }

  try {
    const summary = await callGemini(
      `Summarize this community conversation in bullet points. Include: main topics, decisions made, action items.
Conversation:
${conversation}`
    );
    toCache(key, summary);
    res.json({ summary });
  } catch (e: any) {
    console.error("AI Summarize failure:", e.message);
    res.json({ summary: "Summary currently unavailable — core service offline." });
  }
});

// ─── 5. PERSONA ENDPOINT ──────────────────────────────────────────────────
export const aiPersona = functions.https.onRequest(async (req, res) => {
  corsHeaders(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST method required" });
    return;
  }

  const { query, persona, context } = req.body;
  if (!query || !persona || !context) {
    res.status(400).json({ error: "Missing query, persona, or context fields" });
    return;
  }

  const history = (context.recentMessages || [])
    .slice(-10)
    .map((m: any) => `${m.isAI ? persona.name : m.user}: ${m.text}`)
    .join("\n");

  try {
    const response = await callGemini(
      `You are ${persona.name} (${persona.role}).
${persona.systemInstruction}
Community: "${context.groupName}"
Recent chat:
${history}
New message: ${query}

OUTPUT GUIDELINES (COMPLIANCE IS ABSOLUTELY MANDATORY):
- Always respond in character as ${persona.name}.
- Provide your response in SHORT bullet points ONLY.
- Do NOT write long paragraphs under any circumstances.
- Start every single point with a standard asterisk bullet ("* ") followed naturally by an emoji and clear action-oriented description.
- Keep each point short, conversational, exciting, friendly, and highly readable.
- Highlight key terms or ideas with **bold text**.
- Do NOT write any introduction or conclusion paragraphs of prose. Just output the list of bullet points directly.

Required Format Example:
* 👋 **Welcome onboard!** Glad to have you here in our secure frequency.
* 🚀 **Explore channels** to connect with community members instantly.
* 💡 **Share innovative ideas** to collaborate and build together.
* 😊 **What projects are you starting today?**`
    );
    res.json({ response });
  } catch (e: any) {
    console.error("AI Persona sequence failure:", e.message);
    res.json({ response: `${persona.name} is updating neural parameters... try again shortly!` });
  }
});

// ─── 6. LEMONSQUEEZY WEBHOOK ENDPOINT ─────────────────────────────────────
export const webhookLemonSqueezy = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("POST method required");
    return;
  }

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || functions.config().lemonsqueezy?.webhook_secret || "";
  const signature = req.headers["x-signature"] as string;

  if (secret && signature) {
    const digest = crypto.createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("hex");
    if (digest !== signature) {
      console.error("LemonSqueezy Webhook Verification Fail: Signature Mismatch.");
      res.status(401).json({ error: "Invalid signature verification" });
      return;
    }
  }

  const payload = req.body;
  const eventName = payload?.meta?.event_name;
  const userId = payload?.meta?.custom_data?.user_id;
  const planId = payload?.meta?.custom_data?.plan_id;
  const orderData = payload?.data?.attributes;

  if (!userId) {
    res.status(200).json({ received: true, message: "Missing custom user ID context" });
    return;
  }

  try {
    const userRef = db.collection("profiles").doc(userId);
    if (eventName === "order_created" || eventName === "subscription_created") {
      await userRef.set({
        plan: planId || "starter",
        planStatus: "active",
        planActivatedAt: Date.now()
      }, { merge: true });
    } else if (eventName === "subscription_updated") {
      await userRef.set({
        planStatus: orderData?.status === "active" ? "active" : "inactive"
      }, { merge: true });
    } else if (eventName === "subscription_cancelled") {
      await userRef.set({
        planStatus: "cancelled",
        planCancelledAt: Date.now()
      }, { merge: true });
    }
    res.status(200).json({ received: true, transactionUpdate: "success" });
  } catch (e: any) {
    console.error("Webhook database pipeline error:", e.message);
    res.status(500).json({ error: "Firestore write transaction failed" });
  }
});
