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

export type Database = {
  public: {
    Tables: {
      debates: { Row: DebateRow; Insert: Partial<DebateRow>; Update: Partial<DebateRow> };
      turns: { Row: TurnRow; Insert: Partial<TurnRow>; Update: Partial<TurnRow> };
    };
  };
};

let serverClient: SupabaseClient<Database> | null = null;
let browserClient: SupabaseClient<Database> | null = null;

export function supabaseServer(): SupabaseClient<Database> {
  if (serverClient) return serverClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in env."
    );
  }
  serverClient = createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
  return serverClient;
}

export function supabaseBrowser(): SupabaseClient<Database> {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in env."
    );
  }
  browserClient = createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
  return browserClient;
}
