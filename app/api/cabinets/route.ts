import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name?: string;
    tagline?: string;
    description?: string;
    lens?: string;
    parentId?: string | null;
    accent?: string;
  };

  const name = body.name?.trim();
  const lens = body.lens?.trim();
  if (!name || !lens) {
    return NextResponse.json(
      { error: "Name and lens are required." },
      { status: 400 }
    );
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
