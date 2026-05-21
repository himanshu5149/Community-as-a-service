import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    status: 'healthy',
    gemini: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
}
