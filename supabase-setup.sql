-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor → New query)

-- Food log table
create table if not exists food_log (
  id          uuid primary key default gen_random_uuid(),
  item        text not null,
  calories    integer not null,
  protein     numeric(6,2) not null,
  logged_at   timestamptz not null,
  created_at  timestamptz default now(),
  description text,
  starred     boolean not null default false
);

-- Weight log table
create table if not exists weight_log (
  id         uuid primary key default gen_random_uuid(),
  weight     numeric(5,2) not null,
  logged_at  timestamptz not null,
  created_at timestamptz default now()
);

-- Targets / goals table (single row per user, keyed by 'default')
create table if not exists user_targets (
  id             uuid primary key default gen_random_uuid(),
  key            text not null unique,
  cal_goal       integer not null default 1500,
  prot_goal      numeric(6,2) not null default 120,
  w_start_kg     numeric(5,2) not null default 75.9,
  w_start_date   date not null default '2026-05-31',
  w_target_kg    numeric(5,2) not null default 66,
  w_target_date  date not null default '2026-08-29',
  updated_at     timestamptz default now()
);

-- Enable RLS
alter table food_log     enable row level security;
alter table weight_log   enable row level security;
alter table user_targets enable row level security;

-- Allow all reads without auth (personal/no-auth app)
create policy "Allow all reads on food_log"
  on food_log for select using (true);

create policy "Allow all reads on weight_log"
  on weight_log for select using (true);

create policy "Allow all on user_targets"
  on user_targets for all using (true) with check (true);

-- Note: food_log and weight_log writes are done via service key from the
-- serverless functions, so no insert/update/delete policy needed for anon users.

-- ── MIGRATION (run if tables already exist) ───────────────────────────────────
-- alter table food_log add column if not exists description text;
-- alter table food_log add column if not exists starred boolean not null default false;

-- Seed the targets row
insert into user_targets (key) values ('default')
  on conflict (key) do nothing;

-- Optional: insert your starting weight
-- insert into weight_log (weight, logged_at) values (75.9, '2026-05-31T08:00:00+03:00');
