# MyHello v1.1 Build Plan

## Summary
MyHello v1.1 is a small follow-up release after v1, focused on **operational/admin improvements** discovered during real usage. It keeps the same product scope and UX, but adds missing guardrails and maintenance tooling so the system stays clean and manageable over time (especially Supabase Storage).

## KPIs (v1.1)
- **Operational hygiene:** Admin can reliably identify and delete orphaned avatar files from Supabase Storage.
- **Safety:** Orphan cleanup supports preview/dry-run semantics and prevents accidental mass deletions.
- **Auditability:** Orphan cleanup actions are recorded in `public.audit_events` (who did what, when, and what was affected).
- **Usability:** Orphan cleanup UI clearly lists the orphaned file paths and the derived user UUID/folder.
- **Admin presence control:** Admin can remove their public presence (deactivate card) without losing admin access, and restore it later without data loss.
- **Card cap control:** System enforces a configurable per-user card limit both in the app layer and in the database layer.
- **Card removal UX:** Users/admins can remove cards with explicit confirmation and clear post-delete behavior.
- **Admin identity clarity:** Admin dashboard shows who is signed in (email + optional display name).
- **Share preview quality:** Shared public card links render correct Open Graph / Twitter previews (title/description/image) on common platforms.

## Functionalities (v1.1)
- **Admin orphaned Storage cleanup**: Admin dashboard can scan Supabase Storage (`avatars`) for orphaned files, display exact identifiers (user UUID/folder + full object paths), and delete selected or all orphaned files after confirmation.
- **Admin “Remove my presence”**: Admin can deactivate their own public card without deleting/clearing any profile/card fields or Storage files, so it can be restored later.
- **Configurable per-user card limit (>1)**: Increase the per-user card cap beyond 1 (e.g., 3) with enforcement in both application logic and database triggers/constraints.
- **User card deletion**: Allow a normal user to delete/deactivate their own card (with a confirmation step) and remove the associated avatar file(s) if desired.
- **Admin card deletion**: Allow an admin to delete a normal user’s card (without deleting the user), with an explicit confirmation step and an audit event.
- **Admin “Signed in as” header**: Show the logged-in admin’s email (and optional display name) in the admin dashboard header; allow updating `profiles.display_name`.
- **Admin sign-out from `/admin`**: Provide a sign-out button/action directly in the admin dashboard header.
- **Separate auth pages (Sign in / Sign up)**: Split the combined `/auth` page into dedicated Sign in and Sign up pages for a clearer UX.
- **Admin-only invitations (no public signup)**: Only invited users can create accounts; disable open/public signup.
- **Open Graph link previews**: Public card links (`/card/[slug]`) produce rich previews (title/description/image) on chat/social apps.

## What NOT to implement (out of scope for v1.1)
- Auto-scheduled background cleanup jobs / cron-based deletion
- Full file browser UI for the `avatars` bucket
- Advanced analytics dashboards or storage usage reporting
- Bulk exports or long-term retention policies
- Persisting raw stack traces or request bodies in Postgres

## Build Plan (v1.1)

### Step A - Orphaned Storage cleanup (Admin) [Not implemented]
Implementation: Add admin-only pages/actions to scan `avatars` bucket, preview orphan candidates, and delete them safely with audit logs.
#### A.1 - Define what “orphaned” means for `avatars/` [Not implemented] [Not tested]
Implementation: Treat any object under `avatars/<user_id>/...` as orphaned when `<user_id>` does not exist in `public.profiles.id` (or `auth.users.id` when available server-side).
#### A.2 - Add server action to scan for orphan candidates [Not implemented] [Not tested]
Implementation: Use the service-role Supabase client to enumerate objects (via Storage API or `storage.objects`) and compare folder user IDs against current users; return a deduplicated list (user_id + object paths).
#### A.3 - Add admin UI to preview orphaned files [Not implemented] [Not tested]
Implementation: In `/admin`, add an “Orphaned files” section/table showing: derived `user_id`, object path(s), count, and last updated/created when available.
#### A.4 - Add delete action with safety confirmations [Not implemented] [Not tested]
Implementation: Require an explicit confirmation step (and optionally a “type DELETE” prompt) before deletion; allow per-user-folder delete and/or per-object delete.
#### A.5 - Record actions to `public.audit_events` [Not implemented] [Not tested]
Implementation: Insert an audit row per cleanup run (and optionally per deleted folder) including counts and example paths in `metadata`.
#### A.6 - Add guardrails to prevent accidental mass deletion [Not implemented] [Not tested]
Implementation: Add a hard cap per run (configurable) and require a second confirmation when deletions exceed a threshold.

### Step B - Admin “Remove my presence” [Not implemented]
Implementation: Add an explicit admin-only action to deactivate (and later restore) the admin’s public card without deleting/clearing any profile/card fields or Storage files, and without deleting the auth user or removing the `admin_users` allowlist row.
#### B.1 - Add server action to deactivate admin card [Not implemented] [Not tested]
Implementation: Update the admin’s `cards` row to set `is_active=false` (do not clear `avatar_path` or other fields).
#### B.2 - Add server action to restore admin card [Not implemented] [Not tested]
Implementation: Update the admin’s `cards` row to set `is_active=true` so the existing card + avatar come back without re-uploading.
#### B.3 - Add admin UI entrypoint + confirmations [Not implemented] [Not tested]
Implementation: Add a “Remove presence” / “Restore presence” action in `/admin` for the current admin with a clear warning/confirm step.
#### B.4 - Record actions in `audit_events` [Not implemented] [Not tested]
Implementation: Insert audit events like `admin.remove_presence` / `admin.restore_presence` with minimal metadata (what changed).

### Step C - Configurable per-user card limit (>1) [Not implemented]
Implementation: Replace the current DB unique constraint on `cards.user_id` with a configurable cap enforced in both app logic and the database.
#### C.1 - Remove the 1-card-per-user unique constraint [Not implemented] [Not tested]
Implementation: Drop the unique index `uniq_cards_user_id` so multiple cards per user are possible.
#### C.2 - Add app-layer enforcement for the configured cap [Not implemented] [Not tested]
Implementation: In the card creation flow, query the current user’s card count and refuse creation when it would exceed the cap (clear error message).
#### C.3 - Add DB-layer enforcement for the configured cap [Not implemented] [Not tested]
Implementation: Add a DB trigger/function to prevent inserts beyond the cap (defense-in-depth; avoids bypass via direct API calls).
#### C.4 - Add tests / manual verification checklist [Not implemented] [Not tested]
Implementation: Verify user can create up to N cards, cannot create N+1, and that separate users each get their own cap.

### Step D - Card deletion (User + Admin) [Not implemented]
Implementation: Add explicit delete/deactivate flows for cards without deleting the underlying auth user (admin can delete a user’s card independently).
#### D.1 - Add user card delete/deactivate action + confirmation [Not implemented] [Not tested]
Implementation: Add a “Delete card” (or “Deactivate card”) action in `/dashboard/card` with a confirmation prompt; define whether it hard-deletes the row or sets `is_active=false`.
#### D.2 - Handle avatar cleanup on user card delete (optional) [Not implemented] [Not tested]
Implementation: If hard-deleting a card, optionally remove `avatars/<user_id>/*` (or just the referenced `avatar_path`) so Storage doesn’t accumulate unused files.
#### D.3 - Add admin action to delete a user’s card only (not the user) + confirmation [Not implemented] [Not tested]
Implementation: In `/admin`, add a “Delete card” action per user that deletes the card row (or deactivates it) without deleting the profile/auth user; confirm before applying.
#### D.4 - Record card deletion actions in `audit_events` [Not implemented] [Not tested]
Implementation: Insert audit events like `admin.delete_card` / `user.delete_card` with target card id/user id in metadata.

### Step E - Admin identity in dashboard [Not implemented]
Implementation: Display the currently logged-in admin identity (email + optional display name) and allow editing the display name.
#### E.1 - Show “Signed in as” email in `/admin` header [Not implemented] [Not tested]
Implementation: Resolve the current admin’s email and show it near the page title/header.
#### E.2 - Show display name (optional) and fall back to email [Not implemented] [Not tested]
Implementation: If `profiles.display_name` is set, show it alongside the email; otherwise show email only.
#### E.3 - Allow admin to update their `profiles.display_name` [Not implemented] [Not tested]
Implementation: Add a small inline edit form in `/admin` that updates `profiles.display_name` for the current admin.

### Step F - Admin sign-out button [Not implemented]
Implementation: Add a sign-out action/button to the `/admin` header so admins can log out without navigating to `/dashboard`.
#### F.1 - Add sign-out button in `/admin` header [Not implemented] [Not tested]
Implementation: Reuse the existing `signOut` server action and render a form/button in the admin header.

### Step G - Split auth page into Sign in / Sign up [Not implemented]
Implementation: Replace the combined `/auth` layout with separate pages (or routes) for Sign in and Sign up, keeping the existing auth actions and admin/user login mode toggle where applicable.
#### G.1 - Create dedicated Sign in page [Not implemented] [Not tested]
Implementation: Move the login form to a separate page (e.g., `/auth/sign-in`) with a clear link to Sign up.
#### G.2 - Create dedicated Sign up page [Not implemented] [Not tested]
Implementation: Move the signup form to a separate page (e.g., `/auth/sign-up`) with a clear link to Sign in.
#### G.3 - Preserve Admin/User login mode behavior for Sign in [Not implemented] [Not tested]
Implementation: Keep the “Admin login / Normal login” toggle on the Sign in page so admins can still route to `/admin`.
#### G.4 - Keep `/auth` as a redirect (optional) [Not implemented] [Not tested]
Implementation: Optionally make `/auth` redirect to `/auth/sign-in` to preserve existing links/bookmarks.

### Step H - Admin invitations + disable public signup [Not implemented]
Implementation: Add an admin invite flow so only invited users can sign up; block/disable open signup for everyone else.
#### H.1 - Create `invites` table and policies [Not implemented] [Not tested]
Implementation: Add a table to store invite email, token, status, created_by admin id, and expiry; allow admin-only management.
#### H.2 - Admin UI to create/revoke invites [Not implemented] [Not tested]
Implementation: Add an “Invites” section in `/admin` to create an invite (email) and revoke it before use.
#### H.3 - Signup flow requires valid invite token [Not implemented] [Not tested]
Implementation: Modify signup to require an invite token tied to the email; refuse signup when not invited.
#### H.4 - Email delivery strategy (minimal) [Not implemented] [Not tested]
Implementation: Start with copyable invite link (no provider); later swap to SMTP/provider if needed.
#### H.5 - Audit invite actions [Not implemented] [Not tested]
Implementation: Record `admin.create_invite`, `admin.revoke_invite`, `invite.accepted` in `audit_events`.

### Step I - Open Graph / Twitter metadata for public cards [Not implemented]
Implementation: Add dynamic metadata generation for `/card/[slug]` so shared links display rich previews (title/description/image) in chat/social platforms.
#### I.1 - Implement `generateMetadata()` for `/card/[slug]` [Not implemented] [Not tested]
Implementation: Fetch card data by `slug` and generate `title`/`description` dynamically.
#### I.2 - Add Open Graph (`og:*`) metadata [Not implemented] [Not tested]
Implementation: Set `openGraph` metadata including `title`, `description`, `url`, and `images` when an avatar exists.
#### I.3 - Add Twitter card metadata [Not implemented] [Not tested]
Implementation: Set `twitter` metadata (`summary`/`summary_large_image`) aligned with Open Graph fields.
#### I.4 - Handle missing avatar / missing card safely [Not implemented] [Not tested]
Implementation: Use a default image or omit `images`; fall back to generic metadata for not-found/inactive cards.
