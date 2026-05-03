import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";

// ─── Firebase Admin Init ───────────────────────────────────────────────────
let adminDb: any = null;

function getAdminDb() {
  if (adminDb) return adminDb;

  if (!getApps().length) {
    const adminKey = process.env.FIREBASE_ADMIN_KEY;
    try {
      const config = adminKey ? JSON.parse(adminKey) : null;
      if (config) {
        initializeApp({
          credential: cert(config),
        });
      }
    } catch (e) {
      console.warn("Failed to parse FIREBASE_ADMIN_KEY:", e);
    }
  }

  try {
    // The database ID from firebase-applet-config.json
    const DB_ID = "ai-studio-95661d37-8b72-4889-b551-a061c973db08";
    adminDb = getFirestore(DB_ID);
    return adminDb;
  } catch (e) {
    console.error("Firebase Admin SDK failed to initialize Firestore:", e);
    return null;
  }
}

// ─── Cache Helpers ─────────────────────────────────────────────────────────

function hashPrompt(prompt: string): string {
  return crypto.createHash("sha256").update(prompt.trim().toLowerCase()).digest("hex").slice(0, 40);
}

async function getCached(collection: string, key: string, ttlHours = 24): Promise<string | null> {
  const db = getAdminDb();
  if (!db) return null;
  
  try {
    const ref = db.collection("ai_cache").doc(`${collection}_${key}`);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const data = snap.data()!;
    const ageMs = Date.now() - data.createdAt;
    if (ageMs > ttlHours * 3600000) {
      await ref.delete();
      return null;
    }
    console.log(`✅ Cache HIT [${collection}] — Gemini credit saved!`);
    return data.response as string;
  } catch {
    return null;
  }
}

async function saveCache(collection: string, key: string, response: string): Promise<void> {
  const db = getAdminDb();
  if (!db) return;
  
  try {
    await db.collection("ai_cache").doc(`${collection}_${key}`).set({
      response,
      createdAt: Date.now(),
    });
  } catch (e) {
    console.warn("Cache save failed (non-critical):", e);
  }
}

// ─── Server ────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-signature');
    if (req.method === 'OPTIONS') { res.sendStatus(200); return; }
    next();
  });

  // Native body parsers
  app.use("/api/webhook/lemonsqueezy", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // ── Moderation (cached 7 days) ──────
  app.post("/api/ai/moderate", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const cacheKey = hashPrompt(text);
    const cached = await getCached("moderate", cacheKey, 168);
    if (cached) return res.json(JSON.parse(cached));

    try {
      const result = await ai.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent({
        contents: [{ role: "user", parts: [{ text: `
          Analyze the following message for a community platform. 
          Detect if it contains spam, scams, toxic language, harassment, or harmful links.
          Return ONLY a JSON response in this exact format:
          {
            "isSafe": boolean,
            "reason": "string (brief explanation if unsafe, empty string if safe)",
            "riskLevel": "none | low | medium | high",
            "flaggedContent": "string (optional, snippet of the problematic part)"
          }
          Message: "${text}"
        `}]}],
        generationConfig: { responseMimeType: "application/json" },
      });
      const responseText = result.response.text();
      await saveCache("moderate", cacheKey, responseText);
      res.json(JSON.parse(responseText || '{"isSafe": true, "reason": "", "riskLevel": "none"}'));
    } catch (error) {
      console.error("Moderation error:", error);
      res.status(500).json({ isSafe: true, reason: "", riskLevel: "none" });
    }
  });

  // ── AI Agent (cached 1 hour) ─────────────────────────────────────────────
  app.post("/api/ai/agent", async (req, res) => {
    const { query, message, agentId, agentName, context, systemContext, history } = req.body;
    const userMessage = (message || query || '').trim();
    if (!userMessage) return res.status(400).json({ error: "Missing message" });

    const cacheKey = hashPrompt(`${agentId}_${userMessage}`);
    const cached = await getCached("agent", cacheKey, 1);
    if (cached) return res.json({ reply: cached, response: cached });

    try {
      let prompt = '';

      if (agentId === 'caas-help' && systemContext) {
        prompt = `${systemContext}\n\nConversation so far:\n${history || ''}\n\nUser: ${userMessage}\nAssistant:`;
      } else if (agentId === 'atlas') {
        const groupCtx = context ? "Community: " + (context.groupName || 'Unknown') + ", Channel: " + (context.channelName || 'general') : '';
        prompt = `You are Atlas, the Community Architect. Your mission is to build a thriving community, encourage user engagement, welcome new members, and provide essential onboarding tips. ${groupCtx}\n\nUser: ${userMessage}\n\nRespond as Atlas. Be warm, encouraging, and strategic. Max 3 sentences.`;
      } else {
        const name = agentName || agentId || 'Assistant';
        const personas: Record<string, string> = {
          aria: 'community architecture, member experience, and growth strategy',
          nova: 'innovation, technology, and cutting-edge research',
          muse: 'creative writing, arts, and aesthetic philosophy',
          sage: 'knowledge curation, education, and history',
          bridge: 'community integration, group dynamics, and conflict resolution',
          atlas: 'community building, growth strategy, and empowering members with onboarding tips',
        };
        const expertise = personas[agentId as keyof typeof personas] || 'general community topics';
        const groupCtx = context ? "Community: " + (context.groupName || 'Unknown') + ", Channel: " + (context.channelName || 'general') : '';
        prompt = `You are ${name}, an AI agent in the CaaS Community OS. Your expertise: ${expertise}. ${groupCtx}\n\nUser: ${userMessage}\n\nRespond as ${name}. Be concise and helpful. Max 3 sentences.`;
      }

      const result = await ai.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(prompt);
      const response = result.response.text() || "Signal strength low. Query failed.";
      await saveCache("agent", cacheKey, response);
      res.json({ reply: response, response });
    } catch (error) {
      console.error("Agent execution error:", error);
      res.status(500).json({ reply: "Intelligence node offline.", response: "Intelligence node offline. Maintenance required." });
    }
  });

  // ── Summarize (cached 6 hours) ───────────────────────────────────────────
  app.post("/api/ai/summarize", async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Messages array is required" });

    const conversation = messages.map((m: any) => `${m.user}: ${m.text}`).join("\n");
    const cacheKey = hashPrompt(conversation);
    const cached = await getCached("summarize", cacheKey, 6);
    if (cached) return res.json({ summary: cached });

    try {
      const result = await ai.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(`
        Summarize this community conversation. Identify main topics, decisions, and action items.
        Keep it concise with bullet points.
        Conversation:
        ${conversation}
      `);
      const summary = result.response.text() || "No summary generated.";
      await saveCache("summarize", cacheKey, summary);
      res.json({ summary });
    } catch (error) {
      console.error("Summarization error:", error);
      res.status(500).json({ summary: "Failed to sync summary from mainframe." });
    }
  });

  // ── Payments (Lemon Squeezy) ─────────────────────────────────────────────
  app.post("/api/payments/checkout", async (req, res) => {
    const { variantId, userId, userEmail, userName, planId } = req.body;
    
    if (!variantId || !userId) {
      return res.status(400).json({ error: "Missing required fields: variantId and userId" });
    }

    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;

    // If API key is missing, return a direct link (fallback)
    if (!apiKey) {
      console.warn("LEMONSQUEEZY_API_KEY missing - using direct checkout link fallback");
      const storeSlug = process.env.VITE_LEMONSQUEEZY_STORE || "YOUR_STORE_SLUG";
      const directUrl = `https://${storeSlug}.lemonsqueezy.com/checkout/buy/${variantId}?checkout[email]=${userEmail || ''}&checkout[custom][user_id]=${userId}&checkout[custom][plan_id]=${planId || ''}`;
      return res.json({ checkoutUrl: directUrl });
    }

    try {
      // Create a checkout via Lemon Squeezy API
      const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
          "Accept": "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              checkout_data: {
                email: userEmail,
                name: userName,
                custom: {
                  user_id: userId,
                  plan_id: planId
                }
              },
              product_options: {
                redirect_url: `${req.protocol}://${req.get('host')}/pricing?success=1`,
              }
            },
            relationships: {
              store: {
                data: { type: "stores", id: storeId }
              },
              variant: {
                data: { type: "variants", id: variantId }
              }
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.detail || "Lemon Squeezy API error");
      }

      const data = await response.json();
      res.json({ checkoutUrl: data.data.attributes.url });
    } catch (error: any) {
      console.error("Checkout creation failed:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout" });
    }
  });

  // ── Persona (cached 30 minutes) ──────────────────────────────────────────
  app.post("/api/ai/persona", async (req, res) => {
    const { query, persona, context } = req.body;
    if (!query || !persona || !context) return res.status(400).json({ error: "Missing required fields" });

    const cacheKey = hashPrompt(`${persona.name}_${query}`);
    const cached = await getCached("persona", cacheKey, 0.5);
    if (cached) return res.json({ response: cached });

    const history = context.recentMessages
      .map((m: any) => `${m.isAI ? persona.name : m.user}: ${m.text}`)
      .join("\n");

    try {
      const result = await ai.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(`
        Identity: ${persona.name} (${persona.role})
        Task: ${persona.systemInstruction}
        Group: "${context.groupName}"
        Recent Chat: ${history}
        New Query: ${query}
        Respond as ${persona.name}. Stay in character. Max 3 sentences.
      `);
      const response = result.response.text() || "I'm processing that right now...";
      await saveCache("persona", cacheKey, response);
      res.json({ response });
    } catch (error) {
      console.error("Persona error:", error);
      res.status(500).json({ response: "Connection to neural link unstable. Please retry." });
    }
  });

  // ── LemonSqueezy Webhook ─────────────────────────────────────────────────
  app.post("/api/webhook/lemonsqueezy", async (req: any, res) => {
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
    const signature = req.headers["x-signature"] as string;

    if (secret && signature) {
      const hmac = crypto.createHmac("sha256", secret);
      const digest = hmac.update(req.body).digest("hex");
      if (digest !== signature) {
        console.warn("❌ Webhook signature mismatch — rejected");
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(req.body.toString());
    } catch {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }

    const eventName = payload?.meta?.event_name;
    const customData = payload?.meta?.custom_data || {};
    const userId = customData?.user_id;
    const planId = customData?.plan_id;
    const attributes = payload?.data?.attributes;

    console.log(`📦 LemonSqueezy webhook: ${eventName} | user: ${userId} | plan: ${planId}`);

    if (!userId) {
      console.warn("Webhook missing user_id in custom_data — skipping Firestore update");
      return res.status(200).json({ received: true });
    }

    try {
      const db = getAdminDb();
      if (!db) {
        console.warn("Firestore Admin not available for webhook processing");
        return res.status(200).json({ received: true });
      }
      
      const userRef = db.collection("users").doc(userId);

      if (eventName === "order_created") {
        await userRef.set({
          plan: planId || "starter",
          planStatus: "active",
          planActivatedAt: Date.now(),
          lemonSqueezyOrderId: attributes?.identifier || null,
          lemonSqueezyCustomerId: attributes?.customer_id || null,
        }, { merge: true });
        console.log(`✅ User ${userId} upgraded via order to ${planId}`);
      }
      else if (eventName === "subscription_created") {
        await userRef.set({
          plan: planId || "starter",
          planStatus: "active",
          planActivatedAt: Date.now(),
          subscriptionId: payload?.data?.id || null,
          lemonSqueezyCustomerId: attributes?.customer_id || null,
          subscriptionRenewsAt: attributes?.renews_at || null,
        }, { merge: true });
        console.log(`✅ Subscription created for user ${userId} — plan: ${planId}`);
      }
      else if (eventName === "subscription_updated") {
        const status = attributes?.status;
        await userRef.set({
          planStatus: status === "active" ? "active" : "inactive",
          subscriptionRenewsAt: attributes?.renews_at || null,
          subscriptionUpdatedAt: Date.now(),
        }, { merge: true });
        console.log(`🔄 Subscription updated for user ${userId} — status: ${status}`);
      }
      else if (eventName === "subscription_cancelled") {
        await userRef.set({
          planStatus: "cancelled",
          planCancelledAt: Date.now(),
          planEndsAt: attributes?.ends_at || null,
        }, { merge: true });
        console.log(`⚠️ Subscription cancelled for user ${userId}`);
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error("Firestore update failed:", err);
      res.status(500).json({ error: "Database update failed" });
    }
  });

  // ── Vite / Static ────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`💾 AI caching active — Gemini credits protected!`);
  });
}

startServer();
