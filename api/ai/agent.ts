import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { query, message, agentId, agentName, context, history, systemInstruction } = req.body;
  const userMessage = query || message;
  if (!userMessage || !agentName) return res.status(400).json({ error: 'query and agentName required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.json({ response: `${agentName} is offline — API key missing.`, reply: `${agentName} is offline.` });

  const expertiseMap: Record<string, string> = {
    aria:         'fitness, nutrition, health, and metabolic optimization',
    aria_fitness: 'fitness, nutrition, health, and metabolic optimization',
    nexus:        'software engineering, code, cloud architecture, and technology',
    nexus_tech:   'software engineering, code, cloud architecture, and technology',
    lumina:       'creative arts, design, visual aesthetics, and artistic philosophy',
    lumina_art:   'creative arts, design, visual aesthetics, and artistic philosophy',
    sage:         'education, history, academic research, and knowledge synthesis',
    sage_study:   'education, history, academic research, and knowledge synthesis',
    orbit:        'community management, introductions, social dynamics, group cohesion',
    orbit_social: 'community management, introductions, social dynamics, group cohesion',
  };
  const expertise = expertiseMap[agentId?.toLowerCase()] || 'general community assistance';

  const historyText = Array.isArray(history) && history.length
    ? '\nRecent conversation:\n' + history.slice(-6).map((m: any) =>
        `${m.role === 'user' ? 'User' : agentName}: ${m.content || m.text}`).join('\n')
    : (typeof history === 'string' ? `\n${history}` : '');

  const baseInstruction = systemInstruction ||
    `You are ${agentName}, an expert AI community member. Your expertise: ${expertise}. Be helpful, warm, and insightful.`;

  const prompt = `${baseInstruction}
Community: "${context?.groupName || 'Unknown'}" | Channel: "${context?.channelName || 'general'}"${historyText}

User: ${userMessage}

RESPONSE RULES:
- If listing steps, tips, or items use bullet points with • symbol
- Keep response under 4 sentences or 4 bullet points
- Be direct and helpful
- Do not use markdown headers
- Respond as ${agentName}`;

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Try models in order — first working one is used
    const models = [
      process.env.GEMINI_MODEL,
      'gemini-3.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-pro'
    ].filter(Boolean) as string[];

    let response = '';
    let lastError: any = null;

    for (const model of models) {
      try {
        const result = await ai.models.generateContent({ model, contents: prompt });
        response = result.text?.trim() || '';
        if (response) break;
      } catch (err: any) {
        lastError = err;
        // If API key is invalid — stop immediately, no point trying other models
        if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid')) throw err;
        // Otherwise try next model
        continue;
      }
    }

    if (!response) throw lastError;
    res.json({ response, reply: response });

  } catch (e: any) {
    console.error('Agent error:', JSON.stringify(e));
    if (e?.message?.includes('API_KEY_INVALID')) {
      return res.status(500).json({ response: `${agentName} is offline — invalid API key.` });
    }
    res.json({
      response: `${agentName} is temporarily offline. Please try again shortly.`,
      reply: `${agentName} is temporarily offline.`
    });
  }
}
