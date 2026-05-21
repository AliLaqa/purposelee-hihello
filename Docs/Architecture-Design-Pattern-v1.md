# MyHello v1 - Architecture Design Pattern

## Purpose
This document is the living reference for how MyHello v1 is structured and how features should be implemented. It exists to keep the codebase consistent, predictable, and easy to extend without adding unnecessary complexity.

## High-level architecture
- **Frontend:** Next.js App Router (React) deployed on Vercel.
- **Backend:** Supabase (Auth + Postgres + Storage).
- **Auth model:** Cookie-based sessions using `@supabase/ssr`, refreshed through Next.js `proxy.ts`.
- **Public access:** Card pages are public (no login required) and read through Supabase RLS policies.

## Repository layout
### App routes (Next.js)
- `src/app/` - all routes and route handlers.
  - `src/app/auth/` - login and signup UI with an Admin/User toggle.
  - `src/app/dashboard/` - authenticated user area (create/edit card).
  - `src/app/card/[slug]/` - public card page.
  - `src/app/admin/` - admin dashboard (requires admin check).
  - `src/app/api/` - route handlers for server-only operations (admin actions, vCard download, etc.).

### Shared code
- `src/lib/` - non-UI shared logic.
  - `src/lib/supabase/` - Supabase client factories (browser/server/admin) and proxy session refresh helpers.
  - `src/lib/auth/` - auth guards (`requireUser`, `requireAdmin`) and redirect conventions.
  - `src/lib/cards/` - card domain logic (slug rules, vCard generation, helpers).
  - `src/lib/observability/` - optional runtime error reporting initialization and structured logging helpers.
- `src/components/` - reusable UI components (buttons, inputs, layout helpers).

### Database source-of-truth
- `supabase/migrations/` - versioned SQL migrations (tables, indexes, RLS, functions).
- `supabase/seed.sql` - optional seed content for local/dev.
- `supabase/README.md` - how to apply migrations/seed and required manual dashboard steps.

## Data model (v1)
### Tables (public schema)
- `profiles`
  - `id` (uuid, PK, matches `auth.users.id`)
  - `email` (text)
  - `display_name` (text, optional)
  - `is_blocked` (boolean, default false)
  - timestamps
- `cards`
  - `id` (uuid, PK)
  - `user_id` (uuid, FK -> `profiles.id`)
  - `slug` (text, unique)
  - `full_name` (text)
  - `company` (text)
  - `email` (text)
  - `phone` (text)
  - `avatar_path` (text, optional; points into Storage)
  - `is_active` (boolean, default true)
  - timestamps
- `admin_users`
  - `user_id` (uuid, PK)
  - timestamps
- `audit_events` (minimal, optional)
  - `id` (uuid, PK)
  - `actor_user_id` (uuid, nullable)
  - `action` (text)
  - `target_type` (text)
  - `target_id` (text)
  - `metadata` (jsonb)
  - timestamp

### RLS principles
- Public users can **read** card data by `slug` (only active cards and not blocked users).
- Authenticated users can **create/update** only their own card(s), and only when not blocked.
- Admin actions run with Supabase **secret/service role** key (server-only), never from client code.

## Auth and routing rules
### Proxy session refresh
- `src/proxy.ts` runs on requests and calls `updateSession` from `src/lib/supabase/proxy.ts`.
- `updateSession` must call `supabase.auth.getClaims()` to keep cookies fresh and avoid random logouts.

### Guards
- Dashboard routes require an authenticated user (claims validated).
- Admin routes require:
  - authenticated user, AND
  - existence of a row in `admin_users` for `auth.uid()`.

### Admin/User login toggle
- The login UI includes a toggle:
  - **Normal login** routes to `/dashboard`.
  - **Admin login** routes to `/admin` (still requires allowlist check).
- Admins can also use the normal user flows.

## Styling (centralized, minimal)
### Design token rule
Use a small set of global CSS variables as the single source of truth for color.

Target max: **4-6 colors** for the entire app.

Example token set:
- `--color-bg`
- `--color-surface`
- `--color-text`
- `--color-muted`
- `--color-primary`
- `--color-border`

These variables live in `src/app/globals.css` and are referenced by Tailwind utilities via CSS variable mapping.

## Observability (v1)
- **Dev:** Next.js overlay + terminal + browser console.
- **Prod runtime errors:** error tracker (e.g., Sentry) for client + server exceptions.
- **Operational logs:** structured logs in Vercel logs.
- **Database:** only auditable events (no raw stack traces or request bodies).

## Implementation conventions
- Prefer server components and server actions for DB writes.
- Keep form validation minimal and explicit (Zod optional; avoid over-engineering).
- Keep the UI consistent via reusable primitives (`Button`, `Input`, `Field`, `CardShell`).
- Never expose Supabase secret/service-role key to the browser.

