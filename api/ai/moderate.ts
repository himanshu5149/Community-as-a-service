import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const cache = new Map<string, { result: any; time: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  if (text.trim().length < 15) return res.json({ isSafe: true, riskLevel: 'none' });

  const key = text.trim().toLowerCase().slice(0, 120);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < 86400000) return res.json(cached.result);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.json({ isSafe: true, riskLevel: 'none' });

  const prompt = `Analyze this community message for harmful content. Message: "${text}"\nReturn ONLY valid JSON: { "isSafe": boolean, "reason": "string", "riskLevel": "none"|"low"|"medium"|"high" }`;

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

    let responseText = '';
    let lastError: any = null;

    for (const model of models) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        responseText = result.text?.trim() || '';
        if (responseText) break;
      } catch (err: any) {
        lastError = err;
        if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid')) throw err;
        continue;
      }
    }

    if (!responseText) throw lastError;

    const parsed = JSON.parse(responseText || '{"isSafe":true,"riskLevel":"none","reason":""}');
    cache.set(key, { result: parsed, time: Date.now() });
    res.json(parsed);
  } catch (e) {
    console.error('Moderation error:', e);
    res.json({ isSafe: true, riskLevel: 'none' });
  }
}
