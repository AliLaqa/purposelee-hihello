# MyHello v1.2 Build Plan

## Summary
MyHello v1.2 is the next follow-up release after v1.1, focused on **admin information architecture and operational UX** as the product grows. The goal is to move admin-only configuration and lifecycle management out of the single `/admin` screen into clearer, dedicated admin sections, while preserving the simple internal-tool nature of the product.

## KPIs (v1.2)
- **Admin clarity:** Daily operational actions, settings, invites, and audit history are separated into dedicated admin routes.
- **Invite traceability:** Admin can clearly see which invites are pending, accepted, expired, or revoked.
- **Admin identity management:** Admin profile/display-name settings live in a dedicated settings area instead of the overview page.
- **Operational usability:** Admin can manage invite cleanup and review invite outcomes without scanning a crowded dashboard.
- **Audit visibility:** Important admin actions are reviewable from the product UI instead of requiring direct database inspection.

## Functionalities (v1.2)
- **Admin overview page**: Keep `/admin` focused on day-to-day user and card operations, with less configuration clutter.
- **Admin settings page**: Move admin-owned settings such as display name and future admin profile/preferences into `/admin/settings`.
- **Admin invites page**: Move invite creation and lifecycle management into `/admin/invites`, showing pending, accepted, expired, and revoked invites.
- **Invite cleanup controls**: Allow admins to revoke or delete stale invites from the dedicated invites page.
- **Admin audit page**: Add `/admin/audit` so admins can inspect important system actions without opening Supabase directly.

## What NOT to implement (out of scope for v1.2)
- Full role/permission matrix beyond the existing admin model
- Multi-tenant workspace/org management
- Advanced reporting dashboards or business analytics
- SMTP/provider-based invite delivery workflows
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
