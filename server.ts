import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS — allow all origins in dev, lock down in production
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') { res.sendStatus(200); return; }
    next();
  });
  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

  // AI API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.post("/api/ai/moderate", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });
    try {
      const result = await ai.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent({
        contents: [{ role: 'user', parts: [{ text: `
          Analyze the message provided in the next part for a community platform. 
          Detect if it contains spam, scams, toxic language, harassment, or harmful links.
          Return ONLY a JSON response in this exact format:
          {
            "isSafe": boolean,
            "reason": "string (optional, if unsafe)",
            "flaggedContent": "string (optional, snippet of the problematic part)"
          }
        `}, { text: `Message: "${text}"` }]}],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });
      
      const responseText = result.response.text();
      res.json(JSON.parse(responseText || '{"isSafe": true}'));
    } catch (error) {
      console.error("Moderation error:", error);
      res.status(500).json({ isSafe: true, error: "Internal AI Error" });
    }
  });

  app.post("/api/ai/agent", async (req, res) => {
    // Unified agent handler — supports both AI agents and help chatbot
    const { query, message, agentId, agentName, context, systemContext, history } = req.body;
    const userMessage = (message || query || '').trim();
    if (!userMessage) return res.status(400).json({ error: "Missing message" });

    try {
      let prompt = '';

      if (agentId === 'caas-help' && systemContext) {
        // Help chatbot mode
        prompt = `${systemContext}\n\nConversation so far:\n${history || ''}\n\nUser: ${userMessage}\nAssistant:`;
      } else {
        // AI agent persona mode
        const name = agentName || agentId || 'Assistant';
        const personas: Record<string, string> = {
          aria: 'community architecture, member experience, and growth strategy',
          nova: 'innovation, technology, and cutting-edge research',
          muse: 'creative writing, arts, and aesthetic philosophy',
          sage: 'knowledge curation, education, and history',
          bridge: 'community integration, group dynamics, and conflict resolution',
        };
        const expertise = personas[agentId as keyof typeof personas] || 'general community topics';
        const groupCtx = context ? "Community: " + (context.groupName || 'Unknown') + ", Channel: " + (context.channelName || 'general') : '';
        prompt = `You are ${name}, an AI agent in the CaaS Community OS. Your expertise: ${expertise}. ${groupCtx}\n\nUser: ${userMessage}\n\nRespond as ${name}. Be concise and helpful. Max 3 sentences.`;
      }

      const result = await ai.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(prompt);
      const reply = result.response.text() || "Signal strength low. Try again.";
      res.json({ reply, response: reply });
    } catch (error) {
      console.error("Agent error:", error);
      res.status(500).json({ reply: "AI node offline. Try again shortly.", response: "AI node offline." });
    }
  });

  app.post("/api/ai/summarize", async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Messages array is required" });
    const conversation = messages.map((m: any) => `${m.user}: ${m.text}`).join("\n");
    
    try {
      const result = await ai.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(`
        Summarize the following community conversation. 
        Identify the main topics discussed, decisions made, and any pending action items.
        Keep it concise and formatted with bullet points.
        
        Conversation:
        ${conversation}
      `);
      res.json({ summary: result.response.text() || "No summary generated." });
    } catch (error) {
      console.error("Summarization error:", error);
      res.status(500).json({ summary: "Failed to sync summary from mainframe." });
    }
  });

  app.post("/api/ai/persona", async (req, res) => {
    const { query, persona, context } = req.body;
    if (!query || !persona || !context) return res.status(400).json({ error: "Missing required fields" });
    
    const history = context.recentMessages.map((m: any) => {
      const speaker = m.isAI ? persona.name : m.user;
      return `${speaker}: ${m.text}`;
    }).join("\n");

    try {
      const result = await ai.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent({
        contents: [{ role: 'user', parts: [{ text: `
          Your Identity: ${persona.name} (${persona.role})
          Your Task: ${persona.systemInstruction}
          Group Context: This conversation is happening in the "${context.groupName}" community.
          
          Recent Chat History:
          ${history}
          
          Instruction: Respond as ${persona.name}. Be helpful, social, and stay in character. Keep your response concise (under 3 sentences).
        `}, { text: `New User Query: ${query}` }]}]
      });
      res.json({ response: result.response.text() || "I'm processing that right now..." });
    } catch (error) {
      console.error("Persona error:", error);
      res.status(500).json({ response: "Connection to neural link unstable. Please retry." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
