import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, persona, context } = req.body;
  if (!query || !persona) return res.status(400).json({ error: 'Missing query or persona' });

  const history = context?.recentMessages
    ?.map((m: any) => `${m.isAI ? persona.name : m.user}: ${m.text}`)
    .join('\n') || '';

  try {
    const result = await ai.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContent(
      `Identity: ${persona.name} (${persona.role})\nTask: ${persona.systemInstruction || 'Be helpful'}\nGroup: "${context?.groupName || 'Unknown'}"\nRecent Chat: ${history}\nUser: ${query}\n\nRespond as ${persona.name}. Stay in character. Max 3 sentences.`
    );
    const response = result.response.text() || 'Processing...';
    return res.status(200).json({ response, reply: response });
  } catch (err) {
    console.error('Persona error:', err);
    return res.status(200).json({ 
      response: 'Neural link unstable. Please try to contact me again in a moment!',
      reply: 'Neural link unstable.'
    });
  }
}
