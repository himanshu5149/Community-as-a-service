import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages array required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.json({ summary: 'Summary unavailable.' });

  const conversation = messages.map((m: any) => `${m.user}: ${m.text}`).join('\n');
  const prompt = `Summarize this community conversation using bullet points (•). Include: main topics discussed, decisions made, action items.\n\n${conversation}`;

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

    let summary = '';
    let lastError: any = null;

    for (const model of models) {
      try {
        const result = await ai.models.generateContent({ model, contents: prompt });
        summary = result.text?.trim() || '';
        if (summary) break;
      } catch (err: any) {
        lastError = err;
        if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid')) throw err;
        continue;
      }
    }

    if (!summary) throw lastError;
    res.json({ summary });
  } catch (e) {
    console.error('Summarize error:', e);
    res.json({ summary: 'Summary unavailable.' });
  }
}
