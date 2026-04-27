"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo, Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SLIDES = [
  { id: "title", label: "Title" },
  { id: "problem", label: "Problem" },
  { id: "solution", label: "Solution" },
  { id: "cabinet", label: "Cabinet" },
  { id: "fork", label: "Fork" },
  { id: "demo", label: "Demo" },
  { id: "tech", label: "Stack" },
  { id: "live", label: "Try it" },
];

export default function SlidesPage() {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            setActive(idx);
          }
        });
      },
      { root, threshold: 0.55 }
    );
    slideRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goTo(Math.min(active + 1, SLIDES.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(Math.max(active - 1, 0));
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const goTo = (i: number) => {
    slideRefs.current[i]?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  const progress = ((active + 1) / SLIDES.length) * 100;

  return (
    <div className="relative h-screen overflow-hidden bg-[#fafaf7] text-zinc-900">
      <div className="aurora" />
      <div className="grain" />
      <div className="pointer-events-none absolute inset-0 grid-bg" />

      {/* Top progress bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[2px] bg-zinc-900/5">
        <div
          className="h-full bg-zinc-900 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Minimal top mark */}
      <div className="pointer-events-none absolute left-6 top-5 z-30">
        <Wordmark className="opacity-70" />
      </div>

      {/* Slide counter + keys hint */}
      <div className="pointer-events-none absolute bottom-6 left-6 z-30 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
        {String(active + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
        <span className="ml-3 text-zinc-400">— {SLIDES[active].label}</span>
      </div>
      <div className="pointer-events-none absolute bottom-6 right-6 z-30 hidden font-mono text-[11px] uppercase tracking-widest text-zinc-500 md:block">
        ↓ scroll · ← → keys · F fullscreen
      </div>

      {/* Dots */}
      <nav className="absolute inset-x-0 bottom-6 z-30 flex justify-center">
        <div className="flex items-center gap-2 rounded-full border border-zinc-900/10 bg-white/70 px-3 py-2 backdrop-blur">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              aria-label={`Slide: ${s.label}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-6 bg-zinc-900" : "w-1.5 bg-zinc-400 hover:bg-zinc-700"
              }`}
            />
          ))}
        </div>
      </nav>

      {/* Slides */}
      <div
        ref={containerRef}
        className="relative z-10 h-screen snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        {/* SLIDE 1 — TITLE */}
        <Slide ref={(el) => { slideRefs.current[0] = el; }} idx={0}>
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <Badge
              variant="outline"
              className="mb-8 gap-2 border-zinc-900/10 bg-white/60 font-mono text-[11px] uppercase tracking-widest text-zinc-700 backdrop-blur"
            >
              BETA Hackathon · Track 1 — AI Native × New Species
            </Badge>
            <h1 className="font-display text-7xl leading-[0.95] tracking-tight md:text-9xl">
              PolicyForge
            </h1>
            <p className="mt-6 max-w-3xl font-display text-3xl italic leading-snug text-zinc-700 md:text-4xl">
              The first government that doesn&apos;t sleep.
            </p>
            <p className="mt-8 max-w-2xl text-lg text-zinc-500">
              An AI-native political entity. It audits, explains, and rewrites public
              policy in real time — and lets anyone fork their own counter-cabinet.
            </p>
          </div>
        </Slide>

        {/* SLIDE 2 — PROBLEM */}
        <Slide ref={(el) => { slideRefs.current[1] = el; }} idx={1}>
          <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                01 — The gap
              </p>
              <h2 className="mt-4 font-display text-5xl leading-tight tracking-tight md:text-6xl">
                Governments think in years.
                <br />
                <span className="italic text-zinc-400">AI thinks in seconds.</span>
              </h2>
              <p className="mt-6 text-lg text-zinc-600">
                Laws are written by humans, debated by humans, ratified by humans —
                over months. Reality compounds at machine speed. There is no parallel
                intelligence holding policy accountable in real time.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-900/10 bg-white/70 p-6 shadow-xl shadow-zinc-900/5 backdrop-blur">
              <div className="space-y-3 font-mono text-xs">
                <Row label="Avg. federal bill debate" v="14 months" />
                <Row label="Public reading rate" v="<2%" highlight />
                <Row label="Lobbyist amendments" v="thousands" />
                <Row label="Citizen revisions" v="0" highlight />
                <Row label="Continuous audit" v="never" highlight />
              </div>
              <div className="mt-6 border-t border-zinc-900/10 pt-4">
                <div className="font-mono text-[11px] uppercase tracking-widest text-emerald-700">
                  With PolicyForge
                </div>
                <div className="mt-3 space-y-3 font-mono text-xs">
                  <Row label="Audit frequency" v="continuous" green />
                  <Row label="Plain-language explainer" v="every law" green />
                  <Row label="Counter-proposals" v="on-demand" green />
                  <Row label="Forkable cabinets" v="∞" green />
                </div>
              </div>
            </div>
          </div>
        </Slide>

        {/* SLIDE 3 — SOLUTION */}
        <Slide ref={(el) => { slideRefs.current[2] = el; }} idx={2}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                02 — What it does
              </p>
              <h2 className="mt-4 font-display text-5xl tracking-tight md:text-6xl">
                Four powers.
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                { n: "01", t: "Audit", d: "Ingests bills. Scores them on transparency, consistency, second-order effects." },
                { n: "02", t: "Explain", d: "Translates 400-page legal text into language a 14-year-old can argue with." },
                { n: "03", t: "Counter-propose", d: "Generates concrete alternatives with reasoning and quantified trade-offs." },
                { n: "04", t: "Fork", d: "Anyone can clone the cabinet, mutate its values, and run a parallel government." },
              ].map((c) => (
                <Card
                  key={c.n}
                  className="border-zinc-900/10 bg-white/70 backdrop-blur transition hover:-translate-y-1 hover:border-zinc-900/20 hover:bg-white/90"
                >
                  <CardHeader>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                      {c.n}
                    </p>
                    <CardTitle className="font-display text-3xl text-zinc-900">
                      {c.t}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-zinc-600">
                      {c.d}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Slide>

        {/* SLIDE 4 — THE CABINET */}
        <Slide ref={(el) => { slideRefs.current[3] = el; }} idx={3}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-10">
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                03 — Multi-agent debate
              </p>
              <h2 className="mt-4 font-display text-5xl tracking-tight md:text-6xl">
                Seven agents.
                <br />
                <span className="italic text-zinc-400">One government.</span>
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { role: "Prime Minister", trait: "Pragmatic synthesizer" },
                { role: "Min. Economy", trait: "Fiscal modeler" },
                { role: "Min. Justice", trait: "Rights guardian" },
                { role: "Min. Ecology", trait: "Long-horizon" },
                { role: "Min. Tech & Labor", trait: "Systems thinker" },
                { role: "Opposition Shadow", trait: "Antagonistic clone" },
                { role: "Citizen Simulator", trait: "Multi-voice" },
              ].map((m) => (
                <div
                  key={m.role}
                  className="flex items-start justify-between gap-4 rounded-xl border border-zinc-900/10 bg-white/70 p-4 backdrop-blur transition hover:border-zinc-900/20"
                >
                  <div className="flex items-start gap-3">
                    <Logo size={20} className="mt-1 shrink-0" />
                    <div>
                      <div className="font-display text-xl text-zinc-900">{m.role}</div>
                      <div className="text-sm text-zinc-600">{m.trait}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* SLIDE 5 — FORK */}
        <Slide ref={(el) => { slideRefs.current[4] = el; }} idx={4}>
          <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                04 — The new species
              </p>
              <h2 className="mt-4 font-display text-5xl leading-tight tracking-tight md:text-6xl">
                A government you can <span className="italic">fork.</span>
              </h2>
              <p className="mt-6 text-lg text-zinc-600">
                10 cabinet presets shipped: 5 schools of thought (Helios, Hayek, Ostrom,
                Singapore, Earth) and 5 historical US administrations (Reagan, Clinton,
                Obama, Trump, Biden) — with their <strong>real ministers</strong> in
                each seat.
              </p>
              <p className="mt-3 text-lg text-zinc-600">
                Run the same bill on Reagan vs Biden. The disagreements{" "}
                <span className="text-zinc-900">become the content.</span>
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  { n: "Reagan", c: "amber" },
                  { n: "Clinton", c: "blue" },
                  { n: "Obama", c: "cyan" },
                  { n: "Trump", c: "rose" },
                  { n: "Biden", c: "lime" },
                ].map((t) => (
                  <span
                    key={t.n}
                    className={`rounded-full border bg-white/70 px-3 py-1 font-mono text-[11px] backdrop-blur border-${t.c}-600/30 text-${t.c}-700`}
                  >
                    cabinet:{t.n.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
            <div className="min-w-0 rounded-2xl border border-zinc-900/10 bg-white/70 p-1 shadow-xl shadow-zinc-900/5 backdrop-blur">
              <div className="overflow-hidden rounded-xl bg-zinc-950 p-5 font-mono text-[12px] leading-relaxed">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 text-[10px] uppercase tracking-widest text-zinc-500">
                    cabinet.json
                  </span>
                </div>
                <pre className="whitespace-pre-wrap break-words text-zinc-200">
{`{
  "name":     "Cabinet Reagan",
  "tagline":  "Supply-side · 1981–89",
  "category": "historical",
  "lens":     "Supply-side, deregulation,
               skeptical of federal expansion...",
  "members": {
    "pm":      { "name": "Ronald Reagan" },
    "economy": { "name": "James Baker" },
    "justice": { "name": "Edwin Meese" },
    "ecology": { "name": "Anne Gorsuch" },
    "tech":    { "name": "Raymond Donovan" }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </Slide>

        {/* SLIDE 6 — DEMO */}
        <Slide ref={(el) => { slideRefs.current[5] = el; }} idx={5}>
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              05 — Demo
            </p>
            <h2 className="mt-4 font-display text-5xl tracking-tight md:text-6xl">
              Watch a parallel government think.
            </h2>
            <ol className="mt-10 grid gap-4 text-left md:grid-cols-3">
              {[
                "Pick a bill (sample or paste your own).",
                "Pick a cabinet — Reagan, Biden, or fork your own.",
                "Cabinet debates live. 5–15 turns. Token-by-token streaming.",
                "Verdict: headline, amendments, winners/losers, numbers, dissent.",
                "Fork the cabinet, change the lens, run the same bill again.",
                "Compare verdicts. Disagreement is the content.",
              ].map((t, i) => (
                <li
                  key={i}
                  className="rounded-2xl border border-zinc-900/10 bg-white/70 p-5 backdrop-blur"
                >
                  <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                    Step {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="mt-2 text-zinc-800">{t}</p>
                </li>
              ))}
            </ol>
          </div>
        </Slide>

        {/* SLIDE 7 — TECH */}
        <Slide ref={(el) => { slideRefs.current[6] = el; }} idx={6}>
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              06 — Stack
            </p>
            <h2 className="mt-4 font-display text-5xl tracking-tight md:text-6xl">
              Built in 48 hours.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[
                { l: "LLM", v: "z.ai · GLM-5.1 (quality) + GLM-5-Turbo (fast)" },
                { l: "Framework", v: "Next.js 16 (App Router, Turbopack)" },
                { l: "Streaming", v: "Vercel AI SDK + custom NDJSON multi-agent" },
                { l: "Persistence", v: "Supabase Postgres · debates + turns + cabinets" },
                { l: "Schema migrations", v: "6 applied via Supabase CLI" },
                { l: "Styling", v: "Tailwind 4 + shadcn/ui · light, aurora, grain" },
                { l: "Deploy", v: "Vercel · CI from GitHub" },
                { l: "Total routes", v: "/parliament · /cabinet · /feed · /slides · /api" },
              ].map((t) => (
                <div
                  key={t.l}
                  className="flex items-baseline gap-3 rounded-xl border border-zinc-900/10 bg-white/70 p-4 backdrop-blur"
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 shrink-0 w-32">
                    {t.l}
                  </span>
                  <span className="text-sm text-zinc-800">{t.v}</span>
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* SLIDE 8 — TRY IT */}
        <Slide ref={(el) => { slideRefs.current[7] = el; }} idx={7}>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              07 — Now live
            </p>
            <h2 className="mt-4 font-display text-6xl leading-tight tracking-tight md:text-8xl">
              The cabinet is
              <br />
              <span className="italic text-transparent bg-gradient-to-br from-emerald-600 via-cyan-600 to-violet-600 bg-clip-text">
                in session.
              </span>
            </h2>
            <p className="mt-8 max-w-xl text-lg text-zinc-600">
              Open the floor. Paste a law. Pick a cabinet. Watch a parallel government
              think.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/parliament">
                <Button size="lg" className="px-8 text-base">
                  Enter parliament →
                </Button>
              </Link>
              <Link href="/cabinet">
                <Button size="lg" variant="ghost">
                  Browse cabinets
                </Button>
              </Link>
            </div>
            <div className="mt-12 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              github.com/benjaminmerchin/PolicyForge
            </div>
          </div>
        </Slide>
      </div>
    </div>
  );
}

function Slide({
  ref,
  idx,
  children,
}: {
  ref: (el: HTMLElement | null) => void;
  idx: number;
  children: React.ReactNode;
}) {
  return (
    <section
      ref={ref}
      data-idx={idx}
      className="relative flex h-screen w-full snap-start items-center justify-center px-6 py-24"
    >
      {children}
    </section>
  );
}

function Row({
  label,
  v,
  highlight,
  green,
}: {
  label: string;
  v: string;
  highlight?: boolean;
  green?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="h-px flex-1 translate-y-[-2px] border-b border-dashed border-zinc-900/10" />
      <span
        className={
          green ? "text-emerald-700" : highlight ? "text-rose-600" : "text-zinc-900"
        }
      >
        {v}
      </span>
    </div>
  );
}
