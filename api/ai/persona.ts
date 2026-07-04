import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { query, persona, context } = req.body;
  if (!query || !persona || !context) return res.status(400).json({ error: 'Missing required fields' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.json({ response: `${persona.name} is offline.` });

  const history = (context.recentMessages || []).slice(-8)
    .map((m: any) => `${m.isAI ? persona.name : m.user}: ${m.text}`).join('\n');

  const prompt = `You are ${persona.name} (${persona.role}). ${persona.systemInstruction || ''}
Community: "${context.groupName}"
Recent chat:\n${history}
User: ${query}
Respond as ${persona.name}. Be warm and helpful. Use bullet points (•) when listing items. Max 4 sentences.`;

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Try models in order — first working one is used
    const models = [
      process.env.GEMINI_MODEL,
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
        if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid')) throw err;
        continue;
      }
    }

    if (!response) throw lastError;
    res.json({ response });
  } catch (e) {
    console.error('Persona error:', e);
    res.json({ response: `${persona.name} is resyncing... try again in a moment!` });
  }
}
