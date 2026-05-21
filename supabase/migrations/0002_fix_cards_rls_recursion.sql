-- Fix for SQLSTATE 42P17 (infinite recursion detected in policy for relation)
-- The original insert policy referenced `public.cards` to count rows, which can recurse under RLS.
-- Enforce "one card per user" with a unique index instead.

create unique index if not exists uniq_cards_user_id on public.cards(user_id);

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

