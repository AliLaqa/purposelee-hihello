-- MyHello v1.1 invite-only signup support
-- Apply in Supabase SQL editor after v1 migrations.

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked')),
  created_by uuid references public.profiles(id) on delete set null,
  accepted_user_id uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_invites_email on public.invites(email);
create index if not exists idx_invites_status on public.invites(status);
create index if not exists idx_invites_created_at on public.invites(created_at);

alter table public.invites enable row level security;

drop policy if exists "invites: no client access" on public.invites;
create policy "invites: no client access"
on public.invites
for all
to public
using (false)
with check (false);

grant select, insert, update, delete on table public.invites to service_role;
