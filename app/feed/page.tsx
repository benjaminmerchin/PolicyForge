import Link from "next/link";
import { Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabaseServer, type DebateRow, type CabinetRow } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("debates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  const debates = (data ?? []) as DebateRow[];

  // Resolve cabinet names in a single round-trip
  const cabinetIds = Array.from(
    new Set(debates.map((d) => d.cabinet_id).filter((x): x is string => Boolean(x)))
  );
  let cabinetMap = new Map<string, CabinetRow>();
  if (cabinetIds.length > 0) {
    const { data: cabs } = await sb
      .from("cabinets")
      .select("*")
      .in("id", cabinetIds);
    cabinetMap = new Map(((cabs ?? []) as CabinetRow[]).map((c) => [c.id, c]));
  }

  return (
    <div className="relative min-h-screen bg-[#fafaf7] text-zinc-900">
      <div className="aurora opacity-50" />
      <div className="grain" />

      <header className="relative z-10 border-b border-zinc-900/10 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/features">
              <Button size="sm" variant="ghost">
                Features
              </Button>
            </Link>
            <Link href="/parliament">
              <Button size="sm">New debate →</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Cabinet record
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight md:text-6xl">
            Sessions
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-600">
            Every debate the cabinet has held. Click any session to replay it in full.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-600/30 bg-rose-500/5 p-4 text-sm text-rose-700">
            {error.message}
          </div>
        )}

        {!error && debates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-900/15 bg-white/40 p-12 text-center backdrop-blur">
            <p className="font-display text-2xl text-zinc-700">No sessions yet.</p>
            <p className="mt-2 text-sm text-zinc-500">
              The cabinet hasn&apos;t convened. Open a debate.
            </p>
            <Link href="/parliament" className="mt-6 inline-block">
              <Button size="lg">Convene the cabinet →</Button>
            </Link>
          </div>
        )}

        <div className="grid gap-3">
          {debates.map((d) => {
            const decisionColor =
              d.decision === "approve"
                ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700"
                : d.decision === "reject"
                  ? "border-rose-600/30 bg-rose-500/10 text-rose-700"
                  : d.decision === "amend"
                    ? "border-amber-600/30 bg-amber-500/10 text-amber-700"
                    : "border-zinc-900/15 bg-white/60 text-zinc-700";
            const statusLabel =
              d.status === "done"
                ? d.decision?.toUpperCase() ?? "DONE"
                : d.status === "running"
                  ? "RUNNING"
                  : "ERROR";
            const cab = d.cabinet_id ? cabinetMap.get(d.cabinet_id) : null;
            return (
              <Link
                key={d.id}
                href={`/parliament/${d.id}`}
                className="group rounded-2xl border border-zinc-900/10 bg-white/70 p-5 backdrop-blur transition hover:border-zinc-900/25 hover:bg-white/90"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                      <span>{d.bill_code}</span>
                      <span className="text-zinc-300">·</span>
                      <span>{formatDate(d.created_at)}</span>
                      {cab && (
                        <>
                          <span className="text-zinc-300">·</span>
                          <span className="text-zinc-700">{cab.name}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-1 font-display text-2xl text-zinc-900 group-hover:underline">
                      {d.bill_title}
                    </div>
                    {d.headline ? (
                      <p className="mt-2 line-clamp-2 text-sm italic text-zinc-700">
                        &ldquo;{d.headline}&rdquo;
                      </p>
                    ) : (
                      d.counter_proposal && (
                        <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                          {d.counter_proposal}
                        </p>
                      )
                    )}
                  </div>
                  <Badge variant="outline" className={`shrink-0 ${decisionColor}`}>
                    {statusLabel}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
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
