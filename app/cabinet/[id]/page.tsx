import Link from "next/link";
import { notFound } from "next/navigation";
import { Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AGENT_ORDER,
  AGENT_PROMPTS,
  buildAgentSystemPrompt,
  resolveAgent,
  type AgentId,
  type AgentResolved,
} from "@/lib/cabinet";
import { supabaseServer, type CabinetRow } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ACCENT_CLASSES: Record<string, string> = {
  violet: "border-violet-600/30 bg-violet-500/10 text-violet-700",
  amber: "border-amber-600/30 bg-amber-500/10 text-amber-700",
  emerald: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700",
  cyan: "border-cyan-600/30 bg-cyan-500/10 text-cyan-700",
  lime: "border-lime-600/30 bg-lime-500/10 text-lime-700",
  rose: "border-rose-600/30 bg-rose-500/10 text-rose-700",
  blue: "border-blue-600/30 bg-blue-500/10 text-blue-700",
  zinc: "border-zinc-600/30 bg-zinc-500/10 text-zinc-700",
};

export default async function CabinetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = supabaseServer();

  const { data, error } = await sb
    .from("cabinets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  const cabinet = data as CabinetRow;

  let parent: CabinetRow | null = null;
  if (cabinet.parent_id) {
    const { data: p } = await sb
      .from("cabinets")
      .select("*")
      .eq("id", cabinet.parent_id)
      .single();
    if (p) parent = p as CabinetRow;
  }

  const accent = ACCENT_CLASSES[cabinet.accent] ?? ACCENT_CLASSES.violet;

  return (
    <div className="relative min-h-screen bg-[#fafaf7] text-zinc-900">
      <div className="aurora opacity-50" />
      <div className="grain" />

      <header className="relative z-10 border-b border-zinc-900/10 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/cabinet">
              <Button size="sm" variant="ghost">
                ← All cabinets
              </Button>
            </Link>
            <Link href={`/parliament?cabinet=${cabinet.id}`}>
              <Button size="sm">Convene this cabinet →</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-2xl border border-zinc-900/10 bg-white/70 p-6 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge variant="outline" className={accent}>
                {cabinet.is_preset
                  ? cabinet.category === "historical"
                    ? "HISTORICAL"
                    : "PRESET"
                  : "FORKED"}
              </Badge>
              <h1 className="mt-3 font-display text-4xl tracking-tight md:text-5xl">
                {cabinet.name}
              </h1>
              {cabinet.tagline && (
                <p className="mt-1 text-lg text-zinc-600">{cabinet.tagline}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                cabinet.{cabinet.slug}
              </span>
              {parent && (
                <Link
                  href={`/cabinet/${parent.id}`}
                  className="font-mono text-[11px] text-zinc-500 hover:text-zinc-800"
                >
                  fork of {parent.name} ↗
                </Link>
              )}
            </div>
          </div>
          {cabinet.description && (
            <p className="mt-5 max-w-3xl text-zinc-700">{cabinet.description}</p>
          )}
          <div className="mt-6 rounded-xl border border-zinc-900/10 bg-zinc-950 p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              Cabinet lens — injected into ministers' system prompts
            </div>
            <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-zinc-200">
{cabinet.lens}
            </pre>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link href={`/cabinet/new?fork=${cabinet.id}`}>
              <Button size="sm" variant="ghost">
                ⑂ Fork this cabinet
              </Button>
            </Link>
            <Link href={`/parliament?cabinet=${cabinet.id}`} className="ml-auto">
              <Button size="sm">Convene on a bill →</Button>
            </Link>
          </div>
        </section>

        <section className="mt-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Agents under this cabinet
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-tight">
            Seven voices, one lens.
          </h2>
          <div className="mt-5 grid gap-3">
            {AGENT_ORDER.map((id) => (
              <AgentRow
                key={id}
                agent={resolveAgent(id, cabinet.members ?? null)}
                resolvedPrompt={buildAgentSystemPrompt(id, cabinet.lens, cabinet.members ?? null)}
                hasLens={!isLensAgnostic(id)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function isLensAgnostic(id: AgentId) {
  return id === "opposition" || id === "citizen";
}

function AgentRow({
  agent,
  resolvedPrompt,
  hasLens,
}: {
  agent: AgentResolved;
  resolvedPrompt: string;
  hasLens: boolean;
}) {
  return (
    <article
      id={agent.id}
      className="rounded-2xl border border-zinc-900/10 bg-white/70 p-5 backdrop-blur"
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-2 font-display text-sm font-medium ${agent.bg} ${agent.accent}`}
        >
          {agent.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="font-display text-xl text-zinc-900">{agent.name}</h3>
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              {agent.role}
            </span>
            {agent.isOverridden && (
              <span className="rounded-full border border-zinc-900/10 bg-white/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-zinc-700">
                Real member
              </span>
            )}
            {!hasLens && (
              <span className="rounded-full border border-zinc-900/10 bg-white/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                Cabinet-agnostic
              </span>
            )}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600">
            {agent.values.map((v) => (
              <li key={v} className="before:mr-1 before:content-['·']">
                {v}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <details className="mt-4 group">
        <summary className="flex cursor-pointer items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500 hover:text-zinc-800">
          <span className="transition group-open:rotate-90">▸</span>
          {hasLens ? "View resolved system prompt (lens applied)" : "View system prompt"}
        </summary>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-zinc-900/10 bg-zinc-950 p-4 font-mono text-[12px] leading-relaxed text-zinc-200 whitespace-pre-wrap">
{resolvedPrompt}
        </pre>
      </details>
    </article>
  );
}

// Preserve old behaviour even if AGENT_PROMPTS changes shape
void AGENT_PROMPTS;
