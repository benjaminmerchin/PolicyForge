-- Richer verdict shape: headline, amendments, stakeholders, quantifications, dissent.
-- Old debates keep their tradeoffs + counter_proposal columns; new fields are optional.

alter table public.debates
  add column if not exists headline text,
  add column if not exists amendments jsonb,
  add column if not exists winners jsonb,
  add column if not exists losers jsonb,
  add column if not exists numbers jsonb,
  add column if not exists dissent text;
