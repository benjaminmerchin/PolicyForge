"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { supabaseBrowser, type CabinetRow } from "@/lib/supabase";
import { AGENTS } from "@/lib/cabinet";

const ACCENTS = ["violet", "amber", "emerald", "cyan", "lime", "rose", "blue", "zinc"];

type RoleKey = "pm" | "economy" | "justice" | "ecology" | "tech";
const ROLE_KEYS: RoleKey[] = ["pm", "economy", "justice", "ecology", "tech"];

type MemberDraft = { name: string; title: string; initials: string };
type MembersDraft = Record<RoleKey, MemberDraft>;

const EMPTY_MEMBERS: MembersDraft = {
  pm: { name: "", title: "", initials: "" },
  economy: { name: "", title: "", initials: "" },
  justice: { name: "", title: "", initials: "" },
  ecology: { name: "", title: "", initials: "" },
  tech: { name: "", title: "", initials: "" },
};

export default function NewCabinetPage() {
  return (
    <Suspense fallback={null}>
      <NewCabinetForm />
    </Suspense>
  );
}

function NewCabinetForm() {
  const router = useRouter();
  const search = useSearchParams();
  const forkId = search.get("fork");

  const [parent, setParent] = useState<CabinetRow | null>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [lens, setLens] = useState("");
  const [accent, setAccent] = useState("violet");
  const [members, setMembers] = useState<MembersDraft>(EMPTY_MEMBERS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!forkId) return;
    (async () => {
      const { data } = await supabaseBrowser()
        .from("cabinets")
        .select("*")
        .eq("id", forkId)
        .single();
      if (data) {
        const c = data as CabinetRow;
        setParent(c);
        setName(`${c.name} (forked)`);
        setTagline(c.tagline ?? "");
        setDescription(c.description ?? "");
        setLens(c.lens);
        setAccent(c.accent);
        if (c.members) {
          const next: MembersDraft = { ...EMPTY_MEMBERS };
          for (const role of ROLE_KEYS) {
            const m = c.members[role];
            if (m) next[role] = { name: m.name, title: m.title, initials: m.initials };
          }
          setMembers(next);
        }
      }
    })();
  }, [forkId]);

  const updateMember = (role: RoleKey, field: keyof MemberDraft, value: string) => {
    setMembers((prev) => ({
      ...prev,
      [role]: { ...prev[role], [field]: value },
    }));
  };

  const submit = async () => {
    setError(null);
    if (!name.trim() || !lens.trim()) {
      setError("Name and lens are required.");
      return;
    }
    // Validate members: each role must be either fully filled or fully empty.
    for (const role of ROLE_KEYS) {
      const m = members[role];
      const filled = [m.name.trim(), m.title.trim(), m.initials.trim()].filter(Boolean);
      if (filled.length > 0 && filled.length < 3) {
        setError(
          `Member ${role}: fill all three fields (name, title, initials) — or leave all empty to use the default archetype.`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/cabinets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          tagline: tagline.trim() || null,
          description: description.trim() || null,
          lens: lens.trim(),
          parentId: forkId || null,
          accent,
          members,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.cabinet) {
        throw new Error(json.error ?? `Failed: ${res.status}`);
      }
      router.push(`/cabinet/${json.cabinet.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fafaf7] text-zinc-900">
      <div className="aurora opacity-50" />
      <div className="grain" />

      <header className="relative z-10 border-b border-zinc-900/10 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Wordmark />
          </Link>
          <Link href="/cabinet">
            <Button size="sm" variant="ghost">
              ← All cabinets
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          {parent ? `Forking ${parent.name}` : "Create cabinet"}
        </p>
        <h1 className="mt-2 font-display text-5xl tracking-tight">
          {parent ? "Mutate the lens." : "Found a cabinet."}
        </h1>
        <p className="mt-3 max-w-xl text-zinc-600">
          A cabinet is a government with declared values. The lens you write below is
          injected into every minister&apos;s system prompt — it shapes how they reason.
          Be specific.
        </p>

        <div className="mt-8 space-y-5">
          <Field label="Cabinet name" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cabinet Athena"
              className="w-full rounded-lg border border-zinc-900/10 bg-white px-3 py-2.5 text-base outline-none focus:border-zinc-900/30"
            />
          </Field>
          <Field label="Tagline" hint="Optional, one short line">
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Rule by reason"
              className="w-full rounded-lg border border-zinc-900/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900/30"
            />
          </Field>
          <Field label="Description" hint="Optional, 1-3 sentences">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A cabinet that prioritizes evidence over consensus and treats every policy as a hypothesis."
              rows={3}
              className="w-full resize-y rounded-lg border border-zinc-900/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900/30"
            />
          </Field>
          <Field
            label="Cabinet lens"
            required
            hint="The ideological prefix injected into every minister's system prompt. Be opinionated — describe what this cabinet believes and how it reasons."
          >
            <textarea
              value={lens}
              onChange={(e) => setLens(e.target.value)}
              placeholder={`You are part of Cabinet Athena — a rationalist government. You demand quantified claims, weight evidence over rhetoric, and require any proposed policy to specify a falsifiable success metric. Skeptical of ideological framings on either side.`}
              rows={7}
              className="w-full resize-y rounded-lg border border-zinc-900/10 bg-white px-3 py-2.5 font-mono text-[12px] leading-relaxed outline-none focus:border-zinc-900/30"
            />
          </Field>
          <Field label="Accent color">
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAccent(a)}
                  type="button"
                  aria-label={a}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    accent === a ? "border-zinc-900" : "border-transparent"
                  }`}
                  style={{ background: hex(a) }}
                />
              ))}
            </div>
          </Field>

          <div className="rounded-2xl border border-zinc-900/10 bg-white/40 p-5 backdrop-blur">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-700">
                Members (optional)
              </span>
              <span className="text-xs text-zinc-500">
                Leave blank to use default archetypes
              </span>
            </div>
            <p className="mb-4 text-xs text-zinc-500">
              Fill in real names, titles, and initials for each role to make this cabinet
              concrete. Opposition Shadow and Citizen Simulator stay cabinet-agnostic.
            </p>
            <div className="space-y-3">
              {ROLE_KEYS.map((role) => {
                const archetype = AGENTS[role];
                const m = members[role];
                return (
                  <div
                    key={role}
                    className="grid grid-cols-12 gap-2 rounded-lg border border-zinc-900/10 bg-white p-3"
                  >
                    <div className="col-span-12 flex items-baseline justify-between gap-2 sm:col-span-3">
                      <div>
                        <div className="text-sm font-medium text-zinc-900">
                          {archetype.role}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          default: {archetype.name}
                        </div>
                      </div>
                    </div>
                    <input
                      value={m.name}
                      onChange={(e) => updateMember(role, "name", e.target.value)}
                      placeholder="Name"
                      className="col-span-12 rounded-md border border-zinc-900/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-zinc-900/30 sm:col-span-5"
                    />
                    <input
                      value={m.title}
                      onChange={(e) => updateMember(role, "title", e.target.value)}
                      placeholder="Title"
                      className="col-span-7 rounded-md border border-zinc-900/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-zinc-900/30 sm:col-span-3"
                    />
                    <input
                      value={m.initials}
                      onChange={(e) =>
                        updateMember(role, "initials", e.target.value.toUpperCase())
                      }
                      maxLength={3}
                      placeholder="AB"
                      className="col-span-5 rounded-md border border-zinc-900/10 bg-white px-2.5 py-1.5 text-center font-mono text-sm uppercase outline-none focus:border-zinc-900/30 sm:col-span-1"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-600/30 bg-rose-500/5 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-end gap-3">
          <Link href="/cabinet">
            <Button size="lg" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Founding…" : parent ? "Fork cabinet" : "Found cabinet"}
          </Button>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-sm font-medium text-zinc-900">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </span>
        {hint && <span className="text-xs text-zinc-500">— {hint}</span>}
      </div>
      {children}
    </label>
  );
}

function hex(accent: string): string {
  const map: Record<string, string> = {
    violet: "#8b5cf6",
    amber: "#f59e0b",
    emerald: "#10b981",
    cyan: "#06b6d4",
    lime: "#84cc16",
    rose: "#f43f5e",
    blue: "#3b82f6",
    zinc: "#71717a",
  };
  return map[accent] ?? "#71717a";
}
