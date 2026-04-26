import Link from "next/link";
import { Wordmark } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FEATURES, type Feature, type FeatureStatus } from "@/lib/features";

const STATUS_META: Record<
  FeatureStatus,
  { label: string; pillClass: string; emoji: string }
> = {
  live: {
    label: "Live",
    pillClass: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700",
    emoji: "●",
  },
  in_progress: {
    label: "In progress",
    pillClass: "border-amber-600/30 bg-amber-500/10 text-amber-700",
    emoji: "◐",
  },
  planned: {
    label: "Planned",
    pillClass: "border-zinc-900/15 bg-white/60 text-zinc-700",
    emoji: "○",
  },
};

const CATEGORY_LABEL: Record<Feature["category"], string> = {
  core: "core",
  demo: "demo",
  data: "data",
  infra: "infra",
};

export default function FeaturesPage() {
  const live = FEATURES.filter((f) => f.status === "live");
  const inProgress = FEATURES.filter((f) => f.status === "in_progress");
  const planned = FEATURES.filter((f) => f.status === "planned").sort(
    (a, b) => a.priority - b.priority
  );

  const total = FEATURES.length;
  const done = live.length;
  const pct = Math.round((done / total) * 100);

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
            <Link href="/chat">
              <Button size="sm">Address the cabinet →</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              Build tracker
            </p>
            <h1 className="mt-2 font-display text-5xl tracking-tight md:text-6xl">
              Features
            </h1>
            <p className="mt-3 max-w-xl text-zinc-600">
              Single source of truth for what&apos;s shipped, what&apos;s in flight, and
              what&apos;s queued. Priority is for planned items only.
            </p>
          </div>
          <div className="w-full max-w-xs rounded-2xl border border-zinc-900/10 bg-white/70 p-5 backdrop-blur">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                Progress
              </span>
              <span className="font-display text-2xl text-zinc-900">
                {done}
                <span className="text-zinc-400">/{total}</span>
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2 font-mono text-[11px] text-zinc-500">{pct}% shipped</div>
          </div>
        </div>

        <Section title="Live" status="live" features={live} />
        {inProgress.length > 0 && (
          <Section title="In progress" status="in_progress" features={inProgress} />
        )}
        <Section title="Planned" status="planned" features={planned} ordered />

        <p className="mt-12 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          Edit{" "}
          <code className="rounded bg-zinc-900/5 px-1.5 py-0.5 text-zinc-700">
            lib/features.ts
          </code>{" "}
          to update.
        </p>
      </main>
    </div>
  );
}

function Section({
  title,
  status,
  features,
  ordered,
}: {
  title: string;
  status: FeatureStatus;
  features: Feature[];
  ordered?: boolean;
}) {
  const meta = STATUS_META[status];
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <Badge variant="outline" className={`gap-1.5 ${meta.pillClass}`}>
          <span>{meta.emoji}</span>
          {meta.label}
        </Badge>
        <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          {features.length} {features.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {features.map((f, i) => (
          <Card
            key={f.id}
            className="border-zinc-900/10 bg-white/70 backdrop-blur transition hover:border-zinc-900/20 hover:bg-white/90"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  {ordered && (
                    <span className="font-mono text-[11px] text-zinc-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                  <CardTitle className="font-display text-2xl text-zinc-900">
                    {f.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="text-sm text-zinc-600">
                {f.description}
              </CardDescription>
              {f.notes && (
                <p className="rounded-md border border-amber-500/20 bg-amber-50/60 px-2.5 py-1.5 text-xs italic text-amber-900">
                  {f.notes}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Pill>{CATEGORY_LABEL[f.category]}</Pill>
                <Pill>effort: {f.effort}</Pill>
                <Pill>
                  impact:{" "}
                  <span className="ml-1 text-zinc-900">
                    {"★".repeat(f.impact)}
                    <span className="text-zinc-300">{"★".repeat(3 - f.impact)}</span>
                  </span>
                </Pill>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-zinc-900/10 bg-white/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
      {children}
    </span>
  );
}
