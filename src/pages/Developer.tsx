import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { Code, Copy, Check, Zap, Key, Webhook, Book, Terminal, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

const endpoints = [
  { method: 'GET', path: '/api/health', desc: 'System status and uptime check', auth: false },
  { method: 'POST', path: '/api/ai/moderate', desc: 'Submit content for AI moderation', auth: true },
  { method: 'POST', path: '/api/ai/agent', desc: 'Invoke an AI agent persona', auth: true },
  { method: 'POST', path: '/api/ai/summarize', desc: 'Summarize community content', auth: true },
  { method: 'POST', path: '/api/ai/persona', desc: 'Generate persona-based response', auth: true },
];

const codeExamples: Record<string, string> = {
  moderate: `// Moderate content with CaaS AI
const response = await fetch('/api/ai/moderate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    content: "Message to moderate",
    groupId: "your-group-id"
  })
});

const { safe, reason, severity } = await response.json();
console.log(safe ? 'Content approved' : \`Flagged: \${reason}\`);`,

  agent: `// Invoke AI agent
const response = await fetch('/api/ai/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: "aria",
    message: "User message here",
    history: []
  })
});

const { reply } = await response.json();`,

  webhook: `// Webhook payload (sent to your endpoint)
{
  "event": "message.flagged",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "messageId": "msg_123",
    "groupId": "group_456",
    "content": "...",
    "severity": "high",
    "reason": "Toxic content detected"
  }
}`,
};

export default function Developer() {
  const { user } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);
  const [activeExample, setActiveExample] = useState('moderate');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [keyGenerated, setKeyGenerated] = useState(false);
  const fakeApiKey = `caas_${user?.uid?.slice(0, 8) || 'demo'}_v1_${Math.random().toString(36).slice(2, 10)}`;

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const methodColor = (m: string) => ({
    GET: 'text-green-400 bg-green-400/10 border-green-400/20',
    POST: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    DELETE: 'text-red-400 bg-red-400/10 border-red-400/20',
  }[m] || 'text-gray-400');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-4 md:px-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-16">
          <div className="mb-4 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-primary/20 bg-primary/10 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            <Terminal className="w-3 h-3" />
            Developer Terminal · API v1
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
            Build on <span className="text-primary italic">CaaS OS.</span>
          </h1>
          <p className="text-gray-400 text-xl font-medium max-w-2xl">
            Extend your communities programmatically. Real-time webhooks, AI moderation API, and agent invocation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left - API Key + Endpoints */}
          <div className="space-y-6">

            {/* API Key */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <Key className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest">API Key</h2>
              </div>
              {!user ? (
                <p className="text-gray-500 text-sm">Sign in to generate your API key.</p>
              ) : !keyGenerated ? (
                <button
                  onClick={() => setKeyGenerated(true)}
                  className="w-full py-4 bg-primary rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
                >
                  Generate API Key
                </button>
              ) : (
                <div>
                  <div className="p-4 bg-black/50 border border-white/10 rounded-2xl font-mono text-xs text-primary break-all mb-3">
                    {fakeApiKey}
                  </div>
                  <button
                    onClick={() => copy(fakeApiKey, 'key')}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                  >
                    {copied === 'key' ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Key</>}
                  </button>
                  <p className="text-[10px] text-gray-600 mt-3">Store this securely. It won't be shown again.</p>
                </div>
              )}
            </div>

            {/* Endpoints */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest">Endpoints</h2>
              </div>
              <div className="space-y-3">
                {endpoints.map(ep => (
                  <div key={ep.path} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black border", methodColor(ep.method))}>
                        {ep.method}
                      </span>
                      {ep.auth && <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">Auth</span>}
                    </div>
                    <code className="text-xs text-gray-300 font-mono">{ep.path}</code>
                    <p className="text-[10px] text-gray-500 mt-1">{ep.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Code Examples + Webhooks */}
          <div className="lg:col-span-2 space-y-6">

            {/* Code Examples */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <Code className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest">Code Examples</h2>
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {Object.keys(codeExamples).map(key => (
                  <button
                    key={key}
                    onClick={() => setActiveExample(key)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      activeExample === key ? "bg-primary text-white" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div className="relative">
                <pre className="bg-black/60 border border-white/10 rounded-2xl p-6 text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed">
                  {codeExamples[activeExample]}
                </pre>
                <button
                  onClick={() => copy(codeExamples[activeExample], 'code')}
                  className="absolute top-4 right-4 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                >
                  {copied === 'code' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Webhooks */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <Webhook className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest">Webhooks</h2>
              </div>
              <p className="text-gray-400 text-sm font-medium mb-6">
                Receive real-time events when messages are flagged, members join, or AI takes action.
              </p>
              <div className="flex gap-3 mb-4">
                <input
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-mono outline-none focus:ring-2 ring-primary/50 placeholder:text-gray-600"
                />
                <button className="px-6 py-4 bg-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all whitespace-nowrap">
                  Register
                </button>
              </div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                Events: message.flagged · member.joined · member.banned · ai.action
              </div>
            </div>

            {/* Docs link */}
            <div className="p-8 bg-primary/10 border border-primary/20 rounded-[2rem] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Book className="w-8 h-8 text-primary" />
                <div>
                  <div className="font-black text-lg tracking-tighter">Full API Documentation</div>
                  <div className="text-gray-400 text-sm">Complete reference for all endpoints, webhooks, and SDK.</div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all whitespace-nowrap">
                View Docs <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
