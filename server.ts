import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  // AI API Routes
  app.post("/api/ai/moderate", async (req, res) => {
    const { text } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Analyze the following message for a community platform. 
          Detect if it contains spam, scams, toxic language, harassment, or harmful links.
          Return a JSON response in this format:
          {
            "isSafe": boolean,
            "reason": string (optional, if unsafe),
            "flaggedContent": string (optional, snippet of the problematic part)
          }
          
          Message: "${text}"
        `,
        config: {
          responseMimeType: "application/json"
        }
      });
      res.json(JSON.parse(response.text || '{"isSafe": true}'));
    } catch (error) {
      console.error("Moderation error:", error);
      res.status(500).json({ isSafe: true, error: "Internal AI Error" });
    }
  });

  app.post("/api/ai/summarize", async (req, res) => {
    const { messages } = req.body;
    const conversation = messages.map((m: any) => `${m.user}: ${m.text}`).join("\n");
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Summarize the following community conversation. 
          Identify the main topics discussed, decisions made, and any pending action items.
          Keep it concise and formatted with bullet points.
          
          Conversation:
          ${conversation}
        `
      });
      res.json({ summary: response.text || "No summary generated." });
    } catch (error) {
      console.error("Summarization error:", error);
      res.status(500).json({ summary: "Failed to sync summary from mainframe." });
    }
  });

  app.post("/api/ai/persona", async (req, res) => {
    const { query, persona, context } = req.body;
    const history = context.recentMessages.map((m: any) => {
      const speaker = m.isAI ? persona.name : m.user;
      return `${speaker}: ${m.text}`;
    }).join("\n");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Your Identity: ${persona.name} (${persona.role})
          Your Task: ${persona.systemInstruction}
          Group Context: This conversation is happening in the "${context.groupName}" community.
          
          Recent Chat History:
          ${history}
          
          New Query (mention):
          ${query}
          
          Instruction: Respond as ${persona.name}. Be helpful, social, and stay in character. Keep your response concise (under 3 sentences).
        `
      });
      res.json({ response: response.text || "I'm processing that right now..." });
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
