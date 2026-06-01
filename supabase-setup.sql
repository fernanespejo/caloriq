-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor → New query)

-- Food log table
create table if not exists food_log (
  id         uuid primary key default gen_random_uuid(),
  item       text not null,
  calories   integer not null,
  protein    numeric(6,2) not null,
  logged_at  timestamptz not null,
  created_at timestamptz default now()
);

-- Weight log table
create table if not exists weight_log (
  id         uuid primary key default gen_random_uuid(),
  weight     numeric(5,2) not null,
  logged_at  timestamptz not null,
  created_at timestamptz default now()
);

-- Enable RLS (row level security) — writes only via service key (your backend)
alter table food_log   enable row level security;
alter table weight_log enable row level security;

-- Allow all reads without auth (since this is personal/no-auth app)
create policy "Allow all reads on food_log"
  on food_log for select using (true);

create policy "Allow all reads on weight_log"
  on weight_log for select using (true);

-- Note: writes are done via service key from the serverless function, so no
-- insert/update/delete policy needed for anon users.

-- Optional: insert your starting weight
insert into weight_log (weight, logged_at)
values (75.9, '2026-05-31T08:00:00+03:00');
