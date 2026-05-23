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
  if (!userMessage || !agentName) {
    return res.status(400).json({ error: 'query and agentName required' });
  }

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
  const expertise = expertiseMap[agentId] || 'general community assistance';

  const historyText = Array.isArray(history) && history.length
    ? '\nRecent conversation:\n' + history.slice(-6).map((m: any) => `${m.role === 'user' ? 'User' : agentName}: ${m.content || m.text}`).join('\n')
    : (typeof history === 'string' ? history : '');

  const sysInstruction = systemInstruction || `You are ${agentName}, an AI community member. Your expertise: ${expertise}. Be helpful, warm, and concise.`;

  const prompt = `${sysInstruction}
Community: "${context?.groupName || 'Unknown'}" | Channel: "${context?.channelName || 'general'}"${historyText ? `\n${historyText}` : ''}

User: ${userMessage}

Respond as ${agentName} — stay strictly in character. Max 3 sentences. No markdown headers. Be concise but insightful.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      response: `${agentName} is currently offline. To activate this agent on Vercel, please navigate to your Vercel Project Settings > Environment Variables and add your "GEMINI_API_KEY".`,
      reply: `${agentName} is currently offline.`
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let requestedModel = req.body.model || req.body.persona?.model || 'gemini-2.0-flash';
    if (requestedModel.includes('gemini-3.5') || requestedModel.includes('gemini-2.5') || requestedModel.includes('gemini-3.1')) {
      requestedModel = 'gemini-2.0-flash';
    }

    const modelsToTry = [
      requestedModel,
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ];

    const uniqueModels = Array.from(new Set(modelsToTry));
    let lastError = null;
    let response = '';

    for (const modelToTry of uniqueModels) {
      try {
        const result = await ai.models.generateContent({
          model: modelToTry,
          contents: prompt
        });
        response = result.text || '';
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelToTry} failed in Vercel handler, checking next fallback...`);
        if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid')) {
          throw err;
        }
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    res.json({ response, reply: response });
  } catch (e: any) {
    console.error('Agent error:', e.message);
    if (e.message?.includes('API_KEY_INVALID') || e.message?.includes('API key not valid')) {
      return res.status(500).json({ error: 'Invalid Gemini API key', response: `${agentName} is offline — API key issue.` });
    }
    res.json({ response: `${agentName} is temporarily offline. Please try again shortly.`, reply: `${agentName} is temporarily offline.` });
  }
}
