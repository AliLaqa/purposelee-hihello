# MyHello v1.2 Build Plan

## Summary
MyHello v1.2 is the next follow-up release after v1.1, focused on **admin information architecture and operational UX** as the product grows. The goal is to move admin-only configuration and lifecycle management out of the single `/admin` screen into clearer, dedicated admin sections, while preserving the simple internal-tool nature of the product.

This release also introduces a small role separation inside the admin layer: an owner/super-admin role above normal admins. The purpose is to keep normal admins useful for day-to-day operations while preventing them from managing, blocking, deleting, or deleting cards for other admins.

## KPIs (v1.2)
- **Admin clarity:** Daily operational actions, settings, invites, and audit history are separated into dedicated admin routes.
- **Invite traceability:** Admin can clearly see which invites are pending, accepted, expired, or revoked.
- **Admin identity management:** Admin profile/display-name settings live in a dedicated settings area instead of the overview page.
- **Operational usability:** Admin can manage invite cleanup and review invite outcomes without scanning a crowded dashboard.
- **Audit visibility:** Important admin actions are reviewable from the product UI instead of requiring direct database inspection.
- **Admin safety:** Normal admins cannot block, delete, or delete cards for other admins; only the owner/super-admin can manage admin-level accounts.

## Functionalities (v1.2)
- **Admin overview page**: Keep `/admin` focused on day-to-day user and card operations, with less configuration clutter.
- **Admin settings page**: Move admin-owned settings such as display name and future admin profile/preferences into `/admin/settings`.
- **Admin invites page**: Move invite creation and lifecycle management into `/admin/invites`, showing pending, accepted, expired, and revoked invites.
- **Invite cleanup controls**: Allow admins to revoke or delete stale invites from the dedicated invites page.
- **Admin audit page**: Add `/admin/audit` so admins can inspect important system actions without opening Supabase directly.
- **Owner/super-admin role**: Add a top-level admin role that keeps full admin-panel access while normal admins are restricted from managing other admins.
- **Role-aware admin actions**: Enforce owner-only restrictions in server actions for destructive admin-management operations.

## What NOT to implement (out of scope for v1.2)
- Full role/permission matrix beyond owner, admin, and normal user
- Department/team-scoped permissions or per-feature custom permission toggles
- Multi-tenant workspace/org management
- Advanced reporting dashboards or business analytics
- Advanced multi-provider or templated invite email delivery workflows beyond the basic personal-Gmail SMTP setup
- Complex settings categories that are not yet backed by real product behavior

## Build Plan (v1.2)

### Step A - Admin information architecture refactor [Not implemented]
Implementation: Restructure the admin area into focused routes so overview, settings, invites, and audit history do not compete on one page.
#### A.1 - Keep `/admin` as the operational overview page [Not implemented] [Not tested]
Implementation: Limit `/admin` to user/card management, status visibility, and quick operational actions.
#### A.2 - Add `/admin/settings` route [Not implemented] [Not tested]
Implementation: Create a dedicated settings page for admin-owned profile/configuration fields.
#### A.3 - Add `/admin/invites` route [Not implemented] [Not tested]
Implementation: Create a dedicated invites page for invite creation, filtering, and lifecycle review.
#### A.4 - Add `/admin/audit` route [Not implemented] [Not tested]
Implementation: Create a dedicated audit page that surfaces relevant `audit_events` records in a readable table/list.

### Step B - Admin settings screen [Not implemented]
Implementation: Move identity/profile controls from the admin overview into a dedicated settings area that can grow over time.
#### B.1 - Move admin display name management to `/admin/settings` [Not implemented] [Not tested]
Implementation: Relocate the existing display-name form from `/admin` to `/admin/settings`.
#### B.2 - Show current admin identity clearly in settings [Not implemented] [Not tested]
Implementation: Display the current admin's email and saved display name together so identity is unambiguous.
#### B.3 - Reserve settings layout for future admin preferences [Not implemented] [Not tested]
Implementation: Structure the page so additional settings sections can be added later without redesigning the route.

### Step C - Admin invites management screen [Not implemented]
Implementation: Expand invites into a dedicated operational screen so admins can monitor and clean up invite lifecycle states.
#### C.1 - List invites by status [Not implemented] [Not tested]
Implementation: Show pending, accepted, expired, and revoked invites with clear labels and timestamps.
#### C.2 - Keep invite creation on the invites page [Not implemented] [Not tested]
Implementation: Move invite creation UI from `/admin` to `/admin/invites`.
#### C.3 - Allow revoke/delete of stale invites [Not implemented] [Not tested]
Implementation: Let admins revoke pending invites and delete invites that are no longer useful.
#### C.4 - Add basic filtering/search for invite lifecycle review [Not implemented] [Not tested]
Implementation: Add minimal filters (status/email) so invite history remains usable as volume grows.

### Step D - Admin audit visibility [Not implemented]
Implementation: Surface important admin/system actions in the app UI so Supabase is no longer required for routine operational review.
#### D.1 - Show relevant audit events in `/admin/audit` [Not implemented] [Not tested]
Implementation: Read `public.audit_events` and render a clear event list/table with action, actor, target, and timestamp.
#### D.2 - Prioritize operationally important actions [Not implemented] [Not tested]
Implementation: Focus the first version on actions such as invite creation/revocation/acceptance, user block/unblock, card deletion, and user deletion.
#### D.3 - Keep audit UI simple and readable [Not implemented] [Not tested]
Implementation: Start with a basic sortable/filterable list rather than a complex analytics-style dashboard.

### Step E - Owner/super-admin authorization layer [Not implemented]
Implementation: Add a role-aware admin model so MyHello has three practical authorization levels: owner/super-admin, admin, and normal user.
#### E.1 - Add admin role field to Supabase schema [Not implemented] [Not tested]
Implementation: Add a migration that extends `public.admin_users` with a constrained role field such as `role text not null default 'admin' check (role in ('owner', 'admin'))`, preserving existing admin rows as normal admins.
#### E.2 - Seed or promote the first owners safely [Not implemented] [Not tested]
Implementation: Document and apply a safe one-time SQL update to promote at least two existing trusted admins to `owner` before enforcing owner-only restrictions, so the project cannot lock itself out of full admin access.
#### E.3 - Update admin guards to return role context [Not implemented] [Not tested]
Implementation: Update `requireAdmin()` to select the admin role and return role context, and add a `requireOwner()` or equivalent helper for owner-only server actions.
#### E.4 - Protect destructive admin-management server actions [Not implemented] [Not tested]
Implementation: Enforce server-side rules so normal admins can manage normal users but cannot block, unblock, delete, demote, promote, modify, or delete cards for owner/admin accounts. Owner/super-admin keeps full access over normal users and admins, but owners cannot delete, block, demote, or modify other owners.
#### E.5 - Add owner-aware admin UI states [Not implemented] [Not tested]
Implementation: Show user/admin/owner labels in admin user lists and hide or disable owner-only destructive and role-management actions for normal admins, while keeping server actions as the source of truth.
#### E.6 - Add owner-only promotion and demotion controls [Not implemented] [Not tested]
Implementation: Allow only owners to promote a normal user to admin and demote an admin back to normal user from the same admin area, preferably in a dedicated route/section such as `/admin/users` or `/admin/settings/admins`.
#### E.7 - Add role-aware invite controls [Not implemented] [Not tested]
Implementation: Allow admins and owners to invite normal users, but allow only owners to invite new admins. Normal admins must not be able to create admin invites.
#### E.8 - Exclude normal-user admin-access requests [Not implemented] [Not tested]
Implementation: Do not add a normal-user request-admin-access flow; normal users must not be able to request or trigger their own promotion.
#### E.9 - Preserve minimum-admin and minimum-owner safety rules [Not implemented] [Not tested]
Implementation: Keep the existing minimum-admin continuity rule where appropriate and add a stricter minimum-owner guard so the system must retain at least two owners and owners cannot remove or weaken the other owner accounts.
#### E.10 - Extend audit events for role-sensitive actions [Not implemented] [Not tested]
Implementation: Include minimal role metadata such as actor role and target admin role for block, unblock, card deletion, and user deletion events without logging sensitive request data.
#### E.11 - Test owner/admin/user authorization boundaries [Not implemented] [Not tested]
Implementation: Verify owner controls for normal users/admins, owner-to-owner protection, minimum two-owner protection, normal admin access to normal users only, normal admin denial against admins/owners, normal-user denial from admin routes, no normal-user self-promotion request path, and forged form submission denial.

### Step F - Invite email delivery via personal Gmail SMTP [Not implemented]
Implementation: Extend the existing invite-token flow so invite emails are sent automatically from a dedicated personal Gmail account using Gmail SMTP with 2-Step Verification and an App Password, while keeping the current copyable invite link as a fallback.
#### F.1 - Configure Gmail SMTP credentials for server-side use [Not implemented] [Not tested]
Implementation: Add server-only environment variables for `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`, using `smtp.gmail.com` and a Gmail App Password from a 2-Step-Verification-enabled personal Google account (no Google Workspace required).
#### F.2 - Add a small server-only invite email sender [Not implemented] [Not tested]
Implementation: Create a server-side mail helper that sends plain invite emails through Gmail SMTP without exposing credentials to the browser.
#### F.3 - Send invite email after invite creation [Not implemented] [Not tested]
Implementation: After `createInvite()` inserts the invite row and generates the invite token/link, send the email automatically to the invited address with the signup link and basic instructions.
#### F.4 - Keep manual invite link fallback when email delivery fails [Not implemented] [Not tested]
Implementation: Preserve the existing visible invite link in `/admin` so admins can still copy/share the link manually if SMTP delivery fails or is temporarily unavailable.
#### F.5 - Show delivery outcome and support resend [Not implemented] [Not tested]
Implementation: Surface whether the invite email was sent successfully, failed, or needs retry, and add a resend action for pending invites.
#### F.6 - Record invite email delivery actions safely [Not implemented] [Not tested]
Implementation: Audit email send and resend actions with minimal metadata such as invite id, recipient email, and delivery result, without storing SMTP secrets or verbose provider responses.
#### F.7 - Manual test Gmail SMTP invite delivery [Not implemented] [Not tested]
Implementation: Verify that creating an invite sends the email to the target inbox, the invite link opens correctly, signup still requires the matching email, resend works for pending invites, and the manual copy-link fallback remains usable.
