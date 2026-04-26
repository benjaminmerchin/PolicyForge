# PolicyForge

> *An AI-native political entity that audits, explains, and rewrites public policy in real time — and lets anyone fork their own counter-cabinet.*

**BETA Hackathon · Track 1 — AI Native × New Species**

PolicyForge isn't an AI tool that helps governments. It is a **parallel government** — a multi-agent cabinet that never sleeps, debates in public, and can be forked, mutated, and run in variants by anyone. The disagreements between forks become the content.

---

## The problem (Utility & Impact)

Modern policy moves at the speed of committees. Reality moves at the speed of compute.

- The average federal bill is debated for **14 months**.
- Public reading rate of legislation is **under 2%**.
- Lobbyists submit **thousands** of amendments. Citizens submit zero.
- No continuous, independent audit of policy exists in real time.

Voters can't read the law. Journalists can't cover every clause. Lawmakers themselves often don't read what they vote on. The accountability layer is missing — and humans alone can't fill it at the volume and speed required.

**PolicyForge fills the gap.** A continuously-running AI cabinet ingests legislation as it's published, debates it across multiple ideological perspectives, surfaces trade-offs in plain language, and proposes concrete amendments — with reasoning visible to anyone.

It is useful today (paste any bill, get a structured audit), and structurally adoptable tomorrow (newsrooms, NGOs, citizen-watchdog orgs, civic-tech, education).

---

## The new species (Creativity & Innovation)

The standard AI-policy app is a chatbot or a dashboard. PolicyForge is neither.

It's an **entity** — with these properties that no human institution can have:

| Property | What makes it new |
|---|---|
| **Always in session** | The cabinet runs 24/7. By the time you read this, it has audited the latest bills and posted verdicts. |
| **Multi-voice** | Seven agents (PM, Economy, Justice, Ecology, Opposition Shadow, Citizen Simulator, Explainer) — each with explicit values, biases, and tone. They argue with each other, not with you. |
| **Forkable** | The cabinet is a JSON manifesto: `{ values, biases, priorities }`. Clone it, mutate a slider, and your variant goes live and starts disagreeing with the original. |
| **Transparent biases** | Most political actors hide their values. PolicyForge declares them as code. Disagreement is auditable. |
| **Disagreement-as-content** | Two forks debating the same bill side-by-side is the artifact. The friction *is* the product. |

This is not "AI helping democracy." This is a new kind of political actor — one that exists because of AI, not in spite of it.

---

## Architecture & technical execution (Quality & Technical Strength)

### Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + Turbopack | Streaming, RSC, fastest scaffold |
| Styling | Tailwind 4 + shadcn/ui | Composable design system, dark/light tokens |
| Typography | Instrument Serif (display) + Geist Sans + Geist Mono | Editorial feel for a "political entity" |
| LLM | **z.ai GLM-5.1** via OpenAI-compatible client | Strong reasoning, cost-efficient for multi-agent loops |
| AI orchestration | Vercel AI SDK (`streamText`, `useChat`) | Native streaming, multi-agent friendly |
| Multi-agent core | Custom TypeScript debate loop *(in progress)* | Avoids framework bloat for a 48h hack |
| Persistence | Postgres + Supabase Realtime *(planned)* | Forks, debate history, public feed |
| Vector store | pgvector inside Supabase *(planned)* | Bill chunking and retrieval |
| Cron | Vercel Cron / Inngest *(planned)* | Drives the "always-in-session" loop |

### High-level system

```
                ┌────────────────────────────────────────────────┐
                │  UI: Landing deck · Parliament · Chat · Forks  │
                └────────────────────────────────────────────────┘
                                       │
                ┌────────────────────────────────────────────────┐
                │  Orchestrator (TS) — routes turns between      │
                │  agents, streams to UI, writes to history      │
                └────────────────────────────────────────────────┘
                          │            │            │
                ┌──────────────┐  ┌─────────────┐  ┌──────────────┐
                │ Cabinet x N  │  │ Opposition  │  │  Citizen     │
                │ (PM + 3 mins)│  │  Shadow     │  │  Simulator   │
                └──────────────┘  └─────────────┘  └──────────────┘
                          │            │            │
                ┌────────────────────────────────────────────────┐
                │  Knowledge: bill corpus · vector store ·       │
                │  manifesto JSONs (one per fork)                │
                └────────────────────────────────────────────────┘
```

### What's built

- Streaming single-agent chat at `/chat`
- 6-slide narrative landing at `/`
- Build tracker at `/features` (driven by `lib/features.ts`)
- Brand system: SVG logo, aurora gradient, light theme

### What's next (priority order)

See `/features` in the running app, or `lib/features.ts`. Top of the queue:

1. **Parliament UI** — visual chamber, agent seats, real-time speech bubbles
2. **Multi-agent debate engine** — cabinet of 5–7 agents debating in turns, streaming in parallel
3. **Bill ingestion** — paste any text or fetch from Congress.gov API
4. **Cabinet vote & verdict** — structured output (verdict + counter-proposal + trade-offs)
5. **Fork mechanism** — manifesto JSON, slider UI, side-by-side fork comparison

---

## Presentation

The product **is** the pitch. The slide-deck landing is the narrative. The Parliament view is the demo. The fork feature is the closer.

### Demo flow (60-90 seconds)

1. Open the landing — the slide deck explains the species in 30 seconds.
2. Paste a recent bill (e.g. a Congress.gov AI bill) into the chamber.
3. Watch the cabinet debate it live, in parallel speech bubbles.
4. See the verdict and counter-proposal.
5. Click "Fork" → mutate the values to libertarian → watch the same bill produce a completely different verdict.

The pitch line:
> *We launched a parallel government that doesn't sleep. Here's what it has decided since the start of this presentation.*

---

## Run locally

```bash
# 1. Clone and install
npm install

# 2. Copy env template and add your z.ai API key
cp .env.local.example .env.local
# edit .env.local — set ZAI_API_KEY

# 3. Start dev server
npm run dev
```

Open http://localhost:3000.

### Routes

| Route | What |
|---|---|
| `/` | Slide-deck landing |
| `/chat` | Direct conversation with the cabinet |
| `/features` | Build tracker — what's shipped, what's planned |
| `/api/chat` | Streaming chat endpoint |

### Environment

```bash
ZAI_API_KEY=your_z_ai_key
ZAI_MODEL=glm-5.1   # default
```

The client uses `https://api.z.ai/api/paas/v4` (OpenAI-compatible).

---

## Project structure

```
app/
  page.tsx              # Slide-deck landing
  chat/page.tsx         # Cabinet chat
  features/page.tsx     # Build tracker (reads lib/features.ts)
  api/chat/route.ts     # Streaming chat route
components/
  logo.tsx              # SVG logo + wordmark
  ui/                   # shadcn primitives
lib/
  zai.ts                # z.ai OpenAI-compatible client
  features.ts           # Single source of truth for the build
  utils.ts
```

---

## Credits

Built for **BETA Hackathon (San Francisco)**, Track 1 — *AI Native × New Species*.
The track brief: *"Build something that couldn't exist before AI, and let it take on a life of its own."*

PolicyForge couldn't exist without AI. And it doesn't sleep.
