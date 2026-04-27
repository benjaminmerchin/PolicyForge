"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV_LINKS = [
  { href: "/cabinet", label: "Cabinets" },
  { href: "/feed", label: "Sessions" },
  { href: "/features", label: "Features" },
];

export function SiteHeader() {
  const pathname = usePathname();

  // The parliament page shows an "in session" badge instead of the CTA.
  const isParliament = pathname === "/parliament";

  return (
    <header className="relative z-10 border-b border-zinc-900/10 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((l) => {
            const active =
              pathname === l.href ||
              (l.href !== "/" && pathname.startsWith(l.href + "/"));
            return (
              <Link key={l.href} href={l.href}>
                <Button
                  size="sm"
                  variant="ghost"
                  className={active ? "bg-zinc-900/[0.06] text-zinc-900" : ""}
                >
                  {l.label}
                </Button>
              </Link>
            );
          })}
          <span className="mx-2 hidden h-5 w-px bg-zinc-900/10 md:inline-block" />
          {isParliament ? (
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-600/30 bg-emerald-500/10 font-mono text-[11px] text-emerald-700"
            >
              <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot text-emerald-500" />
              IN SESSION
            </Badge>
          ) : (
            <Link href="/parliament">
              <Button size="sm">Enter parliament →</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
