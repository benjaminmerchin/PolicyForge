import Link from "next/link";
import { notFound } from "next/navigation";
import { Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AGENTS, resolveAgent, type AgentId, type AgentResolved } from "@/lib/cabinet";
import { supabaseServer, type DebateRow, type TurnRow, type CabinetRow } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function DebateReplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = supabaseServer();

  const [debateRes, turnsRes] = await Promise.all([
    sb.from("debates").select("*").eq("id", id).single(),
    sb.from("turns").select("*").eq("debate_id", id).order("idx", { ascending: true }),
  ]);

  if (debateRes.error || !debateRes.data) {
    notFound();
  }
  const debate = debateRes.data as DebateRow;
  const turns = (turnsRes.data ?? []) as TurnRow[];

  let cabinet: CabinetRow | null = null;
  if (debate.cabinet_id) {
    const { data: c } = await sb
      .from("cabinets")
      .select("*")
      .eq("id", debate.cabinet_id)
      .single();
    if (c) cabinet = c as CabinetRow;
  }

  const decisionColor =
    debate.decision === "approve"
      ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700"
      : debate.decision === "reject"
        ? "border-rose-600/30 bg-rose-500/10 text-rose-700"
        : debate.decision === "amend"
          ? "border-amber-600/30 bg-amber-500/10 text-amber-700"
          : "border-zinc-900/15 bg-white/60 text-zinc-700";

  return (
    <div className="relative min-h-screen bg-[#fafaf7] text-zinc-900">
      <div className="aurora opacity-40" />
      <div className="grain" />

      <header className="relative z-10 border-b border-zinc-900/10 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/feed">
              <Button size="sm" variant="ghost">
                ← All sessions
              </Button>
            </Link>
            <Link href="/parliament">
              <Button size="sm">New debate</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-2xl border border-zinc-900/10 bg-white/70 p-6 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                <span>{debate.bill_code}</span>
                <span className="text-zinc-300">·</span>
                <span>{formatDate(debate.created_at)}</span>
                {cabinet && (
                  <>
                    <span className="text-zinc-300">·</span>
                    <Link
                      href={`/cabinet/${cabinet.id}`}
                      className="text-zinc-700 hover:underline"
                    >
                      {cabinet.name}
                    </Link>
                  </>
                )}
              </div>
              <h1 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
                {debate.bill_title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-zinc-600">{debate.bill_summary}</p>
            </div>
            <Badge variant="outline" className={`shrink-0 ${decisionColor}`}>
              {debate.status === "done"
                ? debate.decision?.toUpperCase() ?? "DONE"
                : debate.status.toUpperCase()}
            </Badge>
          </div>
        </section>

        <section className="mt-8 space-y-4">
          {turns.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-900/15 bg-white/50 p-8 text-center text-sm text-zinc-500">
              No turns recorded.
            </div>
          )}
          {turns.map((t) => {
            const id = t.agent_id as AgentId;
            if (!AGENTS[id]) return null;
            const agent = resolveAgent(id, cabinet?.members ?? null);
            return (
              <article
                key={t.id}
                className="rounded-2xl border border-zinc-900/10 bg-white/70 p-5 backdrop-blur"
              >
                <div className="mb-3 flex items-center gap-3">
                  <Avatar agent={agent} />
                  <div className="flex-1">
                    <div className="font-display text-xl text-zinc-900">{agent.name}</div>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                      {agent.role}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-zinc-900/10 bg-white/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                    {t.intent}
                  </span>
                </div>
                <p
                  className={`whitespace-pre-wrap rounded-xl border-l-2 bg-white/90 p-4 text-sm leading-relaxed text-zinc-800 ${agent.accent.replace("text-", "border-l-").replace("ring-", "")}`}
                >
                  <FormattedText text={t.text} />
                </p>
              </article>
            );
          })}
        </section>

        {debate.status === "done" && debate.counter_proposal && (
          <section className="mt-10 rounded-2xl border border-zinc-900/10 bg-white/70 p-6 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className={`gap-1.5 font-mono text-[11px] uppercase tracking-widest ${decisionColor}`}
              >
                Cabinet verdict
              </Badge>
              <span className="font-display text-3xl text-zinc-900 capitalize">
                Motion: {debate.decision}
              </span>
            </div>

            {debate.headline && (
              <p className="mt-4 font-display text-2xl leading-snug text-zinc-900">
                &ldquo;{debate.headline}&rdquo;
              </p>
            )}

            <div className="mt-5 rounded-xl border border-zinc-900/10 bg-white/80 p-5">
              <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                Counter-proposal
              </div>
              <p className="mt-2 text-zinc-800">{debate.counter_proposal}</p>
            </div>

            {debate.amendments && debate.amendments.length > 0 && (
              <ListBlock
                label="Concrete amendments"
                items={debate.amendments}
                numbered
              />
            )}

            {(debate.winners?.length || debate.losers?.length) && (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {debate.winners && debate.winners.length > 0 && (
                  <StakeholderBox
                    label="Winners"
                    items={debate.winners}
                    tone="border-emerald-600/30 bg-emerald-500/5 text-emerald-800"
                  />
                )}
                {debate.losers && debate.losers.length > 0 && (
                  <StakeholderBox
                    label="Losers"
                    items={debate.losers}
                    tone="border-rose-600/30 bg-rose-500/5 text-rose-800"
                  />
                )}
              </div>
            )}

            {debate.numbers && debate.numbers.length > 0 && (
              <div className="mt-5 rounded-xl border border-zinc-900/10 bg-white/70 p-4">
                <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                  Numbers raised in debate
                </div>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {debate.numbers.map((n, i) => (
                    <li key={i} className="flex items-start gap-2 font-mono text-xs text-zinc-700">
                      <span className="text-zinc-400">→</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {debate.dissent && (
              <div className="mt-5 rounded-xl border border-zinc-900/10 bg-white/60 p-4">
                <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                  Dissent &amp; opposition
                </div>
                <p className="text-sm italic text-zinc-700">{debate.dissent}</p>
              </div>
            )}

            {debate.tradeoffs && debate.tradeoffs.length > 0 && (
              <ListBlock label="Trade-offs" items={debate.tradeoffs} numbered />
            )}
          </section>
        )}

        {debate.status === "error" && (
          <section className="mt-8 rounded-xl border border-rose-600/30 bg-rose-500/5 p-4 text-sm text-rose-700">
            Session ended in error: {debate.error_message ?? "unknown"}
          </section>
        )}
      </main>
    </div>
  );
}

function Avatar({ agent }: { agent: AgentResolved }) {
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-full ring-2 font-display text-sm font-medium ${agent.bg} ${agent.accent}`}
    >
      {agent.initials}
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <span className="whitespace-pre-wrap">
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={li}>
            {parts.map((p, i) =>
              p.startsWith("**") && p.endsWith("**") && p.length > 4 ? (
                <strong key={i} className="font-semibold">
                  {p.slice(2, -2)}
                </strong>
              ) : (
                <span key={i}>{p}</span>
              )
            )}
            {li < lines.length - 1 && "\n"}
          </span>
        );
      })}
    </span>
  );
}

function ListBlock({
  label,
  items,
  numbered,
}: {
  label: string;
  items: string[];
  numbered?: boolean;
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
        {label}
      </div>
      <ul className="space-y-2">
        {items.map((t, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded-lg border border-zinc-900/5 bg-white/70 p-3 text-sm text-zinc-700"
          >
            {numbered && (
              <span className="mt-1 font-mono text-[10px] text-zinc-400">
                {String(i + 1).padStart(2, "0")}
              </span>
            )}
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StakeholderBox({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="mb-2 font-mono text-[11px] uppercase tracking-widest opacity-80">
        {label}
      </div>
      <ul className="space-y-1 text-sm">
        {items.map((s, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="opacity-60">·</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
