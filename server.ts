import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
          Analyze the following message for a community platform. 
          Detect if it contains spam, scams, toxic language, harassment, or harmful links.
          Return ONLY a JSON response in this exact format:
          {
            "isSafe": boolean,
            "reason": "string (optional, if unsafe)",
            "flaggedContent": "string (optional, snippet of the problematic part)"
          }
          
          Message: "${text}"
        `}]}],
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
    const { query, agentId, agentName, context } = req.body;
    if (!query || !agentName) return res.status(400).json({ error: "Missing query or agent info" });

    try {
      const result = await ai.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(`
        System Directive: You are ${agentName}, an autonomous intelligence node in the CaaS ecosystem.
        ${agentId === 'aria' ? 'Your expertise is in fitness, health, and metabolic optimization.' : ''}
        ${agentId === 'nova' ? 'Your expertise is in high-tech research, code, and system architecture.' : ''}
        ${agentId === 'muse' ? 'Your expertise is in arts, creative writing, and aesthetic philosophy.' : ''}
        ${agentId === 'sage' ? 'Your expertise is in history, library sciences, and general education.' : ''}
        ${agentId === 'bridge' ? 'Your expertise is in community integration, group dynamics, and conflict resolution.' : ''}
        
        Group context: This message was sent in the "${context?.groupName || 'Unknown'}" community, channel "${context?.channelName || 'general'}".
        
        User Query: ${query}
        
        Respond as ${agentName}. Be concise, helpful, and maintain your specific protocol (persona). Max 3 sentences.
      `);
      
      res.json({ response: result.response.text() || "Signal strength low. Query failed." });
    } catch (error) {
      console.error("Agent execution error:", error);
      res.status(500).json({ response: "Intelligence node offline. Maintenance required." });
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
      const result = await ai.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(`
        Your Identity: ${persona.name} (${persona.role})
        Your Task: ${persona.systemInstruction}
        Group Context: This conversation is happening in the "${context.groupName}" community.
        
        Recent Chat History:
        ${history}
        
        New Query (mention):
        ${query}
        
        Instruction: Respond as ${persona.name}. Be helpful, social, and stay in character. Keep your response concise (under 3 sentences).
      `);
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
