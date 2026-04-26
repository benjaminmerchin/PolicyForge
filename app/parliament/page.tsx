"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AGENTS,
  AGENT_ORDER,
  DEBATE_SEQUENCE,
  SAMPLE_BILLS,
  type AgentId,
  type Bill,
  type DebateEvent,
} from "@/lib/cabinet";

type Status = "idle" | "running" | "done" | "error";

type CompletedTurn = {
  index: number;
  agentId: AgentId;
  intent: string;
  text: string;
};

type ActiveTurn = {
  index: number;
  agentId: AgentId;
  intent: string;
  text: string;
};

type Verdict = {
  decision: "approve" | "reject" | "amend";
  counterProposal: string;
  tradeoffs: string[];
};

type DebateEventPayload =
  | DebateEvent
  | { type: "debate_id"; id: string };

export default function ParliamentPage() {
  const [bill, setBill] = useState<Bill>(SAMPLE_BILLS[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [turns, setTurns] = useState<CompletedTurn[]>([]);
  const [active, setActive] = useState<ActiveTurn | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [debateId, setDebateId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const total = DEBATE_SEQUENCE.length;
  const turnIdx = active?.index ?? Math.max(turns.length - 1, 0);
  const progress =
    status === "done"
      ? 100
      : Math.min(100, ((turns.length + (active ? 1 : 0)) / total) * 100);

  const currentAgentId: AgentId | null = active
    ? active.agentId
    : turns.length > 0
      ? turns[turns.length - 1].agentId
      : null;

  const recent = useMemo(() => turns.slice(-4).reverse(), [turns]);

  const startDebate = async (b: Bill) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setBill(b);
    setStatus("running");
    setTurns([]);
    setActive(null);
    setVerdict(null);
    setErrorMsg(null);
    setDebateId(null);

    try {
      const res = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill: b }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let cur: ActiveTurn | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: DebateEventPayload;
          try {
            event = JSON.parse(line) as DebateEventPayload;
          } catch {
            continue;
          }

          if (event.type === "debate_id") {
            setDebateId(event.id);
          } else if (event.type === "turn_start") {
            cur = {
              index: event.index,
              agentId: event.agentId,
              intent: event.intent,
              text: "",
            };
            setActive(cur);
          } else if (event.type === "delta" && cur) {
            cur = { ...cur, text: cur.text + event.text };
            setActive(cur);
          } else if (event.type === "turn_end" && cur) {
            const completed: CompletedTurn = { ...cur };
            setTurns((prev) => [...prev, completed]);
            setActive(null);
            cur = null;
          } else if (event.type === "verdict") {
            setVerdict({
              decision: event.decision,
              counterProposal: event.counterProposal,
              tradeoffs: event.tradeoffs,
            });
          } else if (event.type === "error") {
            setErrorMsg(event.message);
            setStatus("error");
          } else if (event.type === "done") {
            setStatus("done");
          }
        }
      }
      if (status !== "error") setStatus("done");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setErrorMsg(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  };

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fafaf7] text-zinc-900">
      <div className="aurora opacity-40" />
      <div className="grain" />

      <header className="relative z-10 border-b border-zinc-900/10 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/feed">
              <Button size="sm" variant="ghost">
                Sessions
              </Button>
            </Link>
            <Link href="/features">
              <Button size="sm" variant="ghost">
                Features
              </Button>
            </Link>
            <Badge
              variant="outline"
              className={`gap-1.5 font-mono text-[11px] ${
                status === "running"
                  ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700"
                  : status === "error"
                    ? "border-rose-600/30 bg-rose-500/10 text-rose-700"
                    : "border-zinc-900/15 bg-white/60 text-zinc-700"
              }`}
            >
              <span
                className={`relative inline-block h-1.5 w-1.5 rounded-full ${
                  status === "running"
                    ? "bg-emerald-500 live-dot text-emerald-500"
                    : status === "error"
                      ? "bg-rose-500"
                      : "bg-zinc-500"
                }`}
              />
              {status === "running"
                ? "DEBATING"
                : status === "done"
                  ? "VERDICT REACHED"
                  : status === "error"
                    ? "ERROR"
                    : "IDLE"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        {/* Bill banner / picker */}
        <section className="rounded-2xl border border-zinc-900/10 bg-white/70 p-5 backdrop-blur md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                <span>Bill in session</span>
                <span className="text-zinc-300">·</span>
                <span className="text-zinc-700">{bill.code}</span>
              </div>
              <h1 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
                {bill.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-zinc-600">{bill.summary}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                {status === "done"
                  ? "Verdict reached"
                  : `Turn ${String(Math.min(turnIdx + 1, total)).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
              </span>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-zinc-900/10">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 via-rose-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sample bill picker */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              Sample bills:
            </span>
            {SAMPLE_BILLS.map((b) => (
              <button
                key={b.code}
                onClick={() => setBill(b)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  b.code === bill.code
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-900/10 bg-white text-zinc-700 hover:border-zinc-900/30"
                }`}
              >
                {b.code} — {b.title.split(" ").slice(0, 4).join(" ")}…
              </button>
            ))}
            {debateId && status === "done" && (
              <Link href={`/parliament/${debateId}`} className="ml-auto">
                <Button size="sm" variant="ghost">
                  ↗ Permalink
                </Button>
              </Link>
            )}
            <Button
              size="sm"
              onClick={() => startDebate(bill)}
              disabled={status === "running"}
              className={debateId && status === "done" ? "" : "ml-auto"}
            >
              {status === "running"
                ? "Cabinet in session…"
                : status === "done"
                  ? "↻ Re-run debate"
                  : "▶  Start debate"}
            </Button>
          </div>
        </section>

        {errorMsg && (
          <div className="rounded-xl border border-rose-600/30 bg-rose-500/5 p-4 text-sm text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Stage */}
        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-zinc-900/10 bg-white/60 p-8 backdrop-blur">
            <div className="absolute inset-0 grid-bg opacity-50" />

            {!active && !verdict && status === "idle" && (
              <IdleStage onStart={() => startDebate(bill)} />
            )}

            {active && (
              <div className="relative flex flex-col items-start gap-6 motion-fade">
                <SpeakerHeader agentId={active.agentId} intent={active.intent} live />
                <SpeechBubble agentId={active.agentId}>
                  <span className="whitespace-pre-wrap">{active.text}</span>
                  <span className="ml-1 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-zinc-700 align-middle" />
                </SpeechBubble>
              </div>
            )}

            {!active && verdict && (
              <VerdictPanel verdict={verdict} />
            )}

            {!active && !verdict && status === "running" && (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                <span className="font-mono uppercase tracking-widest">
                  Cabinet is convening…
                </span>
              </div>
            )}

            {!active && !verdict && status === "done" && (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                <span className="font-mono uppercase tracking-widest">Session closed.</span>
              </div>
            )}
          </div>

          <aside className="rounded-3xl border border-zinc-900/10 bg-white/60 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                Recent
              </span>
              <span className="font-mono text-[10px] text-zinc-400">
                {turns.length} delivered · {total - turns.length} pending
              </span>
            </div>
            <div className="space-y-3">
              {turns.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-900/10 p-4 text-center text-xs text-zinc-400">
                  No turns yet.
                </div>
              )}
              {recent.map((t) => {
                const a = AGENTS[t.agentId];
                return (
                  <div
                    key={t.index}
                    className="flex gap-3 rounded-lg border border-zinc-900/5 bg-white/70 p-3"
                  >
                    <Avatar agentId={a.id} size="xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-xs font-medium text-zinc-900">
                          {a.role}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                          {t.intent}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-3 text-xs text-zinc-600">{t.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>

        {/* Bench */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              The cabinet
            </span>
            <span className="font-mono text-[11px] text-zinc-400">
              7 agents · 1 government
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {AGENT_ORDER.map((id) => {
              const a = AGENTS[id];
              const isActive = currentAgentId === id && status === "running";
              return (
                <div
                  key={id}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl border p-3 backdrop-blur transition ${
                    isActive
                      ? "border-zinc-900/30 bg-white shadow-lg"
                      : "border-zinc-900/10 bg-white/50"
                  }`}
                >
                  <Avatar agentId={a.id} size="md" active={isActive} />
                  <div className="text-center">
                    <div className="text-xs font-medium text-zinc-900">{a.role}</div>
                    <div className="font-mono text-[10px] text-zinc-500">{a.trait}</div>
                  </div>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function IdleStage({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
        Chamber awaiting motion
      </span>
      <h2 className="font-display text-4xl tracking-tight text-zinc-900">
        Convene the cabinet.
      </h2>
      <p className="max-w-md text-sm text-zinc-600">
        Pick a bill above (or any of yours) and start the debate. The seven agents will
        speak in sequence, in real time.
      </p>
      <Button size="lg" onClick={onStart} className="mt-2">
        ▶  Start debate
      </Button>
    </div>
  );
}

function SpeakerHeader({
  agentId,
  intent,
  live,
}: {
  agentId: AgentId;
  intent: string;
  live?: boolean;
}) {
  const a = AGENTS[agentId];
  return (
    <div className="flex w-full items-center gap-4">
      <Avatar agentId={agentId} size="lg" active />
      <div>
        <div className="font-display text-2xl text-zinc-900">{a.name}</div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          {a.role}
          {live && (
            <span className="ml-2 inline-flex items-center gap-1 text-emerald-700">
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot text-emerald-500" />
              speaking
            </span>
          )}
        </div>
      </div>
      <span className="ml-auto rounded-full border border-zinc-900/10 bg-white/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
        {intent}
      </span>
    </div>
  );
}

function Avatar({
  agentId,
  size = "md",
  active,
}: {
  agentId: AgentId;
  size?: "xs" | "md" | "lg";
  active?: boolean;
}) {
  const a = AGENTS[agentId];
  const sizes = {
    xs: "h-9 w-9 text-[11px]",
    md: "h-12 w-12 text-sm",
    lg: "h-20 w-20 text-2xl",
  };
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full ring-2 font-display font-medium ${sizes[size]} ${a.bg} ${a.accent} ${
        active ? "shadow-xl" : ""
      }`}
    >
      {a.initials}
    </div>
  );
}

function SpeechBubble({
  children,
  agentId,
}: {
  children: React.ReactNode;
  agentId: AgentId;
}) {
  const a = AGENTS[agentId];
  return (
    <div
      className={`relative max-w-3xl rounded-2xl rounded-tl-sm border-l-2 bg-white/90 p-5 text-base leading-relaxed text-zinc-800 shadow-sm backdrop-blur ${a.accent.replace("text-", "border-l-").replace("ring-", "")}`}
    >
      {children}
    </div>
  );
}

function VerdictPanel({ verdict }: { verdict: Verdict }) {
  const decisionColor =
    verdict.decision === "approve"
      ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700"
      : verdict.decision === "reject"
        ? "border-rose-600/30 bg-rose-500/10 text-rose-700"
        : "border-amber-600/30 bg-amber-500/10 text-amber-700";

  return (
    <div className="motion-fade flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          variant="outline"
          className={`gap-1.5 font-mono text-[11px] uppercase tracking-widest ${decisionColor}`}
        >
          Cabinet verdict
        </Badge>
        <span className="font-display text-3xl text-zinc-900 capitalize">
          Motion: {verdict.decision}
        </span>
      </div>
      <div className="rounded-xl border border-zinc-900/10 bg-white/80 p-5">
        <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          Counter-proposal
        </div>
        <p className="mt-2 text-zinc-800">{verdict.counterProposal}</p>
      </div>
      <div>
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          Trade-offs (declared)
        </div>
        <ul className="space-y-2">
          {verdict.tradeoffs.map((t, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-lg border border-zinc-900/5 bg-white/70 p-3 text-sm text-zinc-700"
            >
              <span className="mt-1 font-mono text-[10px] text-zinc-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
