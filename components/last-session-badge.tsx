"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabaseBrowser } from "@/lib/supabase";

export function LastSessionBadge() {
  const [label, setLabel] = useState<string>("CABINET ONLINE");
  const [tone, setTone] = useState<"idle" | "fresh" | "stale">("idle");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const { data } = await supabaseBrowser()
          .from("debates")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1);
        if (!alive) return;
        const row = data?.[0];
        if (!row) {
          setLabel("CABINET ONLINE");
          setTone("idle");
          return;
        }
        const ago = formatAgo(new Date(row.created_at as string));
        setLabel(`LAST SESSION ${ago}`);
        const minutes =
          (Date.now() - new Date(row.created_at as string).getTime()) / 60000;
        setTone(minutes < 60 ? "fresh" : "stale");
      } catch {
        // keep default
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const tones = {
    idle: "border-zinc-900/15 bg-white/60 text-zinc-700",
    fresh: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700",
    stale: "border-amber-600/30 bg-amber-500/10 text-amber-700",
  };
  const dotColor = {
    idle: "bg-zinc-500",
    fresh: "bg-emerald-500 live-dot text-emerald-500",
    stale: "bg-amber-500",
  };

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 font-mono text-[11px] ${tones[tone]}`}
    >
      <span
        className={`relative inline-block h-1.5 w-1.5 rounded-full ${dotColor[tone]}`}
      />
      {label}
    </Badge>
  );
}

function formatAgo(d: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s AGO`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} MIN AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
}
