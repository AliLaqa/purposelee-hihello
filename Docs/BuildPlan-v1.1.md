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
- **Account recovery:** Users can request a password reset and successfully set a new password via an in-app flow (Supabase-hosted email + app page).
- **Deleted-user session safety:** Deleted users cannot continue using dashboard/card routes through stale browser sessions.

## Functionalities (v1.1)
- **Admin orphaned Storage cleanup**: Admin dashboard can scan Supabase Storage (`avatars`) for orphaned files, display exact identifiers (user UUID/folder + full object paths), and delete selected or all orphaned files after confirmation.
- **Admin “Remove my presence”**: Admin can deactivate their own public card without deleting/clearing any profile/card fields or Storage files, so it can be restored later.
- **Configurable per-user card limit (>1)**: Increase the per-user card cap beyond 1 (e.g., 3) with enforcement in both application logic and database triggers/constraints.
- **User card deletion**: Allow a normal user to delete/deactivate their own card (with a confirmation step) and remove the associated avatar file(s) if desired.
- **Admin card deletion**: Allow an admin to delete a normal user’s card (without deleting the user), with an explicit confirmation step and an audit event.
- **Admin “Signed in as” header**: Show the logged-in admin’s email (and optional display name) in the admin dashboard header; allow updating `profiles.display_name`.
- **Admin sign-out from `/admin`**: Provide a sign-out button/action directly in the admin dashboard header.
- **Admin return navigation from dashboard**: Show an admin-only link from `/dashboard` back to `/admin` so admins can move between their normal user dashboard and admin panel.
- **Admin manual refresh controls**: Add per-section refresh buttons in `/admin` so admins can reload stale Users and Invites data after changes made outside the admin panel.
- **Separate auth pages (Sign in / Sign up)**: Split the combined `/auth` page into dedicated Sign in and Sign up pages for a clearer UX.
- **Admin-only invitations (no public signup)**: Only invited users can create accounts; disable open/public signup.
- **Open Graph link previews**: Public card links (`/card/[slug]`) produce rich previews (title/description/image) on chat/social apps.
- **Password reset (account recovery)**: Add a "Forgot password" flow so users can reset their password via email and set a new password in the app (no admin intervention).
- **Deleted-user stale session fix**: Ensure deleted users are signed out and redirected when their old browser session tries to access authenticated routes.
- **Image upload size limits**: Add explicit avatar/photo size validation so oversized uploads are rejected with a clear message.
- **iOS vCard validation**: Verify `.vcf` import behavior on iOS in addition to the Android validation already completed in v1.
- **Production observability hardening**: Configure runtime error tracking and expand auditable events without storing raw stack traces or request bodies.

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
#### C.5 - Verify DB-layer card cap cannot be bypassed [Not implemented] [Not tested]
Implementation: Manually attempt direct/forced card creation beyond the configured cap and confirm the database rejects it.

### Step D - Card deletion (User + Admin) [Implemented] [Tested]
Implementation: Add explicit delete/deactivate flows for cards without deleting the underlying auth user (admin can delete a user’s card independently).
#### D.1 - Add user card delete/deactivate action + confirmation [Implemented] [Tested]
Implementation: Add a “Delete card” (or “Deactivate card”) action in `/dashboard/card` with a confirmation prompt; define whether it hard-deletes the row or sets `is_active=false`.
#### D.2 - Handle avatar cleanup on user card delete (optional) [Implemented] [Tested]
Implementation: If hard-deleting a card, optionally remove `avatars/<user_id>/*` (or just the referenced `avatar_path`) so Storage doesn’t accumulate unused files.
#### D.3 - Add admin action to delete a user’s card only (not the user) + confirmation [Implemented] [Tested]
Implementation: In `/admin`, add a “Delete card” action per user that deletes the card row (or deactivates it) without deleting the profile/auth user; confirm before applying.
#### D.4 - Record card deletion actions in `audit_events` [Implemented] [Tested]
Implementation: Insert audit events like `admin.delete_card` / `user.delete_card` with target card id/user id in metadata.

### Step E - Admin identity in dashboard [Implemented] [Tested]
Implementation: Display the currently logged-in admin identity (email + optional display name) and allow editing the display name.
#### E.1 - Show “Signed in as” email in `/admin` header [Implemented] [Tested]
Implementation: Resolve the current admin’s email and show it near the page title/header.
#### E.2 - Show display name (optional) and fall back to email [Implemented] [Tested]
Implementation: If `profiles.display_name` is set, show it alongside the email; otherwise show email only.
#### E.3 - Allow admin to update their `profiles.display_name` [Implemented] [Tested]
Implementation: Add a small inline edit form in `/admin` that updates `profiles.display_name` for the current admin.

### Step F - Admin sign-out button [Implemented] [Tested]
Implementation: Add a sign-out action/button to the `/admin` header so admins can log out without navigating to `/dashboard`.
#### F.1 - Add sign-out button in `/admin` header [Implemented] [Tested]
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

### Step H - Admin invitations + disable public signup [Implemented] [Tested]
Implementation: Add an admin invite flow so only invited users can sign up; block/disable open signup for everyone else.
#### H.1 - Create `invites` table and policies [Implemented] [Tested]
Implementation: Add a table to store invite email, token, status, created_by admin id, and expiry; allow admin-only management.
#### H.2 - Admin UI to create/revoke invites [Implemented] [Tested]
Implementation: Add an “Invites” section in `/admin` to create an invite (email) and revoke it before use.
#### H.3 - Signup flow requires valid invite token [Implemented] [Tested]
Implementation: Modify signup to require an invite token tied to the email; refuse signup when not invited.
#### H.4 - Email delivery strategy (minimal) [Implemented] [Tested]
Implementation: Start with copyable invite link (no provider); later swap to SMTP/provider if needed.
#### H.5 - Audit invite actions [Implemented] [Tested]
Implementation: Record `admin.create_invite`, `admin.revoke_invite`, `invite.accepted` in `audit_events`.

### Step I - Open Graph / Twitter metadata for public cards [Implemented] [Tested]
Implementation: Add dynamic metadata generation for `/card/[slug]` so shared links display rich previews (title/description/image) in chat/social platforms.
#### I.1 - Implement `generateMetadata()` for `/card/[slug]` [Implemented] [Tested]
Implementation: Fetch card data by `slug` and generate `title`/`description` dynamically.
#### I.2 - Add Open Graph (`og:*`) metadata [Implemented] [Tested]
Implementation: Set `openGraph` metadata including `title`, `description`, `url`, and `images` when an avatar exists.
#### I.3 - Add Twitter card metadata [Implemented] [Tested]
Implementation: Set `twitter` metadata (`summary`/`summary_large_image`) aligned with Open Graph fields.
#### I.4 - Handle missing avatar / missing card safely [Implemented] [Tested]
Implementation: Use a default image or omit `images`; fall back to generic metadata for not-found/inactive cards.

### Step J - Basic abuse controls on public endpoints (minimal) [Not implemented]
Implementation: Add minimal throttling/rate limiting for public/semi-public routes (e.g., `/card/[slug]` and vCard download) to reduce spam/abuse risk when deployed.
#### J.1 - Add minimal IP-based throttling (middleware or edge) [Not implemented] [Not tested]
Implementation: Apply a simple per-IP request limit with short windows, returning 429 for bursts; scope only to public routes to avoid breaking normal internal usage.

### Step K - Password reset (account recovery) [Implemented] [Tested]
Implementation: Add a standard "Forgot password" flow using Supabase password reset emails and an in-app reset page for setting a new password.
#### K.1 - Add "Forgot password?" link + reset request form [Implemented] [Tested]
Implementation: On Sign in, add a link to a reset request page where the user enters email; call `supabase.auth.resetPasswordForEmail(...)` with `redirectTo` pointing back to the app.
#### K.2 - Add reset password page to set a new password [Implemented] [Tested]
Implementation: Create a reset page that accepts the recovery session and submits `supabase.auth.updateUser({ password })`, then redirects to Sign in with a success message.
#### K.3 - Configure Supabase redirect URLs for password recovery [Implemented] [Tested]
Implementation: Ensure Supabase Auth URL Configuration allows the deployed app URL and the recovery redirect path(s) so the reset link returns to the correct page.
#### K.4 - Manual test (Android + iOS) [Implemented] [Tested]
Implementation: Verify reset email arrives, link opens the reset page, password updates successfully, and the user can sign in with the new password.
Testing note: Desktop/browser reset flow passed locally; mobile password-reset validation passed on personal devices.

### Step L - Image upload size limits [Not implemented]
Implementation: Add explicit image size guardrails for avatar/logo uploads so large files are blocked before they create Storage or UX issues.
#### L.1 - Define maximum allowed avatar/logo file size [Not implemented] [Not tested]
Implementation: Choose a practical max size for v1.1 (for example 5MB or 10MB) and document it in the upload UI.
#### L.2 - Enforce size limit before upload [Not implemented] [Not tested]
Implementation: Reject oversized image files in the card save flow with a clear user-facing error before attempting Storage upload.
#### L.3 - Manual test large image rejection [Not implemented] [Not tested]
Implementation: Test with an image larger than the configured limit and confirm the card data is not saved with a failed/partial upload.

### Step M - iOS vCard validation [Not implemented]
Implementation: Validate that downloaded `.vcf` files import correctly on iOS Contacts, matching the Android behavior verified in v1.
#### M.1 - Test vCard download on iOS browser [Not implemented] [Not tested]
Implementation: Open a public card on iOS Safari/Chrome, download the vCard, and confirm iOS opens the contact import screen.
#### M.2 - Verify imported iOS contact fields [Not implemented] [Not tested]
Implementation: Confirm name, company, email, and phone are populated correctly after import.

### Step N - Production observability hardening [Not implemented]
Implementation: Finish production-grade observability by configuring runtime error tracking and expanding audit-event coverage while keeping sensitive/debug data out of Postgres.
#### N.1 - Configure runtime error tracking in production [Not implemented] [Not tested]
Implementation: Add a production `SENTRY_DSN` (or equivalent provider DSN) in Vercel and verify client/server exceptions are captured with useful context.
#### N.2 - Expand DB audit events only for auditable product actions [Not implemented] [Not tested]
Implementation: Add audit rows for selected important actions beyond existing admin events, while continuing to avoid raw stack traces, request bodies, and sensitive data.
#### N.3 - Remove verbose password-reset debug logs before production deploy [Not implemented] [Not tested]
Implementation: Before Vercel production deployment, remove/reduce temporary password-reset diagnostic logs while keeping the dynamic-origin reset logic and callback cookie handling.

### Step O - Deleted-user stale session guard [Implemented] [Tested]
Implementation: Fix authenticated route guards so users deleted from Supabase Auth/Profile cannot keep using `/dashboard` or `/dashboard/card` through an old browser session.
#### O.1 - Verify authenticated user still exists server-side [Implemented] [Tested]
Implementation: Update the user guard to reject sessions when the current user no longer exists in Supabase Auth and no valid profile exists.
#### O.2 - Sign out stale deleted-user sessions [Implemented] [Tested]
Implementation: When a deleted/stale session is detected, clear the local Supabase session cookies and redirect to `/auth`.
#### O.3 - Prevent profile recreation for deleted users [Implemented] [Tested]
Implementation: Ensure missing profiles are recreated only when the corresponding Auth user still exists.
#### O.4 - Manual test deleted-user session behavior [Implemented] [Tested]
Implementation: Delete a logged-in user from `/admin`, refresh their existing dashboard session, and confirm they are redirected to `/auth` instead of staying inside the app.

### Step P - Admin return navigation from dashboard [Implemented] [Tested]
Implementation: Add an admin-only navigation control on `/dashboard` that links back to `/admin`, matching the existing `/admin` to `/dashboard` path.
#### P.1 - Detect current user's admin allowlist status on `/dashboard` [Implemented] [Tested]
Implementation: Query `admin_users` for the signed-in user on the server and treat the link as visible only when the user is allowlisted.
#### P.2 - Render admin-only `/admin` link in dashboard header [Implemented] [Tested]
Implementation: Add an "Admin panel" link near the dashboard header actions for admins only; normal users should not see it.

### Step Q - Manual refresh controls for admin data [Implemented] [Tested]
Implementation: Add lightweight refresh controls in `/admin` so admins can manually reload stale Users and Invites data caused by changes made outside the admin panel, without reloading the whole browser tab.
#### Q.1 - Add refresh control to the Invites section [Implemented] [Tested]
Implementation: Render a small refresh button in the Invites section header that triggers a route refresh and re-renders invite status/acceptance changes from the server.
#### Q.2 - Add refresh control to the Users section [Implemented] [Tested]
Implementation: Render a separate refresh button in the Users section header that triggers the same route refresh so admins can reload user/card/status changes made elsewhere.
#### Q.3 - Keep refresh action lightweight and safe [Implemented] [Tested]
Implementation: Use a client-side route refresh (`router.refresh()`) instead of polling, realtime subscriptions, or a full browser reload.
