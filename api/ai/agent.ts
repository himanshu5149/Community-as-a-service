import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const PERSONAS: Record<string, string> = {
  aria: 'community architecture, member experience, and growth strategy',
  nova: 'innovation, technology, and cutting-edge research',
  muse: 'creative writing, arts, and aesthetic philosophy',
  sage: 'knowledge curation, education, and history',
  bridge: 'community integration, group dynamics, and conflict resolution',
  atlas: 'community building, growth strategy, and empowering members',
};

const CAAS_HELP = `You are the CaaS OS Assistant. CaaS is a Community Operating System with: real-time group chat with channels, AI moderation via Gemini, direct messages, AI agents (Aria/Nova/Muse/Sage/Bridge/Atlas), Spaces for cross-community collaboration, Events, Dashboard, Marketplace (community blueprints), Developer API, Settings, Onboarding wizard, Explore page, Pricing via Lemon Squeezy ($49 Starter, $199 Professional). Routes: /groups /explore /dashboard /messages /spaces /events /ai /marketplace /developer /settings /pricing /help /admin /onboarding. Answer helpfully in under 150 words. If bug reported, acknowledge it.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query, message, agentId, agentName, context, systemContext, history } = req.body;
  const userMessage = (message || query || '').trim();
  if (!userMessage) return res.status(400).json({ error: 'Missing message' });

  try {
    let prompt = '';

    if (agentId === 'caas-help' && systemContext) {
      prompt = `${CAAS_HELP}\n\nHistory:\n${history || ''}\n\nUser: ${userMessage}\nAssistant:`;
    } else if (agentId === 'atlas') {
      const groupCtx = context ? `Community: ${context.groupName || 'Unknown'}, Channel: ${context.channelName || 'general'}` : '';
      prompt = `You are Atlas, the Community Architect. Your mission is to build a thriving community, encourage user engagement, welcome new members, and provide essential onboarding tips. ${groupCtx}\n\nUser: ${userMessage}\n\nRespond as Atlas. Be warm, encouraging, and strategic. Max 3 sentences.`;
    } else {
      const name = agentName || agentId || 'Assistant';
      const expertise = PERSONAS[agentId] || 'general community topics';
      const groupCtx = context ? `Community: ${context.groupName || 'Unknown'}, Channel: ${context.channelName || 'general'}` : '';
      prompt = `You are ${name}, an AI agent in CaaS Community OS. Expertise: ${expertise}. ${groupCtx}\n\nUser: ${userMessage}\n\nRespond as ${name}. Be concise. Max 3 sentences.`;
    }

    const result = await ai.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContent(prompt);
    const reply = result.response.text() || 'Signal strength low. Try again.';
    return res.status(200).json({ reply, response: reply });
  } catch (err) {
    console.error('Agent error:', err);
    return res.status(500).json({ reply: 'AI node offline. Try again.', response: 'AI node offline.' });
  }
}
