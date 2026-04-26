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
  { id: "hero", label: "Intro" },
  { id: "problem", label: "Problem" },
  { id: "capabilities", label: "Capabilities" },
  { id: "cabinet", label: "Cabinet" },
  { id: "fork", label: "Fork" },
  { id: "cta", label: "Live" },
];

export default function Landing() {
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const goTo = (i: number) => {
    slideRefs.current[i]?.scrollIntoView({ behavior: "smooth" });
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

      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Wordmark className="pointer-events-auto" />
          <div className="pointer-events-auto flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 border-emerald-600/30 bg-emerald-500/10 font-mono text-[11px] text-emerald-700">
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot text-emerald-500" />
              CABINET — IN SESSION
            </Badge>
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
            <Link href="/parliament">
              <Button size="sm">
                Enter parliament →
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Slide counter */}
      <div className="pointer-events-none absolute bottom-6 left-6 z-30 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
        {String(active + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
        <span className="ml-3 text-zinc-400">— {SLIDES[active].label}</span>
      </div>

      {/* Horizontal slide dots */}
      <nav className="absolute inset-x-0 bottom-6 z-30 flex justify-center">
        <div className="flex items-center gap-2 rounded-full border border-zinc-900/10 bg-white/70 px-3 py-2 backdrop-blur">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              aria-label={`Slide: ${s.label}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active
                  ? "w-6 bg-zinc-900"
                  : "w-1.5 bg-zinc-400 hover:bg-zinc-700"
              }`}
            />
          ))}
        </div>
      </nav>

      <div className="pointer-events-none absolute bottom-6 right-6 z-30 hidden font-mono text-[11px] uppercase tracking-widest text-zinc-500 md:block">
        ↓ scroll · ← → keys
      </div>

      {/* Slides container */}
      <div
        ref={containerRef}
        className="relative z-10 h-screen snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        {/* SLIDE 1 — HERO */}
        <Slide
          ref={(el) => {
            slideRefs.current[0] = el;
          }}
          idx={0}
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <Badge variant="outline" className="mb-8 gap-2 border-zinc-900/10 bg-white/60 font-mono text-[11px] uppercase tracking-widest text-zinc-700 backdrop-blur">
              Track 1 — AI Native × New Species
            </Badge>
            <h1 className="font-display text-6xl leading-[0.95] tracking-tight text-zinc-900 md:text-8xl">
              The first government
              <br />
              <span className="italic text-transparent bg-gradient-to-br from-violet-600 via-rose-500 to-amber-500 bg-clip-text">
                that doesn&apos;t sleep.
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg text-zinc-600 md:text-xl">
              PolicyForge is an AI-native political entity. It audits, explains, and rewrites
              public policy in real time — and lets anyone fork their own counter-cabinet.
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <Link href="/parliament">
                <Button size="lg" className="px-6">
                  Enter parliament →
                </Button>
              </Link>
              <button
                onClick={() => goTo(1)}
                className="rounded-md border border-zinc-900/10 bg-white/60 px-5 py-2 text-sm text-zinc-700 backdrop-blur transition hover:border-zinc-900/20 hover:bg-white/80"
              >
                See how it works
              </button>
            </div>
          </div>
        </Slide>

        {/* SLIDE 2 — PROBLEM */}
        <Slide
          ref={(el) => {
            slideRefs.current[1] = el;
          }}
          idx={1}
        >
          <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                01 — The gap
              </p>
              <h2 className="mt-4 font-display text-5xl leading-tight tracking-tight text-zinc-900 md:text-6xl">
                Governments think in years.
                <br />
                <span className="italic text-zinc-400">AI thinks in seconds.</span>
              </h2>
              <p className="mt-6 text-lg text-zinc-600">
                Laws are written by humans, debated by humans, ratified by humans — over months.
                Meanwhile reality compounds at machine speed. There is no parallel intelligence
                holding policy accountable in real time.
              </p>
              <p className="mt-4 text-lg text-zinc-800">
                Until now.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-900/10 bg-white/70 p-6 shadow-xl shadow-zinc-900/5 backdrop-blur">
              <div className="space-y-3 font-mono text-xs">
                <Row label="Avg. law debate" v="14 months" />
                <Row label="Public reading rate" v="<2%" highlight />
                <Row label="Lobbyist amendments" v="thousands" />
                <Row label="Citizen revisions" v="0" highlight />
                <Row label="Continuous audit" v="never" highlight />
              </div>
              <div className="mt-6 border-t border-zinc-900/10 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-700">
                    With PolicyForge
                  </span>
                  <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot text-emerald-500" />
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

        {/* SLIDE 3 — CAPABILITIES */}
        <Slide
          ref={(el) => {
            slideRefs.current[2] = el;
          }}
          idx={2}
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                02 — What it does
              </p>
              <h2 className="mt-4 font-display text-5xl tracking-tight text-zinc-900 md:text-6xl">
                Four powers.
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  n: "01",
                  t: "Audit",
                  d: "Ingests laws as they're published. Scores them on transparency, consistency, and second-order effects.",
                },
                {
                  n: "02",
                  t: "Explain",
                  d: "Translates 400-page legal text into language a 14-year-old can argue with.",
                },
                {
                  n: "03",
                  t: "Counter-propose",
                  d: "Generates alternative policies with reasoning, citing trade-offs and stakeholder impact.",
                },
                {
                  n: "04",
                  t: "Fork",
                  d: "Anyone can clone the cabinet, mutate its values, and run a parallel government.",
                },
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

        {/* SLIDE 4 — CABINET */}
        <Slide
          ref={(el) => {
            slideRefs.current[3] = el;
          }}
          idx={3}
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-10">
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                03 — Meet the cabinet
              </p>
              <h2 className="mt-4 font-display text-5xl tracking-tight text-zinc-900 md:text-6xl">
                Seven agents.
                <br />
                <span className="italic text-zinc-400">One government.</span>
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { role: "Prime Minister", trait: "Pragmatic synthesizer", line: "Arbitrates between ministries. Signs the final proposal." },
                { role: "Min. Economy", trait: "Configurable bias", line: "Models budgets, runs counter-fiscal scenarios." },
                { role: "Min. Justice", trait: "Rights guardian", line: "Checks legal coherence, flags constitutional risk." },
                { role: "Min. Ecology", trait: "Long-horizon", line: "Scores climate impact across decades, not quarters." },
                { role: "Opposition Shadow", trait: "Antagonistic clone", line: "Same brain, inverted values. Debates the cabinet in public." },
                { role: "Citizen Simulator", trait: "Multi-voice", line: "Plays five personas. Surfaces real friction the cabinet misses." },
                { role: "Explainer", trait: "Pedagogue", line: "Translates everything to plain language, on demand." },
              ].map((m) => (
                <div
                  key={m.role}
                  className="flex items-start justify-between gap-4 rounded-xl border border-zinc-900/10 bg-white/70 p-4 backdrop-blur transition hover:border-zinc-900/20 hover:bg-white/90"
                >
                  <div className="flex items-start gap-3">
                    <Logo size={20} className="mt-1 shrink-0" />
                    <div>
                      <div className="font-display text-xl text-zinc-900">{m.role}</div>
                      <div className="text-sm text-zinc-600">{m.line}</div>
                    </div>
                  </div>
                  <span className="hidden shrink-0 rounded-full border border-zinc-900/10 bg-white/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600 md:inline-block">
                    {m.trait}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* SLIDE 5 — FORK */}
        <Slide
          ref={(el) => {
            slideRefs.current[4] = el;
          }}
          idx={4}
        >
          <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                04 — The new species
              </p>
              <h2 className="mt-4 font-display text-5xl leading-tight tracking-tight text-zinc-900 md:text-6xl">
                A government you can <span className="italic">fork.</span>
              </h2>
              <p className="mt-6 text-lg text-zinc-600">
                Every cabinet is a JSON manifesto — values, biases, priorities. Clone it, mutate
                a slider, and your counter-government goes live. Variants coexist. They debate
                each other. The disagreements <span className="text-zinc-900">become the content</span>.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {["libertarian", "ecologist", "collectivist", "long-termist", "civic-tech"].map(
                  (t) => (
                    <span
                      key={t}
                      className="rounded-full border border-zinc-900/10 bg-white/70 px-3 py-1 font-mono text-[11px] text-zinc-700 backdrop-blur"
                    >
                      fork: {t}
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-900/10 bg-white/70 p-1 shadow-xl shadow-zinc-900/5 backdrop-blur">
              <div className="rounded-xl bg-zinc-950 p-5 font-mono text-[12px] leading-relaxed">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 text-[10px] uppercase tracking-widest text-zinc-500">
                    cabinet.json
                  </span>
                </div>
                <pre className="text-zinc-200">
{`{
  "name": "Cabinet Helios",
  "values": [
    "long_term_thinking",
    "evidence_based",
    "radical_transparency"
  ],
  "biases": {
    "fiscal":  "+0.3 progressive",
    "climate": "+0.7 precautionary",
    "tech":    "-0.2 cautious"
  },
  "priorities": [
    "intergenerational_equity",
    "energy_sovereignty",
    "open_data"
  ],
  "fork_of": "Cabinet Genesis"
}`}
                </pre>
              </div>
            </div>
          </div>
        </Slide>

        {/* SLIDE 6 — CTA */}
        <Slide
          ref={(el) => {
            slideRefs.current[5] = el;
          }}
          idx={5}
        >
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              05 — Now live
            </p>
            <h2 className="mt-4 font-display text-6xl leading-tight tracking-tight text-zinc-900 md:text-7xl">
              The cabinet is
              <br />
              <span className="italic text-transparent bg-gradient-to-br from-emerald-600 via-cyan-600 to-violet-600 bg-clip-text">
                in session.
              </span>
            </h2>
            <p className="mt-6 max-w-xl text-lg text-zinc-600">
              Open the floor. Paste a law. Ask for a counter-proposal. Watch a parallel
              government think.
            </p>
            <div className="mt-10">
              <Link href="/parliament">
                <Button size="lg" className="px-8 text-base">
                  Enter the chamber →
                </Button>
              </Link>
            </div>
            <div className="mt-12 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              Built for BETA Hackathon · Track 1 — New Species
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
          green
            ? "text-emerald-700"
            : highlight
              ? "text-rose-600"
              : "text-zinc-900"
        }
      >
        {v}
      </span>
    </div>
  );
}
