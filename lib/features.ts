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
      "Visual chamber with 5–7 seats. Each agent gets a seat, an avatar, a personality tag. Speech bubbles appear in real time as each agent speaks.",
    status: "planned",
    priority: 1,
    effort: "M",
    impact: 3,
    category: "demo",
    notes: "The money-shot for the pitch — turns 'AI tool' into 'AI political entity'.",
  },
  {
    id: "multi-agent-debate",
    title: "Multi-agent debate engine",
    description:
      "Real cabinet of agents (PM, Economy, Justice, Ecology, Opposition Shadow). They debate in turns, stream in parallel, react to each other.",
    status: "planned",
    priority: 2,
    effort: "M",
    impact: 3,
    category: "core",
  },
  {
    id: "bill-ingestion",
    title: "Bill / law ingestion",
    description:
      "Paste a Congress.gov bill (or any law text) → cabinet runs full debate on it. Source of every session.",
    status: "planned",
    priority: 3,
    effort: "S",
    impact: 2,
    category: "data",
  },
  {
    id: "verdict",
    title: "Cabinet vote & verdict",
    description:
      "After debate, structured output: verdict (approve / reject / amend), counter-proposal text, list of trade-offs with reasoning.",
    status: "planned",
    priority: 4,
    effort: "S",
    impact: 2,
    category: "core",
  },
  {
    id: "fork",
    title: "Fork mechanism",
    description:
      "Cabinet manifesto as JSON (values, biases, priorities). UI sliders to mutate. Forked cabinet runs same bill differently.",
    status: "planned",
    priority: 5,
    effort: "M",
    impact: 3,
    category: "core",
    notes: "The feature that seals 'new species' for the track.",
  },
  {
    id: "fork-compare",
    title: "Fork comparison view",
    description:
      "Two cabinets side-by-side debating the same bill. Highlights where they diverge.",
    status: "planned",
    priority: 6,
    effort: "M",
    impact: 3,
    category: "demo",
  },
  {
    id: "live-feed",
    title: "Live cabinet feed",
    description:
      "Page showing what the cabinet is doing 24/7. Cron job ingests fresh bills, runs debates in background, posts to feed.",
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
