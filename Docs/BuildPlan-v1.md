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

### Step A - Project foundation [Partially implemented]
#### A.1 - Initialize Next.js (App Router) + TypeScript [Implemented]
#### A.2 - Baseline linting and styling (ESLint + Tailwind) [Implemented]
#### A.3 - Define env var strategy and local config approach [Not implemented]

### Step B - Supabase project setup [Not implemented]
#### B.1 - Create Supabase project [Not implemented]
#### B.2 - Configure Supabase Auth providers (minimal) [Not implemented]
#### B.3 - Create Storage bucket(s) for card images [Not implemented]
#### B.4 - Configure app env vars (public URL + anon key; server-only service role key) [Not implemented]

### Step C - Database schema + RLS policies [Not implemented]
#### C.1 - Create `cards` (or `profiles`) table with ownership (`user_id`) and `slug` [Not implemented]
#### C.2 - Add constraints (unique `slug`, required fields) [Not implemented]
#### C.3 - Add RLS: owner can create/update; public can read by `slug` [Not implemented]
#### C.4 - Add "blocked/disabled" handling for users (minimal mechanism) [Not implemented]

### Step D - Authentication UX (User + Admin) [Not implemented]
#### D.1 - Implement normal user login/signup pages [Not implemented]
#### D.2 - Add login mode toggle (Admin vs Normal) on the login screen [Not implemented]
#### D.3 - Enforce server-side admin verification for admin routes [Not implemented]
#### D.4 - Ensure admin can also use normal user flows [Not implemented]

### Step E - Card editor (create/edit) [Not implemented]
#### E.1 - Create dashboard page for card creation/edit [Not implemented]
#### E.2 - Implement slug creation + validation rules [Not implemented]
#### E.3 - Save card data to Supabase [Not implemented]
#### E.4 - Enforce card count limit per user (start at 1; optionally cap at 3) [Not implemented]

### Step F - Image upload [Not implemented]
#### F.1 - Upload image to Supabase Storage [Not implemented]
#### F.2 - Store image reference (path/url) on the card record [Not implemented]
#### F.3 - Display image in editor preview + public card page [Not implemented]

### Step G - Public card page [Not implemented]
#### G.1 - Implement `/card/[slug]` route rendering card data [Not implemented]
#### G.2 - Handle not-found / disabled-card scenarios [Not implemented]
#### G.3 - Add basic SEO + Open Graph metadata [Not implemented]

### Step H - Sharing (link + QR + email) [Not implemented]
#### H.1 - Add copy-link button [Not implemented]
#### H.2 - Add Web Share API support (fallback to copy) [Not implemented]
#### H.3 - Generate QR code from public URL [Not implemented]
#### H.4 - Add email share via `mailto:` with prefilled subject/body [Not implemented]

### Step I - vCard download [Not implemented]
#### I.1 - Generate `.vcf` from card fields [Not implemented]
#### I.2 - Add "Save contact" / download action on the card page [Not implemented]
#### I.3 - Verify import works on iOS/Android [Not implemented]

### Step J - Admin dashboard (minimum) [Not implemented]
#### J.1 - Admin dashboard layout + navigation [Not implemented]
#### J.2 - User list + ability to block/disable [Not implemented]
#### J.3 - Ability to delete users (and associated card data) [Not implemented]
#### J.4 - Basic card management view (optional, minimal) [Not implemented]

### Step K - Polish and guardrails [Not implemented]
#### K.1 - Mobile layout checks + UI polish [Not implemented]
#### K.2 - Loading/error/empty states [Not implemented]
#### K.3 - Basic abuse controls on public endpoints (minimal) [Not implemented]

### Step L - Deployment + smoke test [Not implemented]
#### L.1 - Deploy to Vercel [Not implemented]
#### L.2 - Configure env vars + Auth redirect URLs [Not implemented]
#### L.3 - End-to-end smoke test (signup -> create -> share -> QR scan -> vCard import) [Not implemented]

### Step M - Observability (errors + logs) [Not implemented]
#### M.1 - Dev debugging via Next.js + console logs [Implemented]
#### M.2 - Runtime error tracking in Prod (client + server) [Not implemented]
#### M.3 - Structured server logging to Vercel logs [Not implemented]
#### M.4 - DB audit events only (no raw stack traces) [Not implemented]
