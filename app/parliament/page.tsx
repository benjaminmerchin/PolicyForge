"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import {
  AGENTS,
  AGENT_ORDER,
  DEBATE_PRESETS,
  SAMPLE_BILLS,
  resolveAgent,
  type AgentId,
  type AgentResolved,
  type Bill,
  type CabinetMembersMap,
  type DebateEvent,
  type DebateLength,
} from "@/lib/cabinet";
import { supabaseBrowser, type CabinetRow } from "@/lib/supabase";

const ACCENT_PILL: Record<string, string> = {
  violet: "border-violet-600/30 bg-violet-500/10 text-violet-700",
  amber: "border-amber-600/30 bg-amber-500/10 text-amber-700",
  emerald: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700",
  cyan: "border-cyan-600/30 bg-cyan-500/10 text-cyan-700",
  lime: "border-lime-600/30 bg-lime-500/10 text-lime-700",
  rose: "border-rose-600/30 bg-rose-500/10 text-rose-700",
  blue: "border-blue-600/30 bg-blue-500/10 text-blue-700",
  zinc: "border-zinc-600/30 bg-zinc-500/10 text-zinc-700",
};

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
  headline: string;
  counterProposal: string;
  amendments: string[];
  winners: string[];
  losers: string[];
  numbers: string[];
  dissent: string | null;
  tradeoffs: string[];
};

type DebateEventPayload =
  | DebateEvent
  | { type: "debate_id"; id: string };

export default function ParliamentPage() {
  return (
    <Suspense fallback={null}>
      <ParliamentInner />
    </Suspense>
  );
}

function ParliamentInner() {
  const search = useSearchParams();
  const requestedCabinetId = search.get("cabinet");

  const [bill, setBill] = useState<Bill>(SAMPLE_BILLS[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [turns, setTurns] = useState<CompletedTurn[]>([]);
  const [active, setActive] = useState<ActiveTurn | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [debateId, setDebateId] = useState<string | null>(null);
  const [mode, setMode] = useState<"samples" | "custom">("samples");
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [cabinets, setCabinets] = useState<CabinetRow[]>([]);
  const [selectedCabinetId, setSelectedCabinetId] = useState<string | null>(null);
  const [activeMembers, setActiveMembers] = useState<CabinetMembersMap | null>(null);
  const [length, setLength] = useState<DebateLength>("standard");
  const [fast, setFast] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load cabinets and resolve selection
  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser()
        .from("cabinets")
        .select("*")
        .order("is_preset", { ascending: false })
        .order("created_at", { ascending: false });
      const list = (data ?? []) as CabinetRow[];
      setCabinets(list);
      if (list.length > 0) {
        const preferred =
          list.find((c) => c.id === requestedCabinetId) ??
          list.find((c) => c.slug === "helios") ??
          list[0];
        setSelectedCabinetId(preferred.id);
      }
    })();
  }, [requestedCabinetId]);

  const selectedCabinet =
    cabinets.find((c) => c.id === selectedCabinetId) ?? null;

  // The picker is the source of truth — the bench should reflect the selected
  // cabinet immediately, even before a debate starts. activeMembers is only a
  // fallback for the rare case where the picker hasn't loaded yet.
  const renderMembers: CabinetMembersMap | null =
    selectedCabinet?.members ?? activeMembers ?? null;

  const resolve = (id: AgentId): AgentResolved => resolveAgent(id, renderMembers);

  const customBill: Bill | null =
    customTitle.trim() && customBody.trim()
      ? {
          title: customTitle.trim(),
          code: customCode.trim() || `CUSTOM-${Date.now().toString(36).toUpperCase().slice(-6)}`,
          summary: customBody.trim(),
        }
      : null;

  const activeBill: Bill = mode === "custom" && customBill ? customBill : bill;

  const total = DEBATE_PRESETS[length].sequence.length;
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
    setActiveMembers(null);

    try {
      const res = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bill: b,
          cabinetId: selectedCabinetId,
          length,
          speed: fast ? "fast" : "quality",
        }),
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
          } else if (event.type === "cabinet") {
            setActiveMembers(event.members);
          } else if (event.type === "turn_start") {
            cur = {
              index: event.index,
              agentId: event.agentId,
              intent: event.intent,
              text: "",
            };
            setActive(cur);
          } else if (event.type === "delta" && cur) {
            const c: ActiveTurn = cur;
            const next: ActiveTurn = { ...c, text: c.text + event.text };
            cur = next;
            setActive(next);
          } else if (event.type === "turn_end" && cur) {
            const completed: CompletedTurn = { ...(cur as ActiveTurn) };
            setTurns((prev) => [...prev, completed]);
            setActive(null);
            cur = null;
          } else if (event.type === "verdict") {
            setVerdict({
              decision: event.decision,
              headline: event.headline,
              counterProposal: event.counterProposal,
              amendments: event.amendments,
              winners: event.winners,
              losers: event.losers,
              numbers: event.numbers,
              dissent: event.dissent,
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
            <Link href="/cabinet">
              <Button size="sm" variant="ghost">
                Cabinet
              </Button>
            </Link>
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
                <span className="text-zinc-700">{activeBill.code}</span>
              </div>
              <h1 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
                {activeBill.title}
              </h1>
              <p className="mt-2 line-clamp-3 max-w-3xl text-sm text-zinc-600">
                {activeBill.summary}
              </p>
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

          {/* Mode tabs */}
          <div className="mt-5 flex items-center gap-1 rounded-full border border-zinc-900/10 bg-zinc-900/[0.03] p-1 self-start w-fit">
            <button
              onClick={() => setMode("samples")}
              disabled={status === "running"}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                mode === "samples"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Samples
            </button>
            <button
              onClick={() => setMode("custom")}
              disabled={status === "running"}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                mode === "custom"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Custom paste
            </button>
          </div>

          {mode === "samples" && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {SAMPLE_BILLS.map((b) => (
                <button
                  key={b.code}
                  onClick={() => setBill(b)}
                  disabled={status === "running"}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    b.code === bill.code
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-900/10 bg-white text-zinc-700 hover:border-zinc-900/30"
                  }`}
                >
                  {b.code} — {b.title.split(" ").slice(0, 4).join(" ")}…
                </button>
              ))}
            </div>
          )}

          {mode === "custom" && (
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                <input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Bill title (e.g. American Workforce AI Act)"
                  disabled={status === "running"}
                  className="rounded-lg border border-zinc-900/10 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900/30 disabled:opacity-50"
                />
                <input
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="Code (optional)"
                  disabled={status === "running"}
                  className="rounded-lg border border-zinc-900/10 bg-white px-3 py-2 font-mono text-xs outline-none placeholder:text-zinc-400 focus:border-zinc-900/30 disabled:opacity-50"
                />
              </div>
              <textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="Paste the bill text or summary here. The cabinet will debate whatever you paste — full text, abstract, or even a one-line policy proposal."
                disabled={status === "running"}
                rows={6}
                className="resize-y rounded-lg border border-zinc-900/10 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900/30 disabled:opacity-50"
              />
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span className="font-mono">
                  {customBody.length.toLocaleString()} chars
                </span>
                {!customBill && (
                  <span className="font-mono uppercase tracking-widest text-zinc-400">
                    title and body required
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Cabinet picker */}
          <div className="mt-5 border-t border-zinc-900/10 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                Cabinet in session
              </span>
              <Link
                href="/cabinet"
                className="font-mono text-[11px] text-zinc-500 hover:text-zinc-800"
              >
                Manage cabinets ↗
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {cabinets.length === 0 && (
                <span className="text-xs text-zinc-400">Loading cabinets…</span>
              )}
              {cabinets.map((c) => {
                const accent = ACCENT_PILL[c.accent] ?? ACCENT_PILL.violet;
                const selected = c.id === selectedCabinetId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCabinetId(c.id)}
                    disabled={status === "running"}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                      selected
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : `${accent} hover:opacity-80`
                    }`}
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.tagline && (
                      <span className="opacity-70">— {c.tagline}</span>
                    )}
                    {!c.is_preset && (
                      <span className="opacity-70">(forked)</span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedCabinet?.description && (
              <p className="mt-2 text-xs text-zinc-500 italic">
                {selectedCabinet.description}
              </p>
            )}
          </div>

          {/* Length picker + Action row */}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-zinc-900/10 pt-4">
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              Debate length
            </span>
            <div className="flex items-center gap-1 rounded-full border border-zinc-900/10 bg-zinc-900/[0.03] p-1">
              {(["quick", "standard", "deep"] as DebateLength[]).map((l) => {
                const preset = DEBATE_PRESETS[l];
                const selected = length === l;
                return (
                  <button
                    key={l}
                    onClick={() => setLength(l)}
                    disabled={status === "running"}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      selected
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                    title={`${preset.sequence.length} turns · ~${formatEta(preset.etaSeconds)}${preset.warning ? ` — ${preset.warning}` : ""}`}
                  >
                    {preset.label}{" "}
                    <span className="opacity-60">
                      ({preset.sequence.length})
                    </span>
                  </button>
                );
              })}
            </div>
            <span className="font-mono text-[11px] text-zinc-400">
              ~{formatEta(Math.round(DEBATE_PRESETS[length].etaSeconds * (fast ? 0.4 : 1)))}
            </span>

            <button
              onClick={() => setFast((f) => !f)}
              disabled={status === "running"}
              title="Switches the model to GLM-5-Turbo — much faster, slightly less reasoning depth"
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                fast
                  ? "border-amber-600/40 bg-amber-500/10 text-amber-700"
                  : "border-zinc-900/10 bg-white text-zinc-600 hover:border-zinc-900/20"
              }`}
            >
              ⚡ Fast {fast && <span className="opacity-60">(GLM-5-Turbo)</span>}
            </button>

            {DEBATE_PRESETS[length].warning && !fast && (
              <span className="font-mono text-[11px] text-amber-700">
                ⚠ {DEBATE_PRESETS[length].warning}
              </span>
            )}

            {debateId && status === "done" && (
              <Link href={`/parliament/${debateId}`} className="ml-auto">
                <Button size="sm" variant="ghost">
                  ↗ Permalink
                </Button>
              </Link>
            )}
            <Button
              size="sm"
              onClick={() => startDebate(activeBill)}
              disabled={
                status === "running" ||
                (mode === "custom" && !customBill) ||
                cabinets.length === 0
              }
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
                <SpeakerHeader agent={resolve(active.agentId)} intent={active.intent} live />
                <SpeechBubble agent={resolve(active.agentId)}>
                  <FormattedText text={active.text} />
                  <span className="ml-1 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-zinc-700 align-middle" />
                </SpeechBubble>
              </div>
            )}

            {!active && verdict && (
              <div className="space-y-5">
                <VerdictPanel verdict={verdict} />
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-900/10 pt-4">
                  {debateId && (
                    <Link href={`/parliament/${debateId}`}>
                      <Button size="sm" variant="ghost">
                        ↗ Permalink
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="sm"
                    onClick={() => startDebate(activeBill)}
                    disabled={status === "running"}
                  >
                    ↻ Re-run debate
                  </Button>
                </div>
              </div>
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

          <aside className="flex max-h-[640px] flex-col rounded-3xl border border-zinc-900/10 bg-white/60 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                Transcript
              </span>
              <span className="font-mono text-[10px] text-zinc-400">
                {turns.length} delivered · {Math.max(total - turns.length, 0)} pending
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {turns.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-900/10 p-4 text-center text-xs text-zinc-400">
                  No turns yet.
                </div>
              )}
              {[...turns].reverse().map((t) => {
                const a = resolve(t.agentId);
                return (
                  <div
                    key={t.index}
                    className="flex gap-3 rounded-lg border border-zinc-900/5 bg-white/70 p-3"
                  >
                    <Avatar agent={a} size="xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-xs font-medium text-zinc-900">
                          {a.isOverridden ? a.name : a.role}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                          {t.intent}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-3 text-xs text-zinc-600">
                        <FormattedText text={t.text} />
                      </p>
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
              const a = resolve(id);
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
                  <Avatar agent={a} size="md" active={isActive} />
                  <div className="text-center">
                    <div className="truncate text-xs font-medium text-zinc-900" title={a.name}>
                      {a.isOverridden ? a.name : a.role}
                    </div>
                    <div className="truncate font-mono text-[10px] text-zinc-500" title={a.role}>
                      {a.isOverridden ? a.role : a.trait}
                    </div>
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
  agent,
  intent,
  live,
}: {
  agent: AgentResolved;
  intent: string;
  live?: boolean;
}) {
  return (
    <div className="flex w-full items-center gap-4">
      <Avatar agent={agent} size="lg" active />
      <div>
        <div className="font-display text-2xl text-zinc-900">{agent.name}</div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          {agent.role}
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
  agent,
  size = "md",
  active,
}: {
  agent: AgentResolved;
  size?: "xs" | "md" | "lg";
  active?: boolean;
}) {
  const sizes = {
    xs: "h-9 w-9 text-[11px]",
    md: "h-12 w-12 text-sm",
    lg: "h-20 w-20 text-2xl",
  };
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full ring-2 font-display font-medium ${sizes[size]} ${agent.bg} ${agent.accent} ${
        active ? "shadow-xl" : ""
      }`}
    >
      {agent.initials}
    </div>
  );
}

function SpeechBubble({
  children,
  agent,
}: {
  children: React.ReactNode;
  agent: AgentResolved;
}) {
  return (
    <div
      className={`relative w-full max-w-3xl rounded-2xl rounded-tl-sm border-l-2 bg-white/90 p-5 text-base leading-relaxed text-zinc-800 shadow-sm backdrop-blur min-h-[120px] ${agent.accent.replace("text-", "border-l-").replace("ring-", "")}`}
    >
      {children}
    </div>
  );
}

function formatEta(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m} min ${s}s`;
}

function VerdictPanel({ verdict }: { verdict: Verdict }) {
  return <VerdictView v={verdict} />;
}

/**
 * Light markdown renderer: handles **bold** and preserves line breaks.
 * Avoids pulling a full markdown parser for one feature.
 */
function FormattedText({ text }: { text: string }) {
  // Split by lines first, then by bold markers, render strong elements.
  const lines = text.split("\n");
  return (
    <span className="whitespace-pre-wrap">
      {lines.map((line, li) => (
        <span key={li}>
          {renderInlineBold(line)}
          {li < lines.length - 1 && "\n"}
        </span>
      ))}
    </span>
  );
}

function renderInlineBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      return (
        <strong key={i} className="font-semibold">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

function VerdictView({
  v,
}: {
  v: {
    decision: "approve" | "reject" | "amend";
    headline: string;
    counterProposal: string;
    amendments: string[];
    winners: string[];
    losers: string[];
    numbers: string[];
    dissent: string | null;
    tradeoffs: string[];
  };
}) {
  const decisionColor =
    v.decision === "approve"
      ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700"
      : v.decision === "reject"
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
          Motion: {v.decision}
        </span>
      </div>

      {v.headline && (
        <p className="font-display text-2xl leading-snug text-zinc-900">
          &ldquo;{v.headline}&rdquo;
        </p>
      )}

      <div className="rounded-xl border border-zinc-900/10 bg-white/80 p-5">
        <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          Counter-proposal
        </div>
        <p className="mt-2 text-zinc-800">{v.counterProposal}</p>
      </div>

      {v.amendments.length > 0 && (
        <VerdictList
          label="Concrete amendments"
          items={v.amendments}
          numbered
        />
      )}

      {(v.winners.length > 0 || v.losers.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {v.winners.length > 0 && (
            <StakeholderBox
              label="Winners"
              items={v.winners}
              tone="border-emerald-600/30 bg-emerald-500/5 text-emerald-800"
            />
          )}
          {v.losers.length > 0 && (
            <StakeholderBox
              label="Losers"
              items={v.losers}
              tone="border-rose-600/30 bg-rose-500/5 text-rose-800"
            />
          )}
        </div>
      )}

      {v.numbers.length > 0 && (
        <div className="rounded-xl border border-zinc-900/10 bg-white/70 p-4">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Numbers raised in debate
          </div>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {v.numbers.map((n, i) => (
              <li
                key={i}
                className="flex items-start gap-2 font-mono text-xs text-zinc-700"
              >
                <span className="text-zinc-400">→</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {v.dissent && (
        <div className="rounded-xl border border-zinc-900/10 bg-white/60 p-4">
          <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Dissent &amp; opposition
          </div>
          <p className="text-sm italic text-zinc-700">{v.dissent}</p>
        </div>
      )}

      {v.tradeoffs.length > 0 && (
        <VerdictList label="Trade-offs (declared)" items={v.tradeoffs} numbered />
      )}
    </div>
  );
}

function VerdictList({
  label,
  items,
  numbered,
}: {
  label: string;
  items: string[];
  numbered?: boolean;
}) {
  return (
    <div>
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
