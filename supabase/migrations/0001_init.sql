-- PolicyForge schema (paste this into Supabase SQL Editor and Run).

create extension if not exists "pgcrypto";

create table if not exists public.debates (
  id uuid primary key default gen_random_uuid(),
  bill_code text not null,
  bill_title text not null,
  bill_summary text not null,
  status text not null default 'running' check (status in ('running','done','error')),
  decision text check (decision in ('approve','reject','amend')),
  counter_proposal text,
  tradeoffs jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.turns (
  id uuid primary key default gen_random_uuid(),
  debate_id uuid not null references public.debates(id) on delete cascade,
  idx int not null,
  agent_id text not null,
  intent text not null,
  text text not null default '',
  created_at timestamptz not null default now(),
  unique (debate_id, idx)
);

create index if not exists turns_debate_idx on public.turns (debate_id, idx);
create index if not exists debates_created_idx on public.debates (created_at desc);

-- Row level security
alter table public.debates enable row level security;
alter table public.turns enable row level security;

drop policy if exists "Public read debates" on public.debates;
create policy "Public read debates"
  on public.debates for select
  using (true);

drop policy if exists "Public read turns" on public.turns;
create policy "Public read turns"
  on public.turns for select
  using (true);

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'debates'
  ) then
    alter publication supabase_realtime add table public.debates;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'turns'
  ) then
    alter publication supabase_realtime add table public.turns;
  end if;
end $$;
