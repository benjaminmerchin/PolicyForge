import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { supabaseServer, type CabinetRow } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cabinets — PolicyForge",
  description:
    "Browse, fork, and create cabinets. Each cabinet is a forkable government with declared values.",
};

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

export default async function CabinetsListPage() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("cabinets")
    .select("*")
    .order("is_preset", { ascending: false })
    .order("created_at", { ascending: false });

  const cabinets = (data ?? []) as CabinetRow[];
  const schools = cabinets.filter((c) => c.is_preset && c.category !== "historical");
  const historical = cabinets.filter((c) => c.is_preset && c.category === "historical");
  const custom = cabinets.filter((c) => !c.is_preset);

  return (
    <div className="relative min-h-screen bg-[#fafaf7] text-zinc-900">
      <div className="aurora opacity-50" />
      <div className="grain" />

      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              Forkable governments
            </p>
            <h1 className="mt-2 font-display text-5xl tracking-tight md:text-6xl">
              Cabinets
            </h1>
            <p className="mt-4 text-zinc-600">
              Each cabinet is a government with declared values. Pick one to debate a bill,
              or fork an existing cabinet and mutate its lens to create a parallel
              government with its own ideology.
            </p>
          </div>
          <Link href="/cabinet/new">
            <Button size="lg">+ Create cabinet</Button>
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-600/30 bg-rose-500/5 p-4 text-sm text-rose-700">
            {error.message}
          </div>
        )}

        <Section
          title="Schools of thought"
          subtitle="Frameworks drawn from political and economic theory."
          cabinets={schools}
        />
        <Section
          title="Historical administrations"
          subtitle="Recent U.S. administrations as policy frameworks. Doctrines, not caricatures."
          cabinets={historical}
        />
        <Section
          title="Forked cabinets"
          subtitle="Custom cabinets created by users."
          cabinets={custom}
          empty="No forks yet. Create the first one."
        />
      </main>
    </div>
  );
}

function Section({
  title,
  subtitle,
  cabinets,
  empty,
}: {
  title: string;
  subtitle?: string;
  cabinets: CabinetRow[];
  empty?: string;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          {title}
        </span>
        <span className="font-mono text-[10px] text-zinc-400">
          {cabinets.length} {cabinets.length === 1 ? "item" : "items"}
        </span>
        {subtitle && (
          <span className="ml-1 text-[11px] italic text-zinc-500">— {subtitle}</span>
        )}
      </div>
      {cabinets.length === 0 && empty && (
        <div className="rounded-xl border border-dashed border-zinc-900/15 bg-white/40 p-8 text-center text-sm text-zinc-500 backdrop-blur">
          {empty}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {cabinets.map((c) => {
          const accent = ACCENT_CLASSES[c.accent] ?? ACCENT_CLASSES.violet;
          return (
            <Link
              key={c.id}
              href={`/cabinet/${c.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-zinc-900/10 bg-white/70 p-5 backdrop-blur transition hover:border-zinc-900/25 hover:bg-white/90"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="outline" className={accent}>
                    {c.is_preset
                      ? c.category === "historical"
                        ? "HISTORICAL"
                        : "PRESET"
                      : "FORKED"}
                  </Badge>
                  <h2 className="mt-3 font-display text-2xl text-zinc-900 group-hover:underline">
                    {c.name}
                  </h2>
                  {c.tagline && (
                    <p className="mt-1 text-sm text-zinc-600">{c.tagline}</p>
                  )}
                </div>
              </div>
              {c.description && (
                <p className="text-sm text-zinc-600 line-clamp-3">{c.description}</p>
              )}
              <div className="mt-auto flex items-center justify-between text-[11px] text-zinc-500">
                <span className="font-mono">{c.slug}</span>
                <span className="text-zinc-400 group-hover:text-zinc-700">View →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
