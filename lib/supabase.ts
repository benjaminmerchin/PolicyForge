import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type DebateRow = {
  id: string;
  bill_code: string;
  bill_title: string;
  bill_summary: string;
  status: "running" | "done" | "error";
  decision: "approve" | "reject" | "amend" | null;
  counter_proposal: string | null;
  tradeoffs: string[] | null;
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
  cabinet_id: string | null;
};

export type CabinetMemberOverride = {
  name: string;
  title: string;
  initials: string;
};

export type CabinetMembers = {
  [agentId: string]: CabinetMemberOverride | undefined;
};

export type CabinetRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  lens: string;
  parent_id: string | null;
  is_preset: boolean;
  accent: string;
  category: "school" | "historical" | string;
  members: CabinetMembers | null;
  created_at: string;
};

export type TurnRow = {
  id: string;
  debate_id: string;
  idx: number;
  agent_id: string;
  intent: string;
  text: string;
  created_at: string;
};

export type DebateInsert = {
  bill_code: string;
  bill_title: string;
  bill_summary: string;
  status?: "running" | "done" | "error";
  decision?: "approve" | "reject" | "amend" | null;
  counter_proposal?: string | null;
  tradeoffs?: string[] | null;
  error_message?: string | null;
  finished_at?: string | null;
};

export type DebateUpdate = Partial<DebateInsert>;

export type TurnInsert = {
  debate_id: string;
  idx: number;
  agent_id: string;
  intent: string;
  text: string;
};

// Untyped client — we cast at call sites for safety. Avoids brittle generated-type
// scaffolding for a hackathon project.
let serverClient: SupabaseClient | null = null;
let browserClient: SupabaseClient | null = null;

export function supabaseServer(): SupabaseClient {
  if (serverClient) return serverClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in env."
    );
  }
  serverClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return serverClient;
}

export function supabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in env."
    );
  }
  browserClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return browserClient;
}
