import { NextResponse } from "next/server";
import { supabaseServer, type CabinetMembers } from "@/lib/supabase";

export const runtime = "nodejs";

const ROLE_KEYS = ["pm", "economy", "justice", "ecology", "tech"] as const;

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name?: string;
    tagline?: string;
    description?: string;
    lens?: string;
    parentId?: string | null;
    accent?: string;
    members?: Record<string, { name?: string; title?: string; initials?: string } | null>;
  };

  const name = body.name?.trim();
  const lens = body.lens?.trim();
  if (!name || !lens) {
    return NextResponse.json(
      { error: "Name and lens are required." },
      { status: 400 }
    );
  }

  // Validate members: a role is included only if all three fields (name, title, initials)
  // are filled. If any field is filled but not all three, reject.
  const members: CabinetMembers = {};
  if (body.members) {
    for (const role of ROLE_KEYS) {
      const m = body.members[role];
      if (!m) continue;
      const n = m.name?.trim();
      const t = m.title?.trim();
      const i = m.initials?.trim();
      const anyFilled = Boolean(n || t || i);
      const allFilled = Boolean(n && t && i);
      if (anyFilled && !allFilled) {
        return NextResponse.json(
          {
            error: `Member ${role}: name, title, and initials must all be filled (or all empty).`,
          },
          { status: 400 }
        );
      }
      if (allFilled) {
        members[role] = { name: n!, title: t!, initials: i! };
      }
    }
  }

  const slug =
    slugify(name) +
    "-" +
    Math.random().toString(36).slice(2, 7);

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("cabinets")
    .insert({
      slug,
      name,
      tagline: body.tagline?.trim() || null,
      description: body.description?.trim() || null,
      lens,
      parent_id: body.parentId || null,
      is_preset: false,
      accent: body.accent || "violet",
      members: Object.keys(members).length > 0 ? members : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create cabinet." },
      { status: 500 }
    );
  }

  return NextResponse.json({ cabinet: data });
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
