import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ─── Firebase Admin (lazy loaded — won't crash if key missing) ────────────
let adminDb: any = null;

function getAdminDb() {
  if (adminDb) return adminDb;
  try {
    if (!getApps().length) {
      const adminKey = process.env.FIREBASE_ADMIN_KEY;
      if (!adminKey) {
        console.warn("⚠️  FIREBASE_ADMIN_KEY not set — webhook + cache features disabled");
        return null;
      }
      let credential;
      try {
        const parsed = JSON.parse(adminKey);
        if (!parsed.private_key) {
          console.error("❌ FIREBASE_ADMIN_KEY looks like a Project ID only — paste the FULL service account JSON");
          return null;
        }
        credential = cert(parsed);
      } catch {
        console.error("❌ FIREBASE_ADMIN_KEY is not valid JSON — check your environment variable");
        return null;
      }
      initializeApp({ credential });
    }
    // The database ID from firebase-applet-config.json
    const DB_ID = "ai-studio-95661d37-8b72-4889-b551-a061c973db08";
    adminDb = getFirestore(DB_ID);
    console.log("✅ Firebase Admin connected");
    return adminDb;
  } catch (e) {
    console.error("❌ Firebase Admin init failed:", e);
    return null;
  }
}

// ─── Gemini Client ────────────────────────────────────────────────────────
function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("❌ GEMINI_API_KEY is not set — AI features will not work");
    return null;
  }
  return new GoogleGenerativeAI(key);
}

// ─── Safe Gemini Call ─────────────────────────────────────────────────────
async function callGemini(prompt: string, jsonMode = false): Promise<string | null> {
  const ai = getGemini();
  if (!ai) return null;
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const config: any = jsonMode ? { generationConfig: { responseMimeType: "application/json" } } : {};
    const result = jsonMode
      ? await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }], ...config })
      : await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    if (error?.message?.includes("API_KEY_INVALID") || error?.message?.includes("API key not valid")) {
      console.error("❌ INVALID_GEMINI_API_KEY — Go to aistudio.google.com and generate a new key");
    } else if (error?.message?.includes("quota")) {
      console.error("❌ GEMINI_QUOTA_EXCEEDED — You've hit your API limit");
    } else {
      console.error("❌ Gemini call failed:", error?.message);
    }
    return null;
  }
}

// ─── In-Memory Cache (works without Firebase Admin) ───────────────────────
const memCache = new Map<string, { v: string; t: number }>();
function hashKey(text: string) {
  return crypto.createHash("sha256").update(text.trim().toLowerCase()).digest("hex").slice(0, 40);
}
function fromCache(key: string, ttlHours: number): string | null {
  const hit = memCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.t > ttlHours * 3600000) { memCache.delete(key); return null; }
  return hit.v;
}
function toCache(key: string, value: string) { memCache.set(key, { v: value, t: Date.now() }); }

// ─── Server ───────────────────────────────────────────────────────────────
async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000");

  app.use(express.json());

  // ── Health ───────────────────────────────────────────────────────────────
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      gemini: !!process.env.GEMINI_API_KEY,
      firebaseAdmin: !!process.env.FIREBASE_ADMIN_KEY,
      timestamp: new Date().toISOString()
    });
  });

  // ── Moderation ───────────────────────────────────────────────────────────
  app.post("/api/ai/moderate", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    // Skip short messages — never toxic
    if (text.trim().length < 15) return res.json({ isSafe: true, riskLevel: "none" });

    const key = hashKey(text);
    const cached = fromCache(key, 168); // 7 days
    if (cached) return res.json(JSON.parse(cached));

    const prompt = `Analyze this community message for spam, harassment, hate speech, or harmful content.
Message: "${text}"
Return ONLY JSON: { "isSafe": boolean, "reason": "string", "riskLevel": "none"|"low"|"medium"|"high" }`;

    const result = await callGemini(prompt, true);
    if (!result) return res.json({ isSafe: true, riskLevel: "none" });

    try {
      const parsed = JSON.parse(result);
      toCache(key, JSON.stringify(parsed));
      res.json(parsed);
    } catch {
      res.json({ isSafe: true, riskLevel: "none" });
    }
  });

  // ── AI Agent ─────────────────────────────────────────────────────────────
  app.post("/api/ai/agent", async (req, res) => {
    const { query, agentId, agentName, context, persona } = req.body;
    if (!query || !agentName) return res.status(400).json({ error: "Missing query or agentName" });

    let expertise = "general community assistance";
    let personality = "be helpful, on-topic, and concise";
    let role = "Assistant";

    if (persona) {
      expertise = persona.expertise || expertise;
      personality = persona.personality || personality;
      role = persona.role || role;
    } else {
      const expertiseMap: Record<string, string> = {
        aria:   "fitness, nutrition, health, and metabolic optimization",
        nexus:  "software engineering, code, cloud architecture, and technology",
        lumina: "creative arts, design, visual aesthetics, and artistic philosophy",
        sage:   "education, history, academic research, and knowledge synthesis",
        orbit:  "community management, social dynamics, introductions, and group cohesion",
      };
      expertise = expertiseMap[agentId] || expertise;
    }

    const prompt = `You are ${agentName}, an AI member of the CaaS community platform.
Your Role: ${role}
Your Expertise: ${expertise}
Your Personality: ${personality}

Context:
Community: "${context?.groupName || "Unknown"}" | Channel: "${context?.channelName || "general"}"
User message: ${query}

Respond as ${agentName} — stay strictly in character. Max 3 sentences. No markdown headers.`;

    const result = await callGemini(prompt);
    if (!result) return res.json({ response: `${agentName} is temporarily offline. Please try again shortly.` });
    res.json({ response: result });
  });

  // ── Summarize ─────────────────────────────────────────────────────────────
  app.post("/api/ai/summarize", async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Messages array required" });

    const conversation = messages.map((m: any) => `${m.user}: ${m.text}`).join("\n");
    const key = hashKey(conversation);
    const cached = fromCache(key, 6);
    if (cached) return res.json({ summary: cached });

    const prompt = `Summarize this community conversation in bullet points. Include: main topics, decisions made, action items.
Conversation:
${conversation}`;

    const summary = await callGemini(prompt);
    if (!summary) return res.json({ summary: "Summary unavailable — AI service offline." });
    toCache(key, summary);
    res.json({ summary });
  });

  // ── Persona ───────────────────────────────────────────────────────────────
  app.post("/api/ai/persona", async (req, res) => {
    const { query, persona, context } = req.body;
    if (!query || !persona || !context) return res.status(400).json({ error: "Missing required fields" });

    const history = (context.recentMessages || [])
      .slice(-10)
      .map((m: any) => `${m.isAI ? persona.name : m.user}: ${m.text}`)
      .join("\n");

    const prompt = `You are ${persona.name} (${persona.role}).
${persona.systemInstruction}
Community: "${context.groupName}"
Recent chat:
${history}

New message: ${query}
Respond as ${persona.name}. Stay in character. Be warm and helpful. Max 3 sentences.`;

    const response = await callGemini(prompt);
    if (!response) return res.json({ response: `${persona.name} is resyncing... try again in a moment!` });
    res.json({ response });
  });

  // ── LemonSqueezy Webhook ──────────────────────────────────────────────────
  app.post("/api/webhook/lemonsqueezy", express.raw({ type: "application/json" }), async (req, res) => {
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
    const signature = req.headers["x-signature"] as string;

    if (secret && signature) {
      const digest = crypto.createHmac("sha256", secret).update(req.body).digest("hex");
      if (digest !== signature) {
        console.warn("❌ Webhook signature mismatch");
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    let payload: any;
    try { payload = JSON.parse(req.body.toString()); }
    catch { return res.status(400).json({ error: "Invalid JSON" }); }

    const eventName = payload?.meta?.event_name;
    const userId = payload?.meta?.custom_data?.user_id;
    const planId = payload?.meta?.custom_data?.plan_id;
    const orderData = payload?.data?.attributes;

    console.log(`📦 Webhook: ${eventName} | user: ${userId} | plan: ${planId}`);

    if (!userId) return res.status(200).json({ received: true });

    const db = getAdminDb();
    if (!db) return res.status(200).json({ received: true, note: "Firebase Admin not configured" });

    try {
      const userRef = db.collection("profiles").doc(userId);
      if (eventName === "order_created" || eventName === "subscription_created") {
        await userRef.set({ plan: planId || "starter", planStatus: "active", planActivatedAt: Date.now() }, { merge: true });
        console.log(`✅ User ${userId} upgraded to ${planId}`);
      } else if (eventName === "subscription_updated") {
        await userRef.set({ planStatus: orderData?.status === "active" ? "active" : "inactive" }, { merge: true });
      } else if (eventName === "subscription_cancelled") {
        await userRef.set({ planStatus: "cancelled", planCancelledAt: Date.now() }, { merge: true });
      }
      res.status(200).json({ received: true });
    } catch (err) {
      console.error("Firestore update failed:", err);
      res.status(500).json({ error: "Database update failed" });
    }
  });

  // ── Frontend ──────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 CaaS server running on port ${PORT}`);
    console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? "✅ Connected" : "❌ GEMINI_API_KEY missing"}`);
    console.log(`🔥 Firebase Admin: ${process.env.FIREBASE_ADMIN_KEY ? "✅ Key found" : "⚠️  Not configured"}`);
  });
}

startServer();
