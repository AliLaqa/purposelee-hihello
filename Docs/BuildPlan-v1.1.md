# MyHello v1.1 Build Plan

## Summary
MyHello v1.1 is a small follow-up release after v1, focused on **operational/admin improvements** discovered during real usage. It keeps the same product scope and UX, but adds missing guardrails and maintenance tooling so the system stays clean and manageable over time (especially Supabase Storage).

## KPIs (v1.1)
- **Operational hygiene:** Admin can reliably identify and delete orphaned avatar files from Supabase Storage.
- **Safety:** Orphan cleanup supports preview/dry-run semantics and prevents accidental mass deletions.
- **Auditability:** Orphan cleanup actions are recorded in `public.audit_events` (who did what, when, and what was affected).
- **Usability:** Orphan cleanup UI clearly lists the orphaned file paths and the derived user UUID/folder.
- **Admin presence control:** Admin can remove their public presence (deactivate card) without losing admin access, and restore it later without data loss.

## Functionalities (v1.1)
- **Admin orphaned Storage cleanup**: Admin dashboard can scan Supabase Storage (`avatars`) for orphaned files, display exact identifiers (user UUID/folder + full object paths), and delete selected or all orphaned files after confirmation.
- **Admin “Remove my presence”**: Admin can deactivate their own public card without deleting/clearing any profile/card fields or Storage files, so it can be restored later.

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
Implementation: Insert audit events like `admin.remove_presence` / `admin.restore_presence` with minimal metadata (what changed).
