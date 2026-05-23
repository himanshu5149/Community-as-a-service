import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { query, persona, context } = req.body;
  if (!query || !persona || !context) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const history = (context.recentMessages || []).slice(-10)
    .map((m: any) => `${m.isAI ? persona.name : (m.user || m.userName || 'User')}: ${m.text}`).join('\n');

  const prompt = `You are ${persona.name} (${persona.role}).
${persona.systemInstruction || ''}
Community: "${context.groupName}"
Recent chat:
${history}
New message: ${query}
Respond as ${persona.name} — stay in character. Warm and helpful. Max 3 sentences.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      response: `${persona.name} is currently offline. Please add the "GEMINI_API_KEY" env variable inside Vercel's Environment Variables settings to complete activation.`
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

    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt
    });

    res.json({ response: result.text || 'No response.' });
  } catch (e) {
    console.error('Persona error:', e);
    const errPersonaName = persona?.name || 'The agent';
    res.json({ response: `${errPersonaName} is resyncing... try again in a moment!` });
  }
}
