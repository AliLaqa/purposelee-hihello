-- Fix public card viewing for unauthenticated users.
-- Previous policy referenced `public.profiles` which can break anon access (and/or cause 404s).
-- v1 uses `cards.is_active` to control public visibility.

drop policy if exists "cards: public read active" on public.cards;
create policy "cards: public read active"
on public.cards
for select
to public
using (is_active = true);

