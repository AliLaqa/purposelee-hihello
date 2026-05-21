-- Grants for Data API roles when "Automatically expose new tables" is disabled.
-- Without these GRANTs, PostgREST requests can fail with SQLSTATE 42501.

grant usage on schema public to anon, authenticated, service_role;

-- Public card pages (unauthenticated reads)
grant select on table public.cards to anon;

-- Authenticated user CRUD (guarded by RLS)
grant select, insert, update, delete on table public.cards to authenticated;
grant select, update on table public.profiles to authenticated;
grant select on table public.admin_users to authenticated;

-- Server-side/admin (service role) operations
grant select, insert, update, delete on table public.cards to service_role;
grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.admin_users to service_role;
grant insert on table public.audit_events to service_role;

