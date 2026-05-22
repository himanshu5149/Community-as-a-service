import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages array required' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ summary: 'Summary unavailable.' });

  const conversation = messages.map((m: any) => `${m.user}: ${m.text}`).join('\n');
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Summarize this community conversation in bullet points. Include main topics, decisions, action items.\n\n${conversation}`,
    });
    res.json({ summary: result.text || 'No summary generated.' });
  } catch (e) {
    res.json({ summary: 'Summary unavailable.' });
  }
}
