# CaaS — AI Agent Rules (DO NOT CHANGE)

## ⚠️ CRITICAL — Read Before Making Any Changes

This file protects the production stability of CaaS.
Any AI tool or developer MUST follow these rules.

---

## 🔒 Gemini Model — LOCKED
- Model is controlled by `GEMINI_MODEL` environment variable on Vercel
- Default fallback: `gemini-1.5-flash`
- **NEVER hardcode** `gemini-2.0-flash`, `gemini-3.5-flash`, `gemini-flash-latest`, or any other model
- These models either don't exist or are not available on the free tier

## 🔒 API Files — Single Source of Truth
The ONLY valid API handlers are:
```
api/ai/agent.ts       ← AI agent responses
api/ai/moderate.ts    ← content moderation
api/ai/summarize.ts   ← conversation summary
api/ai/persona.ts     ← persona responses
api/health.ts         ← health check
```
**NEVER create or edit:** `api/aiAgent.ts`, `api/aiModerate.ts`, `api/aiSummarize.ts`, `api/aiPersona.ts`
These files are DELETED. Do not recreate them.

## 🔒 vercel.json — DO NOT CHANGE
```json
{
  "functions": {
    "api/ai/agent.ts":     { "maxDuration": 30 },
    "api/ai/moderate.ts":  { "maxDuration": 30 },
    "api/ai/summarize.ts": { "maxDuration": 30 },
    "api/ai/persona.ts":   { "maxDuration": 30 },
    "api/health.ts":       { "maxDuration": 10 }
  },
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```
**NEVER change the rewrites** — changing them breaks all API routes.

## 🔒 GroupChat.tsx — Key Logic Rules
- `isAiRespondingRef` guards against double AI responses — DO NOT REMOVE
- Delete button checks `isMe || permissions.canDeleteMessage || permissions.canDeleteOwnMessage`
- DO NOT add extra AI response triggers

## 🔒 Environment Variables on Vercel
These MUST exist on Vercel for the app to work:
- `GEMINI_API_KEY` — your Google AI Studio API key
- `GEMINI_MODEL` — set to `gemini-1.5-flash`

---

## ✅ Safe to Change
- UI styling, colors, animations
- Page content text
- Adding new pages/routes
- Firebase security rules
- Firestore data structure
