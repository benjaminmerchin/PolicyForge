export type FeatureStatus = "live" | "in_progress" | "planned";
export type Effort = "S" | "M" | "L";
export type Impact = 1 | 2 | 3;

export type Feature = {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  priority: number; // 1 = highest
  effort: Effort;
  impact: Impact;
  category: "core" | "demo" | "data" | "infra";
  notes?: string;
};

export const FEATURES: Feature[] = [
  {
    id: "chat-base",
    title: "Single-agent chat",
    description:
      "Streaming chat with z.ai GLM-5.1 acting as the PolicyForge entity. System prompt sets values, tone, and behavior.",
    status: "live",
    priority: 99,
    effort: "S",
    impact: 1,
    category: "core",
  },
  {
    id: "landing-deck",
    title: "Slide-deck landing page",
    description:
      "6-slide narrative landing (Hero → Problem → Capabilities → Cabinet → Fork → CTA) with scroll-snap, keyboard nav, and aurora design.",
    status: "live",
    priority: 99,
    effort: "M",
    impact: 2,
    category: "demo",
  },
  {
    id: "design-system",
    title: "Brand & design system",
    description:
      "Logo (hexagonal seal + forked branches), Instrument Serif display, light theme, aurora gradient, grain, grid, shadcn primitives.",
    status: "live",
    priority: 99,
    effort: "S",
    impact: 1,
    category: "demo",
  },
  {
    id: "features-page",
    title: "Features tracking page",
    description:
      "This page. Shows what's live, in progress, planned — single source of truth for the build.",
    status: "live",
    priority: 99,
    effort: "S",
    impact: 1,
    category: "infra",
  },
  {
    id: "parliament-ui",
    title: "Parliament UI",
    description:
      "Visual chamber with 7 seats. Each agent has avatar, role, personality. Active speaker is highlighted, speech bubble streams token-by-token.",
    status: "live",
    priority: 99,
    effort: "M",
    impact: 3,
    category: "demo",
    notes: "The money-shot for the pitch — turns 'AI tool' into 'AI political entity'.",
  },
  {
    id: "multi-agent-debate",
    title: "Multi-agent debate engine",
    description:
      "Real 7-agent cabinet (PM, Economy, Justice, Ecology, Tech, Opposition, Citizens) running on z.ai GLM-5.1. 10-turn scripted sequence. Streamed via NDJSON.",
    status: "live",
    priority: 99,
    effort: "M",
    impact: 3,
    category: "core",
  },
  {
    id: "bill-ingestion",
    title: "Bill picker (sample bills)",
    description:
      "Three pre-loaded sample bills (AI Worker Protection, Federal Housing Guarantee, Algorithmic Transparency). One-click swap. Custom paste planned.",
    status: "live",
    priority: 99,
    effort: "S",
    impact: 2,
    category: "data",
  },
  {
    id: "verdict",
    title: "Cabinet vote & verdict",
    description:
      "After debate, structured JSON verdict: decision (approve / reject / amend), counter-proposal, list of trade-offs.",
    status: "live",
    priority: 99,
    effort: "S",
    impact: 2,
    category: "core",
  },
  {
    id: "custom-bill",
    title: "Custom bill paste",
    description:
      "Tabs on /parliament: Samples vs Custom paste. Custom mode accepts any bill title + body and feeds it to the cabinet directly.",
    status: "live",
    priority: 99,
    effort: "S",
    impact: 2,
    category: "data",
  },
  {
    id: "cabinets",
    title: "Cabinet presets + fork mechanism",
    description:
      "10 preset cabinets total: 5 schools of thought (Helios, Hayek, Ostrom, Singapore, Earth) and 5 historical US administrations (Reagan, Clinton, Obama, Trump, Biden) — each historical cabinet seeded with real ministers (Mnuchin, Yellen, Holder, etc.). Custom cabinets forkable from any preset. Lens + members injected into ministers' prompts.",
    status: "live",
    priority: 99,
    effort: "L",
    impact: 3,
    category: "core",
    notes: "Seals 'new species' for the track. Opposition Shadow + Citizen Simulator stay cabinet-agnostic by design.",
  },
  {
    id: "cabinet-pages",
    title: "/cabinet pages (list, detail, new)",
    description:
      "Browse all cabinets, view a cabinet's lens and resolved agent prompts, fork any cabinet, and create new ones from scratch.",
    status: "live",
    priority: 99,
    effort: "M",
    impact: 2,
    category: "demo",
  },
  {
    id: "fork-compare",
    title: "Side-by-side fork debate",
    description:
      "Run the same bill on two cabinets in parallel. Two columns of streaming debate side-by-side. Highlights divergence at the verdict step. Money shot for the demo.",
    status: "planned",
    priority: 1,
    effort: "M",
    impact: 3,
    category: "demo",
    notes: "Highest remaining ROI for the pitch.",
  },
  {
    id: "persistence",
    title: "Debate persistence (Supabase)",
    description:
      "Postgres schema (debates + turns) with RLS. API persists every turn and the verdict. Realtime publication enabled for future cross-user feeds.",
    status: "live",
    priority: 99,
    effort: "M",
    impact: 2,
    category: "infra",
  },
  {
    id: "feed",
    title: "Sessions feed + permalinks",
    description:
      "/feed lists all past debates. /parliament/[id] replays any debate in full with verdict and trade-offs. Shareable URLs.",
    status: "live",
    priority: 99,
    effort: "S",
    impact: 2,
    category: "demo",
  },
  {
    id: "live-feed",
    title: "Realtime live cabinet feed",
    description:
      "Subscribe to Supabase Realtime so the /feed page updates in real time as debates run. Cron job to ingest fresh bills automatically.",
    status: "planned",
    priority: 7,
    effort: "M",
    impact: 2,
    category: "infra",
  },
  {
    id: "citizen-sim",
    title: "Citizen simulator",
    description:
      "5 personas (student, retiree, small-biz owner, immigrant, tech worker) react to the verdict. Surfaces friction the cabinet missed.",
    status: "planned",
    priority: 8,
    effort: "S",
    impact: 1,
    category: "core",
  },
  {
    id: "congress-poll",
    title: "Congress.gov auto-poll",
    description:
      "Pull recent federal bills from Congress.gov API every N minutes. Feeds the live feed.",
    status: "planned",
    priority: 9,
    effort: "M",
    impact: 1,
    category: "data",
  },
];
