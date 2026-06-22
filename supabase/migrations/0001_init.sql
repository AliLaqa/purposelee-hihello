-- MyHello v1 schema + RLS
-- Apply in Supabase SQL editor.

-- Extensions
create extension if not exists "pgcrypto";

-- Utility: updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Cards (one per user by default; enforced by unique constraint on user_id)
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  full_name text not null,
  company text not null,
  email text not null,
  phone text not null,
  avatar_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cards_user_id on public.cards(user_id);
create unique index if not exists uniq_cards_user_id on public.cards(user_id);

drop trigger if exists trg_cards_set_updated_at on public.cards;
create trigger trg_cards_set_updated_at
before update on public.cards
for each row execute function public.set_updated_at();

-- Admin allowlist
create table if not exists public.admin_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Auditable events (optional)
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Trigger: create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.admin_users enable row level security;
alter table public.audit_events enable row level security;

-- PROFILES policies
drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles: update own (not blocked)" on public.profiles;
create policy "profiles: update own (not blocked)"
on public.profiles
for update
to authenticated
using (id = auth.uid() and is_blocked = false)
with check (id = auth.uid() and is_blocked = false);

-- CARDS policies
drop policy if exists "cards: public read active" on public.cards;
create policy "cards: public read active"
on public.cards
for select
to public
using (is_active = true);

drop policy if exists "cards: insert own (limit 1, not blocked)" on public.cards;
create policy "cards: insert own (limit 1, not blocked)"
on public.cards
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.is_blocked = false
  )
);

drop policy if exists "cards: update own (not blocked)" on public.cards;
create policy "cards: update own (not blocked)"
on public.cards
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.is_blocked = false
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.is_blocked = false
  )
);

drop policy if exists "cards: delete own (not blocked)" on public.cards;
create policy "cards: delete own (not blocked)"
on public.cards
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.is_blocked = false
  )
);

-- ADMIN_USERS policies: allow users to check if they are admins
drop policy if exists "admin_users: select own" on public.admin_users;
create policy "admin_users: select own"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

-- AUDIT_EVENTS policies: no direct client access in v1
drop policy if exists "audit_events: no client access" on public.audit_events;
create policy "audit_events: no client access"
on public.audit_events
for all
to public
using (false)
with check (false);

-- Storage setup (avatars bucket + policies)
--
-- NOTE (hosted Supabase):
-- Many projects cannot ALTER or CREATE POLICY on `storage.objects` from the SQL Editor
-- due to ownership restrictions (error: "must be owner of table objects").
--
-- Do this in the Dashboard UI instead:
-- 1) Storage -> Buckets -> Create bucket named `avatars` (Public: ON)
-- 2) Storage -> Policies -> New policy on `storage.objects` (operation: INSERT)
--    Use this condition:
--      bucket_id = 'avatars'
--      AND (storage.foldername(name))[1] = (select auth.uid()::text)
-- 3) Storage -> Policies -> New policy on `storage.objects` (operation: DELETE)
--    Use this condition:
--      bucket_id = 'avatars'
--      AND (storage.foldername(name))[1] = (select auth.uid()::text)
--
-- In v1 the app uploads avatars to a unique path `${auth.uid()}/{uuid}.ext`,
-- so INSERT is sufficient for uploads (no upsert/overwrite required), and
-- DELETE is needed for self-service avatar removal and cleanup.
