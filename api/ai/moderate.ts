import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const result = await ai.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContent({
      contents: [{ role: 'user', parts: [{ text: `
        Analyze this message for a community platform. Detect spam, toxic language, harassment, or harmful content.
        Return ONLY valid JSON:
        { "isSafe": boolean, "reason": "string", "riskLevel": "none|low|medium|high" }
        Message: "${text.slice(0, 500)}"
      `}]}],
      generationConfig: { responseMimeType: 'application/json' },
    });
    const parsed = JSON.parse(result.response.text() || '{}');
    return res.status(200).json({ isSafe: true, reason: '', riskLevel: 'none', ...parsed });
  } catch (err) {
    console.error('Moderate error:', err);
    return res.status(200).json({ isSafe: true, reason: '', riskLevel: 'none' });
  }
}
