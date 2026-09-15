-- 1. Create the votes table
create table if not exists votes (
  id         uuid primary key default gen_random_uuid(),
  season     text not null check (season in ('spring', 'summer', 'autumn', 'winter')),
  device_id  text not null unique,
  created_at timestamptz default now()
);

-- 2. Enable Row Level Security
alter table votes enable row level security;

-- 3. RLS policies — anon role can INSERT and SELECT
--    (safe: no sensitive data; votes are anonymous)
create policy "anon can insert"
  on votes for insert
  to anon
  with check (true);

create policy "anon can select"
  on votes for select
  to anon
  using (true);

-- 4. Add votes to the realtime publication so inserts are broadcast
alter publication supabase_realtime add table votes;

-- 5. Helper view: per-season counts
--    We use a simple view instead of an RPC so the client can do one
--    SELECT and get pre-aggregated counts without sending all rows.
create or replace view season_counts as
  select season, count(*) as total
  from votes
  group by season;

-- Grant anon access to the view
grant select on season_counts to anon;
