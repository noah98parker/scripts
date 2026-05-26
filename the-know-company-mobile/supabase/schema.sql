-- ============================================================
-- The Know Company — Supabase Database Schema
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- ── Favorite parking spots ──────────────────────────────────
create table if not exists favorite_spots (
  id           uuid          default gen_random_uuid() primary key,
  user_id      uuid          not null references auth.users(id) on delete cascade,
  name         text          not null,
  lat          double precision not null,
  lon          double precision not null,
  address      text,
  notes        text,
  created_at   timestamptz   default now()
);

-- ── Parking timers ──────────────────────────────────────────
create table if not exists parking_timers (
  id                 uuid          default gen_random_uuid() primary key,
  user_id            uuid          not null references auth.users(id) on delete cascade,
  spot_name          text,
  lat                double precision not null,
  lon                double precision not null,
  started_at         timestamptz   not null,
  duration_minutes   integer       not null check (duration_minutes > 0),
  -- Expo notification IDs so we can cancel them
  warning_notif_id   text,
  expiry_notif_id    text,
  completed          boolean       default false,
  created_at         timestamptz   default now()
);

-- ── Row Level Security ──────────────────────────────────────
alter table favorite_spots  enable row level security;
alter table parking_timers  enable row level security;

-- Users can only read/write their own rows
create policy "own_favorites" on favorite_spots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_timers" on parking_timers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Indexes ─────────────────────────────────────────────────
create index if not exists idx_favorites_user   on favorite_spots (user_id, created_at desc);
create index if not exists idx_timers_user_active on parking_timers (user_id, completed) where completed = false;
