import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Helper for lazy loading GoogleGenAI instance safely
  let aiClient: GoogleGenAI | null = null;
  function getAi(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set. Please add it via Settings > Secrets.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // Keep track of the working model for the current environment
  let verifiedModel: string | null = null;

  // Model generator with automatic fallback checking
  async function generateContentWithFallback(options: { model: string; contents: any; config?: any }) {
    const ai = getAi();
    const modelsToTry: string[] = [];

    // Prioritize the known working model to eliminate latency on subsequent calls
    if (verifiedModel) {
      modelsToTry.push(verifiedModel);
    }

    modelsToTry.push(options.model);
    modelsToTry.push("gemini-flash-latest");
    modelsToTry.push("gemini-2.5-flash");
    modelsToTry.push("gemini-3.5-flash");

    const uniqueModels = Array.from(new Set(modelsToTry)).filter(Boolean) as string[];
    let lastError = null;

    for (const modelToTry of uniqueModels) {
      try {
        const response = await ai.models.generateContent({
          ...options,
          model: modelToTry
        });
        // Cache the successful model
        if (!verifiedModel) {
          verifiedModel = modelToTry;
        }
        return response;
      } catch (err: any) {
        lastError = err;
        if (err.message?.includes("API_KEY_INVALID") || err.message?.includes("API key not valid")) {
          throw err;
        }
        // Suppress intermediate warnings to keep console output clean.
        // Only log if we are at the absolute end of the fallback chain.
        if (modelToTry === uniqueModels[uniqueModels.length - 1]) {
          console.error(`Gemini Error: Fallback chain exhausted. Last error: ${err.message}`);
        }
      }
    }
    throw lastError || new Error("All fallback models failed.");
  }

  // --- API Routes ---
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      gemini: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    });
  });

  app.post(["/api/aiModerate", "/api/ai/moderate"], async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "text required" });
      }
      if (text.trim().length < 15) {
        return res.json({ isSafe: true, riskLevel: "none" });
      }
      
      const prompt = `Analyze this community message for spam, harassment, hate speech, or harmful content.
Message: "${text}"
Return ONLY JSON: { "isSafe": boolean, "reason": "string", "riskLevel": "none"|"low"|"medium"|"high" }`;

      const response = await generateContentWithFallback({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const responseText = response.text || '{"isSafe": true, "riskLevel": "none"}';
      const parsedResult = JSON.parse(responseText);
      res.json(parsedResult);
    } catch (err: any) {
      console.error("Local aiModerate error:", err);
      res.json({ isSafe: true, riskLevel: "none" }); // Fail-safe
    }
  });

  app.post(["/api/aiSummarize", "/api/ai/summarize"], async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages array required" });
      }
      const conversation = messages.map((m: any) => `${m.user || m.userName || "User"}: ${m.text}`).join("\n");
      const prompt = `Summarize this community conversation in bullet points. Include: main topics, decisions made, action items.
Conversation:
${conversation}`;

      const response = await generateContentWithFallback({
        model: "gemini-flash-latest",
        contents: prompt
      });
      
      res.json({ summary: response.text || "Summary generation failure." });
    } catch (err: any) {
      console.error("Local aiSummarize error:", err);
      res.json({ summary: "Summary currently unavailable." });
    }
  });

  app.post(["/api/aiAgent", "/api/ai/agent"], async (req, res) => {
    try {
      const { query, message, agentId, agentName: providedName, context, persona, history, systemContext } = req.body;
      const userInput = query || message;
      const agentName = providedName || "Assistant";
      
      if (!userInput) {
        return res.status(400).json({ error: "query/message and agentName required" });
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
      
      const systemInstructionContent = `You are ${agentName}, an AI member of the CaaS community platform.
Your Role: ${role}
Your Expertise: ${expertise}
Your Personality: ${personality}
${systemInstruction ? `\nInternal Agent Rules:\n${systemInstruction}\n` : ""}
Context:
Community: "${context?.groupName || "Unknown"}" | Channel: "${context?.channelName || "general"}"

OUTPUT GUIDELINES (COMPLIANCE IS ABSOLUTELY MANDATORY):
- Always respond in character as ${agentName}.
- Provide your response in SHORT bullet points ONLY.
- Do NOT write long paragraphs under any circumstances.
- Start every point with a standard asterisk bullet ("* ") followed naturally by an emoji and clear action-oriented description.
- Keep each point short, conversational, exciting, friendly, and highly readable.
- Highlight key terms or ideas with **bold text**.
- Do NOT write introduction or conclusion paragraphs of prose. Just output the list of bullet points directly.

Required Format Example:
* 👋 **Welcome onboard!** Glad to have you here in our secure frequency.
* 🚀 **Explore channels** to connect with community members instantly.
* 💡 **Share innovative ideas** to collaborate and build together.
* 😊 **What projects are you starting today?**`;

      const contents = `${history ? `Recent Conversation:\n${history}\n` : ""}User message: ${userInput}`;

      let chosenModel = req.body.model || req.body.persona?.model || "gemini-flash-latest";
      if (chosenModel.includes("gemini-1.5") || chosenModel.includes("gemini-2.5") || chosenModel.includes("gemini-2.0") || chosenModel.includes("gemini-3.5")) {
        chosenModel = "gemini-flash-latest";
      }
      const response = await generateContentWithFallback({
        model: chosenModel,
        contents: contents,
        config: {
          systemInstruction: systemInstructionContent
        }
      });
      
      const responseText = response.text || `${agentName} did not respond.`;
      res.json({ response: responseText, reply: responseText });
    } catch (err: any) {
      console.error("Local aiAgent error:", err);
      const errName = req.body.agentName || "The agent";
      res.json({
         response: `${errName} is temporarily offline. Please configure your GEMINI_API_KEY in Settings.`,
         reply: `${errName} is temporarily offline.`
      });
    }
  });

  app.post(["/api/aiPersona", "/api/ai/persona"], async (req, res) => {
    try {
      const { query, persona, context } = req.body;
      if (!query || !persona || !context) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const history = (context.recentMessages || [])
        .slice(-10)
        .map((m: any) => `${m.isAI ? persona.name : m.user}: ${m.text}`)
        .join("\n");
         
      const systemInstructionContent = `You are ${persona.name} (${persona.role}).
${persona.systemInstruction}
Community: "${context.groupName}"

OUTPUT GUIDELINES (COMPLIANCE IS ABSOLUTELY MANDATORY):
- Always respond in character as ${persona.name}.
- Provide your response in SHORT bullet points ONLY.
- Do NOT write long paragraphs under any circumstances.
- Start every point with a standard asterisk bullet ("* ") followed naturally by an emoji and clear action-oriented description.
- Keep each point short, conversational, exciting, friendly, and highly readable.
- Highlight key terms or ideas with **bold text**.
- Do NOT write introduction or conclusion paragraphs of prose. Just output the list of bullet points directly.

Required Format Example:
* 👋 **Welcome onboard!** Glad to have you here in our secure frequency.
* 🚀 **Explore channels** to connect with community members instantly.
* 💡 **Share innovative ideas** to collaborate and build together.
* 😊 **What projects are you starting today?**`;

      const contents = `Recent chat:\n${history}\nNew message: ${query}`;

      const response = await generateContentWithFallback({
        model: "gemini-flash-latest",
        contents: contents,
        config: {
          systemInstruction: systemInstructionContent
        }
      });
      
      res.json({ response: response.text || "No response." });
    } catch (err: any) {
      console.error("Local aiPersona error:", err);
      const errPersonaName = req.body.persona?.name || "The agent";
      res.json({ response: `${errPersonaName} is resyncing... try again in a moment!` });
    }
  });

  // --- Vite Dev Server Middleware Integration ---
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Align keep-alive and request headers timeouts to prevent connection socket timeouts / resets
  server.keepAliveTimeout = 120 * 1000; // 120 seconds
  server.headersTimeout = 125 * 1000; // 125 seconds
}

startServer();
