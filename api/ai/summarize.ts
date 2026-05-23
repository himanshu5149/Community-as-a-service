import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const conversation = messages.map((m: any) => `${m.user || m.userName || "User"}: ${m.text}`).join('\n');
  const prompt = `Summarize this community conversation in bullet points. Include: main topics, decisions made, action items.
Conversation:
${conversation}`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({ summary: 'Summary is currently unavailable. Please configure GEMINI_API_KEY inside your Vercel Project Settings.' });
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
      model: 'gemini-2.0-flash',
      contents: prompt
    });

    res.json({ summary: result.text || 'Summary generation failure.' });
  } catch (e) {
    console.error('Summarization error:', e);
    res.json({ summary: 'Summary currently unavailable.' });
  }
}
