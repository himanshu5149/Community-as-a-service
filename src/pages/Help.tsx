import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, ChevronRight, Book, MessageSquare, Shield, Bot, Users, Zap, Package, Code, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const sections = [
  {
    id: 'getting-started',
    icon: <Zap className="w-5 h-5" />,
    title: 'Getting Started',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
    articles: [
      {
        title: 'What is CaaS OS?',
        content: `CaaS (Community as a Service) is a Community Operating System — the same way Android is an OS for phones, CaaS is the OS for online communities. You don't build the infrastructure. You just run your community on top of ours.

CaaS gives you:
• Real-time group chat with channels
• AI moderation that runs automatically on every message
• AI agent personas that help your community
• Spaces for cross-community collaboration
• A full dashboard to manage everything

Think of it like launching a Discord server — but with AI safety built in from day one, and a proper admin control panel.`
      },
      {
        title: 'How to create your first community',
        content: `Creating a community takes less than 2 minutes:

1. Go to /onboarding or click "New Community" from your Dashboard
2. Step 1 — Name your community and pick a category (Tech, Fitness, Arts, etc.)
3. Step 2 — Choose access type: Open (anyone can join) or Invite-Only (restricted)
4. Step 3 — Click Launch

CaaS automatically creates a #general channel and sets you as the admin. Your community is live immediately.

Tip: You can also install a pre-built Blueprint from the Marketplace — these come with pre-configured channels and AI settings for your niche.`
      },
      {
        title: 'Inviting members to your community',
        content: `To invite members:

Open Network (public): Share your community link. Members can find and join from the Explore page (/explore).

Invite-Only: Go to your group → Settings → copy the invite link. Only people with that link can join.

Member roles:
• Admin — full control, can delete group, ban members, manage channels
• Moderator — can pin/delete messages, manage members
• Member — can send messages, react, participate

You can change member roles from the group's Members panel.`
      },
    ]
  },
  {
    id: 'chat',
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Chat & Messaging',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
    articles: [
      {
        title: 'How channels work',
        content: `Channels are topic-specific chat rooms inside your community. Every community starts with a #general channel.

Admins can create new channels for specific topics — for example: #announcements, #help, #showcase.

Channel types:
• Text channels — standard chat with messages, reactions, replies
• Announcement channels — only admins can post (coming soon)

To navigate channels, use the sidebar on the left inside your group. Click any channel name to open it.`
      },
      {
        title: 'Sending messages and reactions',
        content: `Typing and sending:
• Type in the input box at the bottom → press Enter to send
• Use Shift+Enter for a new line
• Paste images directly into the chat

Message actions (hover a message):
• React — add emoji reactions
• Reply — thread a response to a specific message
• Pin — pin important messages (admins/mods only)
• Delete — remove your own messages

Direct Messages:
Go to /messages to start a private 1-on-1 conversation with any member. DMs are separate from group channels.`
      },
      {
        title: 'What happens when a message is flagged?',
        content: `CaaS AI scans every message in real-time using Gemini. When a message violates community guidelines:

1. The AI flags the message instantly
2. A warning appears on the message
3. Admins see it in the Moderation Dashboard (/admin)
4. Admins can dismiss (keep) or delete the message

The AI checks for:
• Toxic language and hate speech
• Harassment and threats
• Spam and excessive self-promotion
• Policy violations

You can adjust how strict the AI is in Settings → AI Config → Moderation Sensitivity.`
      },
    ]
  },
  {
    id: 'ai',
    icon: <Bot className="w-5 h-5" />,
    title: 'AI Features',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    articles: [
      {
        title: 'AI Agents — what they are',
        content: `AI Agents are intelligent personas that live inside your communities. Each has a distinct personality and area of expertise.

Available agents:
• Aria — Community architect, helps with structure and strategy
• Nova — Innovation catalyst, surfaces new ideas
• Muse — Creative director, helps with content
• Sage — Knowledge curator, answers questions
• Bridge — Connection builder, links members and communities

To use an agent, go to /ai and select one. You can deploy agents to specific groups or the global nexus.

Agents remember conversation context and respond in character. They're not generic chatbots — each has a defined role in your community OS.`
      },
      {
        title: 'Setting up AI moderation',
        content: `AI moderation is on by default for every community. No setup needed.

To customize it:
1. Go to Settings (/settings) → AI Config tab
2. Adjust the Moderation Sensitivity slider (0% = lenient, 100% = strict)
3. Toggle Auto-delete (removes violations automatically)
4. Toggle Show Warnings (warn users before taking action)

To see what the AI has flagged:
Go to /admin → Moderation section. You'll see all flagged messages with the reason. You can dismiss or delete from there.

Tip: Start at 70% sensitivity and adjust based on your community's culture.`
      },
    ]
  },
  {
    id: 'spaces',
    icon: <Zap className="w-5 h-5" />,
    title: 'Spaces & Events',
    color: 'text-green-400',
    bg: 'bg-green-400/10 border-green-400/20',
    articles: [
      {
        title: 'What are Neural Spaces?',
        content: `Spaces are cross-community collaboration rooms. Unlike group channels (which belong to one community), Spaces can connect members from multiple different communities.

Example: A Tech community and a Business community both join a "Startup Founders" Space to collaborate.

How to use Spaces:
• Go to /spaces to see all active spaces
• Create a new space and invite groups to it
• Members of any connected group can participate
• AI moderation still applies in Spaces

Spaces solve the isolation problem — your members shouldn't have to re-introduce themselves in every community they join.`
      },
      {
        title: 'Creating and managing Events',
        content: `Events let you schedule gatherings for your community.

To create an event:
1. Go to /events → Create Event
2. Set title, description, date/time
3. Choose type: Online or In-person
4. Publish to your community

Members can RSVP. You'll see attendee counts in real-time.

Events appear in:
• The Events page (/events)
• The Dashboard event stream
• Member notifications (if they have event alerts on)`
      },
    ]
  },
  {
    id: 'admin',
    icon: <Shield className="w-5 h-5" />,
    title: 'Admin & Moderation',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/20',
    articles: [
      {
        title: 'Admin dashboard overview',
        content: `The Admin dashboard (/admin) is your command center for managing your community OS.

What you can do:
• View AI-flagged messages with one-click ban or dismiss
• See real-time community health metrics
• Manage member roles (promote to mod, ban, remove)
• View analytics — message volume, active members, AI operations
• See reports submitted by members

Access: Only users with the admin role can access /admin. The person who creates a community is automatically the admin.

Tip: Check the admin dashboard daily when your community is growing. The AI catches most issues but your judgment matters for edge cases.`
      },
      {
        title: 'Banning and managing members',
        content: `To manage a member:
1. Go to your group → Members list
2. Click on a member's name
3. Options: Change role, Remove from group, Ban

Banned members cannot rejoin unless you lift the ban.

Role hierarchy:
Admin > Moderator > Member

Moderators can: delete messages, pin messages, manage members
Admins can: everything + delete the group, manage channels, configure AI settings

To promote someone to moderator:
Members list → click member → Change Role → Moderator`
      },
    ]
  },
  {
    id: 'billing',
    icon: <Package className="w-5 h-5" />,
    title: 'Plans & Billing',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/20',
    articles: [
      {
        title: 'CaaS pricing plans',
        content: `CaaS has three plans:

Starter — $49/month
• Up to 500 members
• 1 community group
• 1 Bridge connection
• AI moderation included
• Standard support

Professional — $199/month
• Up to 5,000 members
• 3 community groups
• Unlimited bridges
• AI moderation + analytics
• Priority support
• Custom domain

Enterprise — Custom pricing
• Unlimited members
• Unlimited groups
• White-labeling
• API access
• Dedicated account manager
• SLA guarantee

All plans include a 7-day refund guarantee. Cancel anytime, no penalties.`
      },
      {
        title: 'How payments work',
        content: `CaaS processes payments through Lemon Squeezy — a payment platform that works globally including Nepal.

To upgrade:
1. Go to /pricing
2. Click "Deploy Protocol" on your chosen plan
3. You'll be redirected to a secure Lemon Squeezy checkout
4. Pay with any major card (Visa, Mastercard, Amex) or PayPal

Billing is monthly and automatic. You'll receive email receipts.

To cancel or change plans, contact support or use the billing portal in your account settings.

For Enterprise pricing, click "Contact Sales" on the pricing page — you'll be connected with the team directly.`
      },
    ]
  },
];

export default function Help() {
  const [search, setSearch] = useState('');
  const [openSection, setOpenSection] = useState<string | null>('getting-started');
  const [openArticle, setOpenArticle] = useState<string | null>(null);

  const filtered = sections.map(section => ({
    ...section,
    articles: section.articles.filter(a =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(s => !search || s.articles.length > 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-4 md:px-10">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-16">
          <div className="mb-6 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em]">
            <Book className="w-3 h-3 text-primary" />
            CaaS OS Documentation
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.85]">
            Help <span className="text-primary italic">Center.</span>
          </h1>
          <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto mb-10">
            Everything you need to know about running your community on CaaS OS.
          </p>

          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white font-medium outline-none focus:ring-2 ring-primary/50 placeholder:text-gray-600 transition-all"
            />
          </div>
        </div>

        {!search && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {[
              { label: 'Create Community', to: '/onboarding', icon: <Zap className="w-4 h-4" /> },
              { label: 'Explore Communities', to: '/explore', icon: <Users className="w-4 h-4" /> },
              { label: 'AI Moderation', to: '/admin', icon: <Shield className="w-4 h-4" /> },
              { label: 'AI Agents', to: '/ai', icon: <Bot className="w-4 h-4" /> },
              { label: 'Pricing Plans', to: '/pricing', icon: <Package className="w-4 h-4" /> },
              { label: 'Developer API', to: '/developer', icon: <Code className="w-4 h-4" /> },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group text-sm font-bold"
              >
                <span className="text-primary">{link.icon}</span>
                {link.label}
                <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-primary transition-colors ml-auto" />
              </Link>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {filtered.map(section => (
            <div key={section.id} className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
              <button
                onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                className="w-full flex items-center justify-between p-8 hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border", section.bg, section.color)}>
                    {section.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-black text-lg tracking-tight">{section.title}</div>
                    <div className="text-xs text-gray-500 font-bold">{section.articles.length} articles</div>
                  </div>
                </div>
                <motion.div animate={{ rotate: openSection === section.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/10">
                      {section.articles.map(article => (
                        <div key={article.title} className="border-b border-white/5 last:border-0">
                          <button
                            onClick={() => setOpenArticle(openArticle === article.title ? null : article.title)}
                            className="w-full flex items-center justify-between px-8 py-5 hover:bg-white/5 transition-all text-left"
                          >
                            <span className="font-bold text-sm text-gray-200">{article.title}</span>
                            <motion.div animate={{ rotate: openArticle === article.title ? 180 : 0 }}>
                              <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0 ml-4" />
                            </motion.div>
                          </button>

                          <AnimatePresence>
                            {openArticle === article.title && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-8 pb-8">
                                  <div className="p-6 bg-black/30 border border-white/5 rounded-2xl">
                                    {article.content.split('\n').map((line, i) => (
                                      <p key={i} className={cn(
                                        "text-sm leading-relaxed",
                                        line.startsWith('•') ? "text-gray-300 ml-4 my-0.5" : 
                                        line === '' ? "h-3" : "text-gray-400 mb-2"
                                      )}>
                                        {line}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-16 p-10 bg-primary/10 border border-primary/20 rounded-[2rem] text-center">
          <Bot className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-black tracking-tighter mb-2">Still need help?</h3>
          <p className="text-gray-400 font-medium mb-6">
            Use the chat button in the bottom-right corner to ask our AI assistant anything, or report a bug directly.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/contact" className="px-6 py-3 bg-primary rounded-2xl font-bold text-sm hover:scale-105 transition-all flex items-center gap-2">
              Contact Support <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="mailto:support@caas.app" className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2">
              Email Us <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
