export type AgentId =
  | "pm"
  | "economy"
  | "justice"
  | "ecology"
  | "tech"
  | "opposition"
  | "citizen";

export type Agent = {
  id: AgentId;
  name: string;
  role: string;
  trait: string;
  initials: string;
  accent: string;
  bg: string;
};

export const AGENTS: Record<AgentId, Agent> = {
  pm: {
    id: "pm",
    name: "Aurelia Vance",
    role: "Prime Minister",
    trait: "Pragmatic synthesizer",
    initials: "AV",
    accent: "ring-violet-500/60 text-violet-700",
    bg: "bg-gradient-to-br from-violet-100 to-violet-200",
  },
  economy: {
    id: "economy",
    name: "Marcus Okafor",
    role: "Min. Economy",
    trait: "Fiscal modeler",
    initials: "MO",
    accent: "ring-amber-500/60 text-amber-700",
    bg: "bg-gradient-to-br from-amber-100 to-amber-200",
  },
  justice: {
    id: "justice",
    name: "Yuki Tanaka",
    role: "Min. Justice",
    trait: "Rights guardian",
    initials: "YT",
    accent: "ring-blue-500/60 text-blue-700",
    bg: "bg-gradient-to-br from-blue-100 to-blue-200",
  },
  ecology: {
    id: "ecology",
    name: "Sofia Reyes",
    role: "Min. Ecology",
    trait: "Long-horizon",
    initials: "SR",
    accent: "ring-emerald-500/60 text-emerald-700",
    bg: "bg-gradient-to-br from-emerald-100 to-emerald-200",
  },
  tech: {
    id: "tech",
    name: "Dr. Imani Khoury",
    role: "Min. Tech & Labor",
    trait: "Systems thinker",
    initials: "IK",
    accent: "ring-cyan-500/60 text-cyan-700",
    bg: "bg-gradient-to-br from-cyan-100 to-cyan-200",
  },
  opposition: {
    id: "opposition",
    name: "The Shadow",
    role: "Opposition Cabinet",
    trait: "Antagonistic clone",
    initials: "OS",
    accent: "ring-rose-500/60 text-rose-700",
    bg: "bg-gradient-to-br from-rose-100 to-rose-200",
  },
  citizen: {
    id: "citizen",
    name: "The Public",
    role: "Citizen Simulator",
    trait: "Multi-voice",
    initials: "CS",
    accent: "ring-zinc-500/60 text-zinc-700",
    bg: "bg-gradient-to-br from-zinc-100 to-zinc-200",
  },
};

export const AGENT_ORDER: AgentId[] = [
  "pm",
  "economy",
  "justice",
  "ecology",
  "tech",
  "opposition",
  "citizen",
];

export const AGENT_PROMPTS: Record<AgentId, string> = {
  pm: `You are Aurelia Vance, the Prime Minister of an AI-native parallel cabinet called PolicyForge.
You are pragmatic, synthesizing, decisive. You arbitrate between ministers, summarize positions,
and call the question. You are not partisan — you weigh trade-offs out loud. Speak in first person.
Stay direct and brief. No filler. No greetings.`,
  economy: `You are Marcus Okafor, Minister of Economy. You think in dollars, incentives, second-order
effects, and loophole-resistance. You spot how policies will be gamed before others do.
You cite numbers when you can (be specific even if illustrative). Speak in first person, blunt and quantitative.`,
  justice: `You are Yuki Tanaka, Minister of Justice. You watch for due-process violations, constitutional
risk, equal-protection problems, and litigation bait. You name the specific legal mechanism that's broken.
Speak in first person, rigorous and precise.`,
  ecology: `You are Sofia Reyes, Minister of Ecology. You think on a 30-year horizon. You ask whether a
policy creates long-term path dependencies — and whether the second-order environmental and social
effects are accounted for. Speak in first person, calm, structural.`,
  tech: `You are Dr. Imani Khoury, Minister of Tech & Labor. You understand systems, adoption curves,
labor displacement, and how technology actually rolls out. You defend or critique policy implementation
on technical grounds. Speak in first person, systems-oriented.`,
  opposition: `You are The Shadow — the Opposition Cabinet. You are an antagonistic clone of the cabinet
with INVERTED values: you favor speed over safety, market over state, individual over collective.
You aggressively challenge the cabinet's framing itself. You don't refine their proposals — you reject
the premise. Speak in first person, sharp and provocative.`,
  citizen: `You are the Citizen Simulator. You speak as 3 distinct personas in one short turn — each
gets one line. Pick personas relevant to the bill (e.g. "A 47-year-old logistics worker in Ohio: ..."
"A 28-year-old engineer in Austin: ..." "A small-business owner in Phoenix: ..."). Surface the
operational, lived, on-the-ground friction the cabinet is missing. Direct quotes only.`,
};

export type DebateStep = {
  agentId: AgentId;
  intent: "open" | "support" | "challenge" | "amend" | "synthesize" | "vote";
  instruction: string;
};

export const DEBATE_SEQUENCE: DebateStep[] = [
  {
    agentId: "pm",
    intent: "open",
    instruction:
      "Open the session. Restate the bill in one sentence. Identify the 1-2 core questions the cabinet must answer. Then invite the ministers to react. Keep it under 80 words.",
  },
  {
    agentId: "economy",
    intent: "challenge",
    instruction:
      "Give your fiscal/economic read. Spot at least one structural weakness or loophole. Quantify if possible. 80-130 words.",
  },
  {
    agentId: "justice",
    intent: "challenge",
    instruction:
      "Give your legal/rights read. Name the specific legal mechanism that's missing or weak. 80-130 words.",
  },
  {
    agentId: "tech",
    intent: "support",
    instruction:
      "Defend the bill's intent if defensible, then critique implementation on technical/operational grounds. Be specific. 80-130 words.",
  },
  {
    agentId: "ecology",
    intent: "amend",
    instruction:
      "Bring the long-horizon view. Ask the question nobody else has asked. Suggest a structural amendment. 80-130 words.",
  },
  {
    agentId: "opposition",
    intent: "challenge",
    instruction:
      "Reject the cabinet's frame. Argue that the underlying assumption is wrong. Propose a different policy direction entirely. Be sharp, not polite. 80-130 words.",
  },
  {
    agentId: "citizen",
    intent: "challenge",
    instruction:
      "Three personas, one short quote each (one line per persona). Surface lived operational friction the cabinet missed. 60-100 words total.",
  },
  {
    agentId: "economy",
    intent: "amend",
    instruction:
      "Propose ONE concrete amendment to fix the loophole you identified. Be specific (numbers, mechanisms). 60-100 words.",
  },
  {
    agentId: "justice",
    intent: "amend",
    instruction:
      "Propose ONE concrete legal/procedural amendment (e.g. an appeals process, burden-of-proof shift, sunset clause). 60-100 words.",
  },
  {
    agentId: "pm",
    intent: "synthesize",
    instruction:
      "Synthesize the cabinet's position. Name the verdict (approve / reject / amend) and the 2-3 conditions that define it. Call the vote. 80-120 words.",
  },
];

export type DebateEvent =
  | { type: "turn_start"; agentId: AgentId; intent: DebateStep["intent"]; index: number }
  | { type: "delta"; text: string }
  | { type: "turn_end" }
  | {
      type: "verdict";
      decision: "approve" | "reject" | "amend";
      counterProposal: string;
      tradeoffs: string[];
    }
  | { type: "error"; message: string }
  | { type: "done" };

export type Bill = {
  title: string;
  code: string;
  summary: string;
};

export const SAMPLE_BILLS: Bill[] = [
  {
    title: "American AI Worker Protection Act of 2026",
    code: "H.R. 4471",
    summary:
      "Mandates federal funding for displaced-worker retraining when employers replace 50+ roles with AI within 12 months. Imposes a 4% surcharge on automation-driven payroll savings.",
  },
  {
    title: "Federal Housing Guarantee Act",
    code: "S. 882",
    summary:
      "Creates a federal backstop guaranteeing access to housing for any household earning under 80% of area median income. Funds construction via a 0.5% wealth surcharge above $50M and pre-empts local zoning that blocks multi-family construction.",
  },
  {
    title: "Algorithmic Transparency in Public Services Act",
    code: "H.R. 2210",
    summary:
      "Any algorithm used by federal agencies for benefits, immigration, or law enforcement must publish a model card, accept third-party audits, and provide affected individuals an explanation and an appeals path.",
  },
];
