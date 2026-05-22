import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { query, persona, context } = req.body;
  if (!query || !persona || !context) return res.status(400).json({ error: 'Missing required fields' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ response: `${persona.name} is offline.` });

  const history = (context.recentMessages || []).slice(-10)
    .map((m: any) => `${m.isAI ? persona.name : m.user}: ${m.text}`).join('\n');

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are ${persona.name} (${persona.role}). ${persona.systemInstruction || ''}\nCommunity: "${context.groupName}"\nRecent chat:\n${history}\nUser: ${query}\nRespond as ${persona.name}. Warm and helpful. Max 3 sentences.`,
    });
    res.json({ response: result.text || `${persona.name} could not respond right now.` });
  } catch (e) {
    res.json({ response: `${persona.name} is resyncing... try again in a moment!` });
  }
}
