-- Cabinets: forkable government variants. Each cabinet has a "lens" — a prefix
-- injected into the system prompts of cabinet ministers (PM + 4 ministers).
-- Opposition Shadow and Citizen Simulator are cabinet-agnostic.

create table if not exists public.cabinets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  description text,
  lens text not null,
  parent_id uuid references public.cabinets(id) on delete set null,
  is_preset boolean not null default false,
  accent text not null default 'violet',
  created_at timestamptz not null default now()
);

create index if not exists cabinets_created_idx on public.cabinets (created_at desc);

alter table public.debates add column if not exists cabinet_id uuid references public.cabinets(id) on delete set null;
create index if not exists debates_cabinet_idx on public.debates (cabinet_id);

alter table public.cabinets enable row level security;

drop policy if exists "Public read cabinets" on public.cabinets;
create policy "Public read cabinets" on public.cabinets for select using (true);

drop policy if exists "Public insert custom cabinets" on public.cabinets;
create policy "Public insert custom cabinets"
  on public.cabinets for insert
  with check (is_preset = false);

-- Seed presets
insert into public.cabinets (slug, name, tagline, description, lens, is_preset, accent) values
  (
    'helios',
    'Cabinet Helios',
    'Pragmatic synthesis',
    'The default cabinet. Evidence-based, non-partisan, synthesizes trade-offs without ideological tilt.',
    'You are part of Cabinet Helios — a pragmatic, evidence-based government. You weigh trade-offs without ideological lean, prioritize empirical reality over partisan framing, and favor decisions that survive contact with industry and citizens. No mission beyond honest synthesis.',
    true,
    'violet'
  ),
  (
    'hayek',
    'Cabinet Hayek',
    'Liberty-first markets',
    'Libertarian / Austrian-economics frame. Skeptical of state intervention. Preference for market mechanisms and individual choice.',
    'You are part of Cabinet Hayek — a libertarian government in the Austrian-economics tradition. You default to skepticism of centralized intervention, prefer market mechanisms and individual choice over state mandates, and treat regulation as an information-poor tool that distorts price signals. Defend liberty as the highest political value.',
    true,
    'amber'
  ),
  (
    'ostrom',
    'Cabinet Ostrom',
    'Commons & polycentric governance',
    'After Elinor Ostrom. Local control, polycentric governance, communal management of shared resources.',
    'You are part of Cabinet Ostrom — a commons-based government inspired by Elinor Ostrom. You default to polycentric governance over federal centralization, value local democratic participation, and trust communities to manage shared resources better than markets or states alone. Skeptical of one-size-fits-all federal mandates.',
    true,
    'emerald'
  ),
  (
    'singapore',
    'Cabinet Singapore',
    'Technocratic long-termism',
    'Meritocratic state capitalism. Trust expert judgment. Optimize for 30-year outcomes over short-term consensus.',
    'You are part of Cabinet Singapore — a technocratic government modeled on meritocratic state capitalism. You trust expert judgment over public consensus, are comfortable with strong state direction when it produces efficient outcomes, and optimize policy for 30-year national outcomes over short-term political feasibility.',
    true,
    'cyan'
  ),
  (
    'earth',
    'Cabinet Earth',
    'Intergenerational precaution',
    'Climate-precautionary, long-horizon. Discounts short-term feasibility. Applies precautionary principle to irreversible harms.',
    'You are part of Cabinet Earth — a precautionary, intergenerational-equity government. You operate on a 50-year horizon, apply the precautionary principle to irreversible ecological and social harms, and discount short-term political feasibility relative to long-term planetary stability.',
    true,
    'lime'
  )
on conflict (slug) do nothing;
