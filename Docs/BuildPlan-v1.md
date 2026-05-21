# MyHello v1 Build Plan

## Summary
MyHello v1 is an internal-use, web-only digital business card builder inspired by HiHello. Users can sign up with normal authentication (open signup; no paywall; no domain allowlist), create an employee card, and share it via a public link and QR code that anyone can view without logging in. This is treated as **Version 1** (no MVP/beta/prototype/staging phases), built to be reliable enough for production-like internal usage by ~5-10 people. The focus is speed-to-usable, mobile-friendly web UX, and a minimal admin dashboard.

## KPIs (v1)
- **Versioning approach:** This is **Version 1** (no MVP/beta/prototype/staging track).
- **Access model:** Open signup (no paywall, no domain allowlist); card viewing requires **no login**.
- **Time-to-first-share:** A new user can go from signup to a shareable card link in **<= 5 minutes**.
- **Share reliability:** Copy link works; QR scan opens the public card page; email share opens a compose window with the link.
- **Mobile usability:** Card page and editor remain usable across common mobile widths (no broken layout).
- **Contact saving:** vCard (`.vcf`) download imports correctly on iOS/Android.
- **Admin control:** Admin can view/manage users and block/disable or delete accounts when needed.
- **Prod error visibility:** Unhandled client/server errors are captured in an error tracker with enough context to debug (stack trace + breadcrumbs).

## Functionalities (v1)
- **User authentication**: Users can sign up, sign in, and sign out using Supabase Auth.
- **Login mode toggle (Admin/User)**: The login screen includes a clear toggle for "Admin login" vs "Normal login"; admin login routes to the admin dashboard. Admins can also use the app as normal users.
- **Create/Edit employee card**: A simple editor to manage photo/logo, name, company, email, and phone number.
- **Upload photo/logo**: Image upload stored in Supabase Storage and attached to the card.
- **Generate public card page**: A public URL (e.g., `/card/[slug]`) that displays the card without requiring login.
- **Generate QR code**: QR code generated from the public card URL for quick sharing/scanning.
- **Share link**: Copy link button plus Web Share API support where available.
- **Share by email**: Email sharing via a `mailto:` link prefilled with the card URL (no email provider required in v1).
- **Save contact / download vCard**: Generate and download a `.vcf` file so recipients can save the contact on their phone.
- **Mobile-friendly web view**: Responsive design for card view and editor, optimized for mobile browsers.
- **Admin dashboard (minimum)**: Basic tools to view users/cards and block/disable or delete users when required.
- **Admin safety guardrails**: Prevent admins from deleting themselves, prevent deleting the last remaining admin, and provide a separate "remove my presence" action (deactivate card + optional profile anonymization) without deleting the auth account.
- **Runtime error reporting (Prod)**: Capture client + server exceptions in an error tracker (e.g., Sentry) with stack traces and breadcrumbs.
- **Structured app logging (Prod)**: Use Vercel logs for operational debugging; keep DB writes for auditable events only (e.g., "card updated", "admin blocked user"), not raw stack traces.

## What NOT to implement (out of scope for v1)
- Native mobile apps
- NFC card system
- Advanced analytics dashboards
- CRM integrations
- Lead capture forms
- Team roles/permissions (beyond a simple admin access mechanism)
- Email signature generator
- Virtual background generator
- Multiple card templates/themes
- A public directory/search/listing of cards
- Paywall/subscriptions/billing
- Domain allowlisting / domain gating
- Persist raw stack traces or request bodies in Postgres

## Build Plan (v1)

### Step A - Project foundation [Implemented]
Implementation: Next.js App Router project scaffolded, with centralized styling tokens and baseline configs committed.
#### A.1 - Initialize Next.js (App Router) + TypeScript [Implemented]
Implementation: Bootstrapped via `create-next-app` with `--ts --app --src-dir` and validated with `npm run build`.
#### A.2 - Baseline linting and styling (ESLint + Tailwind) [Implemented]
Implementation: ESLint config uses `eslint-config-next`, and styling uses Tailwind + CSS variables in `src/app/globals.css`.
#### A.3 - Define env var strategy and local config approach [Implemented]
Implementation: `.env.example` documents required vars; `src/lib/env.ts` reads/validates Supabase config and supports safe fallbacks.

### Step B - Supabase project setup [Implemented]
Implementation: Setup is performed in Supabase Dashboard; the repo provides migrations/README and the app reads keys from `.env.local`.
#### B.1 - Create Supabase project [Implemented]
Implementation: Created in Supabase Dashboard (region closest to users; Data API enabled; "Automatically expose new tables" may be OFF).
#### B.2 - Configure Supabase Auth providers (minimal) [Implemented]
Implementation: Email/password auth is used; email confirmations can be disabled for local testing to avoid email rate limits.
#### B.3 - Create Storage bucket(s) for card images [Implemented]
Implementation: Bucket `avatars` is created as Public, and an INSERT policy allows uploads only to `${auth.uid()}/...` paths.
#### B.4 - Configure app env vars (public URL + anon key; server-only service role key) [Implemented]
Implementation: `.env.local` sets `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `NEXT_PUBLIC_SITE_URL`.

### Step C - Database schema + RLS policies [Implemented]
Implementation: Schema/RLS are defined in `supabase/migrations/*.sql` and applied via Supabase SQL Editor in order.
#### C.1 - Create `cards` (or `profiles`) table with ownership (`user_id`) and `slug` [Implemented]
Implementation: `public.profiles` (signup trigger) and `public.cards` tables are created in `supabase/migrations/0001_init.sql`.
#### C.2 - Add constraints (unique `slug`, required fields) [Implemented]
Implementation: `cards.slug` is unique and v1 enforces one card per user via `uniq_cards_user_id` (see `0002_fix_cards_rls_recursion.sql`).
#### C.3 - Add RLS: owner can create/update; public can read by `slug` [Implemented]
Implementation: RLS allows public SELECT for active cards and owner-only writes; public policy was corrected in `0004_fix_public_cards_policy.sql`.
#### C.4 - Add "blocked/disabled" handling for users (minimal mechanism) [Implemented]
Implementation: `profiles.is_blocked` blocks usage, and admin block also flips `cards.is_active` to disable public viewing.

### Step D - Authentication UX (User + Admin) [Implemented]
Implementation: Auth uses Supabase sessions via `@supabase/ssr` with server actions for login/signup and cookie refresh via proxy.
#### D.1 - Implement normal user login/signup pages [Implemented]
Implementation: `/auth` UI + server actions live in `src/app/auth/page.tsx` and `src/app/auth/actions.ts`.
#### D.2 - Add login mode toggle (Admin vs Normal) on the login screen [Implemented]
Implementation: Radio toggle in `/auth` posts `login_mode` and redirects to `/dashboard` or `/admin`.
#### D.3 - Enforce server-side admin verification for admin routes [Implemented]
Implementation: `requireAdmin()` checks `public.admin_users` (allowlist) before rendering `/admin`.
#### D.4 - Ensure admin can also use normal user flows [Implemented]
Implementation: Admins use the same credentials; only `/admin` is guarded by allowlist, normal `/dashboard` remains accessible.

### Step E - Card editor (create/edit) [Implemented]
Implementation: Card editor is in `/dashboard/card` with a server action that inserts/updates `public.cards` for the current user.
#### E.1 - Create dashboard page for card creation/edit [Implemented]
Implementation: `/dashboard` and `/dashboard/card` are implemented in `src/app/dashboard/page.tsx` and `src/app/dashboard/card/page.tsx`.
#### E.2 - Implement slug creation + validation rules [Implemented]
Implementation: `slugify()` and `isValidSlug()` live in `src/lib/cards/slug.ts` and are enforced in the card save action.
#### E.3 - Save card data to Supabase [Implemented]
Implementation: `upsertCard()` in `src/app/dashboard/card/actions.ts` uses Supabase SSR client to insert/update the user's card.
#### E.4 - Enforce card count limit per user (start at 1; optionally cap at 3) [Implemented]
Implementation: One-card-per-user is enforced via DB unique index `uniq_cards_user_id` (not via an RLS self-query).

### Step F - Image upload [Implemented]
Implementation: Images upload to the `avatars` bucket using the user-id folder path convention and are read via public URL.
#### F.1 - Upload image to Supabase Storage [Implemented]
Implementation: `upsertCard()` uploads the selected file to `avatars` at `${userId}/{uuid}.ext` (no overwrite/upsert required).
#### F.2 - Store image reference (path/url) on the card record [Implemented]
Implementation: The Storage object path is stored in `cards.avatar_path` and reused for subsequent renders.
#### F.3 - Display image in editor preview + public card page [Implemented]
Implementation: Both pages call `supabase.storage.from('avatars').getPublicUrl(avatar_path)` and render the resulting URL.

### Step G - Public card page [Implemented]
Implementation: `/card/[slug]` reads card data by slug with public RLS access and renders a mobile-friendly card view.
#### G.1 - Implement `/card/[slug]` route rendering card data [Implemented]
Implementation: `src/app/card/[slug]/page.tsx` queries `public.cards` by `slug` and renders details + QR + actions.
#### G.2 - Handle not-found / disabled-card scenarios [Implemented]
Implementation: Missing/blocked cards return `notFound()` and public visibility is controlled by `cards.is_active` + RLS.
#### G.3 - Add basic SEO + Open Graph metadata [Partially implemented]
Implementation: Base app metadata is set in `src/app/layout.tsx`; OG/image metadata for `/card/[slug]` is not customized in v1.

### Step H - Sharing (link + QR + email) [Implemented]
Implementation: Sharing actions are client-side in `src/components/share/share_actions.tsx` and use the public card URL.
#### H.1 - Add copy-link button [Implemented]
Implementation: Copy uses `navigator.clipboard` when available with fallbacks for insecure contexts (execCommand/prompt).
#### H.2 - Add Web Share API support (fallback to copy) [Implemented]
Implementation: If `navigator.share` exists, a Share button calls `navigator.share({ title, url })`.
#### H.3 - Generate QR code from public URL [Implemented]
Implementation: `react-qr-code` renders a QR for `NEXT_PUBLIC_SITE_URL + /card/<slug>` in `src/app/card/[slug]/page.tsx`.
#### H.4 - Add email share via `mailto:` with prefilled subject/body [Implemented]
Implementation: Mailto is generated client-side with `subject` + `body` containing the public link.

### Step I - vCard download [Implemented]
Implementation: vCard content is generated server-side from DB data and returned as an attachment for phone import.
#### I.1 - Generate `.vcf` from card fields [Implemented]
Implementation: `src/lib/cards/vcard.ts` builds a vCard 3.0 string from name/company/email/phone.
#### I.2 - Add "Save contact" / download action on the card page [Implemented]
Implementation: Button links to `src/app/card/[slug]/vcard/route.ts`, which returns the `.vcf` with download headers.
#### I.3 - Verify import works on iOS/Android [Implemented]
Implementation: Manual test completed (downloaded `.vcf` opens as contact card on mobile and can be saved).

### Step J - Admin dashboard (minimum) [Partially implemented]
Implementation: `/admin` uses a service-role Supabase client (server-only) and an allowlist table `public.admin_users`; safety guardrails (self-delete / last-admin protections) are pending.
#### J.1 - Admin dashboard layout + navigation [Implemented]
Implementation: Admin page is `src/app/admin/page.tsx` with simple table layout and dashboard back-link.
#### J.2 - User list + ability to block/disable [Implemented]
Implementation: `setUserBlocked()` in `src/app/admin/actions.ts` toggles `profiles.is_blocked` and flips `cards.is_active`.
#### J.3 - Ability to delete users (and associated card data) [Partially implemented]
Implementation: `deleteUser()` removes cards/profile and best-effort deletes the auth user via `admin.auth.admin.deleteUser()`; it does not delete avatar files from Storage yet, and protections for self-delete / last-admin delete are not enforced yet.
#### J.4 - Basic card management view (optional, minimal) [Implemented]
Implementation: Admin list shows user's first card slug/name and links to the public card page.
#### J.5 - Prevent admins from deleting themselves [Not implemented]
Implementation: Hide the Delete button for `actorUserId` and enforce a server-side check in `deleteUser()` to reject self-deletes.
#### J.6 - Prevent deleting the last remaining admin [Not implemented]
Implementation: In `deleteUser()`, count remaining rows in `public.admin_users` and block deletion when it would remove the last admin.
#### J.7 - "Remove my presence" without deleting auth account [Not implemented]
Implementation: Add an action to deactivate the admin's card (and optionally anonymize profile/card fields) while keeping the auth user and `admin_users` row intact.
#### J.8 - Delete user's Storage files on user delete [Not implemented]
Implementation: Before deleting the auth user, delete `avatars/<user_id>/*` from Supabase Storage (service-role client) to avoid orphaned files.

### Step K - Polish and guardrails [Partially implemented]
Implementation: UI uses a small tokenized palette and basic states; additional production hardening (rate limits) is deferred.
#### K.1 - Mobile layout checks + UI polish [Implemented]
Implementation: Public card and editor layouts were verified on mobile (QR open + responsive layout).
#### K.2 - Loading/error/empty states [Implemented]
Implementation: Auth and card editor render friendly error messages and show "No card yet" empty state on `/dashboard`.
#### K.3 - Basic abuse controls on public endpoints (minimal) [Not implemented]
Implementation: Not added in v1; can be implemented via simple IP throttling or middleware-based limits if needed.

### Step L - Deployment + smoke test [Partially implemented]
Implementation: Local end-to-end testing is complete; Vercel deployment configuration is pending.
#### L.1 - Deploy to Vercel [Not implemented]
Implementation: Pending (requires Vercel project creation and production env vars).
#### L.2 - Configure env vars + Auth redirect URLs [Partially implemented]
Implementation: `.env.local` is configured for local; production requires setting Vercel env vars + Supabase redirect URLs.
#### L.3 - End-to-end smoke test (signup -> create -> share -> QR scan -> vCard import) [Implemented]
Implementation: Verified locally: signup/login -> create card -> public link -> QR scan -> vCard download/import.

### Step M - Observability (errors + logs) [Partially implemented]
Implementation: Structured logging is in place and the app has a global error boundary; Sentry DSN wiring is optional.
#### M.1 - Dev debugging via Next.js + console logs [Implemented]
Implementation: Dev uses Next.js overlay and server logs; key server actions also log failures (e.g., card insert/update).
#### M.2 - Runtime error tracking in Prod (client + server) [Partially implemented]
Implementation: `SENTRY_DSN` is supported; `src/app/global-error.tsx` captures client errors and `sentry_server.ts` is available for server use.
#### M.3 - Structured server logging to Vercel logs [Implemented]
Implementation: `src/lib/observability/log.ts` emits JSON logs to stdout/stderr which Vercel captures.
#### M.4 - DB audit events only (no raw stack traces) [Partially implemented]
Implementation: Admin actions insert `audit_events`; persistence of broader audit events can be added later (no stack traces stored).
