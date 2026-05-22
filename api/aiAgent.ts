import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { query, message, agentId, agentName, context, systemInstruction } = req.body;
  const userMessage = query || message;
  if (!userMessage || !agentName) return res.status(400).json({ error: 'query and agentName required' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ response: `${agentName} offline — API key missing.` });

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
  const sysInstruction = systemInstruction || `You are ${agentName}, an AI community member. Your expertise: ${expertise}. Be helpful, warm, and concise. Max 3 sentences.`;

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `${sysInstruction}\n\nCommunity: "${context?.groupName || 'Unknown'}" | Channel: "${context?.channelName || 'general'}"\n\nUser: ${userMessage}`,
    });
    const response = result.text || `${agentName} could not generate a response.`;
    res.json({ response, reply: response });
  } catch (e: any) {
    console.error('Agent error:', JSON.stringify(e));
    res.json({ response: `${agentName} is temporarily offline. Please try again.` });
  }
}
