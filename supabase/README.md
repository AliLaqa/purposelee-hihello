# Supabase (Database + Storage) - MyHello v1

This folder contains the database source-of-truth for MyHello v1.

## What lives here
- `supabase/migrations/` - versioned SQL migrations (schema, RLS policies, triggers).
- `supabase/seed.sql` - optional seed data for local/dev.

## How to apply (hosted Supabase)
1. Create a Supabase project.
2. Open **SQL Editor** in Supabase Dashboard.
3. Run migrations in order (lowest number first) from `supabase/migrations/`.
4. (Optional) Run `supabase/seed.sql`.
5. Create a Storage bucket named `avatars` (if you did not run the bucket SQL, or if it fails due to permissions).

## Required environment variables (app)
Set these in `.env.local` (for local dev) and in Vercel project env vars (for production):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server-only; used for admin actions like blocking/deleting users)

## Notes
- The `SUPABASE_SECRET_KEY` must never be exposed to the browser.
- Public card pages rely on RLS policies that allow public `SELECT` on active cards.

