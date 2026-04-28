import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: any = null;

export async function getAiResponse(agentName: string, prompt: string, personality: string, context: string = "") {
  try {
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
      genAI = new GoogleGenerativeAI(apiKey);
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `You are ${agentName}. Personality: ${personality}. Context: ${context}. Keep responses concise and focused on community engagement. Don't use markdown headers.`
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI Node Failure:", error);
    return "The neural link has fluctuated. Please re-send your signal.";
  }
}
