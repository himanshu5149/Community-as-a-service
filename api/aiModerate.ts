import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  if (text.trim().length < 15) return res.json({ isSafe: true, riskLevel: 'none' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ isSafe: true, riskLevel: 'none' });

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze this community message for harmful content. Message: "${text}"\nReturn ONLY JSON: { "isSafe": boolean, "reason": "string", "riskLevel": "none"|"low"|"medium"|"high" }`,
      config: { responseMimeType: 'application/json' },
    });
    const parsed = JSON.parse(result.text || '{"isSafe":true,"riskLevel":"none"}');
    res.json(parsed);
  } catch (e) {
    res.json({ isSafe: true, riskLevel: 'none' });
  }
}
