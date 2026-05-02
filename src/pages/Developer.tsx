import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { Code, Copy, Check, Zap, Key, Webhook, Book, Terminal, AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

const endpoints = [
  {
    method: 'GET',
    path: '/api/health',
    desc: 'Check system status and uptime',
    auth: false,
    request: null,
    response: `{ "status": "healthy", "timestamp": "2025-01-01T00:00:00.000Z" }`,
  },
  {
    method: 'POST',
    path: '/api/ai/moderate',
    desc: 'Submit content for real-time AI moderation',
    auth: true,
    request: `{ "text": "Message content to moderate", "groupId": "your-group-id" }`,
    response: `{ "safe": false, "reason": "Toxic language detected", "severity": "high" }`,
  },
  {
    method: 'POST',
    path: '/api/ai/agent',
    desc: 'Invoke an AI agent persona for a response',
    auth: true,
    request: `{ "agentId": "aria", "message": "How should I structure my tech community?" }`,
    response: `{ "reply": "For a tech community...", "agentId": "aria" }`,
  },
];

const webhookEvents = [
  { event: 'message.flagged', desc: 'Fired when AI flags a message', payload: '{ messageId, groupId, content, severity, reason }' },
  { event: 'member.joined', desc: 'Fired when a new member joins', payload: '{ userId, groupId, role, joinedAt }' },
];

const codeExamples: Record<string, { lang: string; code: string }> = {
  'Moderate Content': {
    lang: 'javascript',
    code: `const moderateMessage = async (text, groupId) => {
  const response = await fetch('/api/ai/moderate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({ text, groupId })
  });
  const { safe, reason } = await response.json();
  return safe;
};`
  },
};

export default function Developer() {
  const { user } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);
  const [activeExample, setActiveExample] = useState('Moderate Content');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [keyGenerated, setKeyGenerated] = useState(false);
  const [openEndpoint, setOpenEndpoint] = useState<string | null>(null);
  const fakeApiKey = `caas_${user?.uid?.slice(0, 8) || 'demo'}_v1_${Math.random().toString(36).slice(2, 10)}`;

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-4 md:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <div className="mb-4 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-primary/20 bg-primary/10 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            <Terminal className="w-3 h-3" /> CaaS OS · Developer Terminal
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
            Build on <span className="text-primary italic">CaaS OS.</span>
          </h1>
          <div className="flex flex-wrap gap-4 mt-8">
            {[{ label: 'Base URL', val: 'https://ais-dev-pxhr2jcdyb6syhowqkyg2m-585642286852.asia-east1.run.app' }, { label: 'Auth', val: 'Bearer Token' }].map(item => (
              <div key={item.label} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs">
                <span className="text-gray-500 font-bold">{item.label}: </span>
                <span className="font-mono text-primary">{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6">API Key</h2>
              {!user ? (
                <p className="text-gray-500 text-sm">Sign in to generate your API key.</p>
              ) : !keyGenerated ? (
                <button onClick={() => setKeyGenerated(true)} className="w-full py-4 bg-primary rounded-2xl font-black uppercase tracking-widest text-xs">Generate API Key</button>
              ) : (
                <div>
                  <div className="p-4 bg-black/50 border border-white/10 rounded-2xl font-mono text-xs text-primary break-all mb-3">{fakeApiKey}</div>
                  <button onClick={() => copy(fakeApiKey, 'key')} className="text-xs font-black uppercase tracking-widest text-gray-400">{copied === 'key' ? 'Copied' : 'Copy Key'}</button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6">API Endpoints</h2>
              <div className="space-y-3">
                {endpoints.map(ep => (
                  <div key={ep.path} className="border border-white/10 rounded-2xl overflow-hidden">
                    <button onClick={() => setOpenEndpoint(openEndpoint === ep.path ? null : ep.path)} className="w-full flex items-center justify-between p-4 text-left">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded-lg text-[10px] font-black border text-blue-400 bg-blue-400/10 border-blue-400/20">{ep.method}</span>
                        <code className="text-sm text-gray-200 font-mono">{ep.path}</code>
                      </div>
                      <ChevronDown className={cn("w-4 h-4 text-gray-500", openEndpoint === ep.path && "rotate-180")} />
                    </button>
                    {openEndpoint === ep.path && (
                      <div className="p-4 border-t border-white/10 space-y-4">
                        <p className="text-sm text-gray-400">{ep.desc}</p>
                        <pre className="bg-black/60 border border-white/10 rounded-xl p-4 text-xs font-mono text-green-300 overflow-x-auto">{ep.response}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <h2 className="text-sm font-black uppercase tracking-widest mb-6">Webhooks</h2>
              <div className="flex gap-3 mb-6">
                <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://your-server.com/webhook" className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-mono outline-none" />
                <button className="px-6 py-4 bg-primary rounded-2xl font-black text-xs uppercase tracking-widest">Register</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
