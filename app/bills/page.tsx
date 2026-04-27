import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchRecentBills, formatBillCode, billSlug } from "@/lib/congress";

export const dynamic = "force-dynamic";
export const revalidate = 600;

export const metadata = {
  title: "Recent bills — Congress.gov · PolicyForge",
  description:
    "Browse the most recently updated bills in the U.S. Congress and convene a cabinet to debate any of them.",
};

export default async function BillsPage() {
  let bills: Awaited<ReturnType<typeof fetchRecentBills>> = [];
  let error: string | null = null;
  try {
    bills = await fetchRecentBills(40);
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  const fetchedAt = new Date();

  return (
    <div className="relative min-h-screen bg-[#fafaf7] text-zinc-900">
      <div className="aurora opacity-50" />
      <div className="grain" />

      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-600/30 bg-emerald-500/10 font-mono text-[11px] uppercase tracking-widest text-emerald-700"
            >
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot text-emerald-500" />
              Live · Congress.gov
            </Badge>
            <h1 className="mt-3 font-display text-5xl tracking-tight md:text-6xl">
              Recent bills
            </h1>
            <p className="mt-4 text-zinc-600">
              Real bills currently moving through the U.S. Congress, sorted by latest
              action. Click any bill to convene a cabinet to debate it. The summary
              shown is the official CRS summary when available — fallback is the
              latest legislative action.
            </p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              Source: api.congress.gov · fetched{" "}
              {fetchedAt.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "America/Los_Angeles",
                timeZoneName: "short",
              })}{" "}
              · {bills.length} bills · cached 10 min
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-600/30 bg-rose-500/5 p-4 text-sm text-rose-700">
            Couldn&apos;t reach Congress.gov: {error}
          </div>
        )}

        {!error && bills.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-900/15 bg-white/40 p-12 text-center backdrop-blur">
            <p className="font-display text-2xl text-zinc-700">No bills returned.</p>
          </div>
        )}

        <div className="grid gap-3">
          {bills.map((b) => {
            const slug = billSlug(b.congress, b.billType, b.billNumber);
            return (
              <Link
                key={slug}
                href={`/parliament?bill=${slug}`}
                className="group flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-zinc-900/10 bg-white/70 p-5 backdrop-blur transition hover:border-zinc-900/25 hover:bg-white/90"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                    <span className="text-zinc-700">{formatBillCode(b)}</span>
                    <span className="text-zinc-300">·</span>
                    <span>{b.congress}th Congress</span>
                    {b.originChamber && (
                      <>
                        <span className="text-zinc-300">·</span>
                        <span>{b.originChamber}</span>
                      </>
                    )}
                    {b.latestActionDate && (
                      <>
                        <span className="text-zinc-300">·</span>
                        <span>action {b.latestActionDate}</span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 font-display text-lg text-zinc-900 group-hover:underline">
                    {b.title || "(untitled)"}
                  </p>
                  {b.latestActionText && (
                    <p className="mt-2 line-clamp-2 text-xs text-zinc-500 italic">
                      → {b.latestActionText}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-zinc-900/15 bg-white text-zinc-700 group-hover:border-zinc-900/30"
                >
                  Convene cabinet →
                </Badge>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          Source: Congress.gov via api.data.gov · ~1000 reqs/hour quota
        </p>
      </main>
    </div>
  );
}
