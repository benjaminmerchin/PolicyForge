-- Allow an "abandoned" status for sessions where the client disconnected
-- before a verdict was produced. Less alarming than "error", more honest
-- than deleting the row.

alter table public.debates drop constraint if exists debates_status_check;
alter table public.debates
  add constraint debates_status_check
  check (status in ('running', 'done', 'error', 'abandoned'));
