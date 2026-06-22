# MyHello v1.1 User Experience Plan

## Summary
MyHello v1.1 UX work focuses on making the existing product easier for non-technical users to understand and operate. The goal is not to add a larger product scope, but to reduce confusion in common flows: signing in, accepting invites, creating cards, sharing cards, deleting records safely, and using admin tools without relying on developer knowledge or Supabase inspection.

## KPIs (UX v1.1)
- **Layman-friendly authentication:** Users clearly understand whether they are signing in, accepting an invite, or resetting a password.
- **Invite clarity:** Admins can copy and share invite links without selecting raw text manually, and invite recipients understand what to do next.
- **Operational safety:** Destructive admin actions require clear confirmation and explain what will and will not be deleted.
- **Guided card creation:** Users understand what a card is, what happens after saving, and how to share it.
- **Upload clarity:** Avatar/photo uploads show clear file guidance and friendly errors for unsupported or oversized files.
- **Mobile usability:** Dashboard, card editor, public card, and admin list remain easy to scan and operate on phone screens.
- **Admin usability:** Admins can manage users, cards, invites, and audit context from the app without needing Supabase for routine checks.
- **Production polish:** User-facing flows avoid developer/debug language and show actionable messages.

## Functionalities (UX v1.1)
- **Separate sign-in and sign-up experiences**: Split the combined auth page into focused screens so users are not confused by two forms on one page.
- **Guided invite acceptance**: Invite links should explain that the user was invited and should create an account with the invited email.
- **Copy invite link button**: Admins should have a one-click way to copy invite links.
- **Safer admin delete user flow**: Deleting a user should require explicit confirmation and explain that it removes the account, card data, and avatar files.
- **Better empty states**: Empty dashboard/admin states should tell users what to do next, not only state that something is missing.
- **Image upload guidance**: Avatar upload controls should show allowed image types, max size, and human-readable validation errors.
- **Post-save sharing guidance**: After saving a card, users should see clear next actions such as open card and copy share link.
- **Mobile admin polish**: Admin user/card/invite controls should stay readable and tappable on small screens.
- **Friendly error messages**: Auth, invite, card, upload, and reset errors should use plain language and avoid exposing internal codes unless needed.
- **Public card action polish**: Public card actions should make saving and sharing contact details obvious to recipients.
- **Admin audit visibility**: Routine audit checks should eventually be visible in the app instead of requiring direct SQL queries.
- **Production debug cleanup**: Temporary password-reset diagnostics should be reduced before production handoff.

## What NOT to implement (out of scope for UX v1.1)
- Full redesign or branding overhaul
- Native mobile apps
- Multiple card templates/themes
- Advanced analytics dashboards
- CRM, NFC, email-signature, or virtual-background features
- Complex role/permission matrix beyond the existing admin model
- SMTP/provider-based invite delivery unless explicitly requested
- Large admin information-architecture refactor beyond the focused UX changes listed here

## UX Plan (v1.1)

### Step A - Separate auth pages [Implemented] [Tested]
Implementation: Replace the combined `/auth` experience with clearer dedicated sign-in and sign-up routes while preserving existing auth behavior.
#### A.1 - Create focused sign-in page [Implemented] [Tested]
Implementation: Move the login form to a dedicated sign-in route and keep the Admin/User login mode behavior.
#### A.2 - Create focused invite sign-up page [Implemented] [Tested]
Implementation: Move invited-user signup into a dedicated route or focused invite state that clearly explains the invite flow.
#### A.3 - Keep old `/auth` links safe [Implemented] [Tested]
Implementation: Redirect or route existing `/auth` links to the appropriate sign-in page without breaking password reset or invite links.
#### A.4 - Preserve all current auth outcomes [Implemented] [Tested]
Implementation: Verify normal login, admin login, invite signup, blocked-user messaging, and password-reset success messaging still work.

### Step B - Invite UX clarity and copy controls [Implemented] [Tested]
Implementation: Make admin-created invite links easier to copy and make invite acceptance easier for non-technical users.
#### B.1 - Add copy invite link button in `/admin` [Implemented] [Tested]
Implementation: Render a clear copy control beside each invite URL so admins do not need to manually select raw text.
#### B.2 - Improve invite recipient messaging [Implemented] [Tested]
Implementation: When an invite token is present, show plain-language text explaining that the user was invited to create a MyHello account.
#### B.3 - Clarify invite status and expiry [Implemented] [Tested]
Implementation: Show pending, accepted, revoked, and expired invite states with readable labels and dates.
#### B.4 - Improve invalid invite errors [Implemented] [Tested]
Implementation: Explain whether an invite is invalid, expired, revoked, or for a different email when that can be shown safely.

### Step C - Safer admin destructive actions [Not implemented]
Implementation: Reduce accidental account deletion by adding explicit confirmation UX to admin user deletion.
#### C.1 - Add confirmation requirement to admin delete user [Not implemented] [Not tested]
Implementation: Require a checkbox or typed confirmation before deleting a user account from `/admin`.
#### C.2 - Explain delete-user consequences [Not implemented] [Not tested]
Implementation: Tell admins that deleting a user removes their account/profile/card data and attempts avatar cleanup.
#### C.3 - Keep existing guardrails visible [Not implemented] [Not tested]
Implementation: Keep self-delete and last-admin protections, and show friendly messages when those guardrails block an action.

### Step D - Better dashboard and card empty states [Implemented] [Tested]
Implementation: Improve existing empty and success states so users understand what to do next.
#### D.1 - Improve dashboard no-card empty state [Implemented] [Tested]
Implementation: Expand the existing no-card state with clearer next-step wording and a primary create-card action.
#### D.2 - Improve post-save next actions [Implemented] [Tested]
Implementation: After card save, keep the share link visible and add a clearer copy/open/share action set.
#### D.3 - Improve admin no-card display [Implemented] [Tested]
Implementation: Keep the admin "No card" state but make it clearer that the user exists and has not created a public card yet.

### Step E - Image upload guidance and validation UX [Implemented] [Tested]
Implementation: Make avatar/photo upload expectations clear and reject invalid files with friendly messages.
#### E.1 - Show allowed image guidance [Implemented] [Tested]
Implementation: Display accepted image types and max upload size near the avatar field.
#### E.2 - Enforce max upload size with clear message [Implemented] [Tested]
Implementation: Reject oversized images before saving and show a user-friendly error.
#### E.3 - Keep failed upload from creating confusing partial state [Implemented] [Tested]
Implementation: Confirm card data is not saved in a misleading way when an avatar upload fails.
#### E.4 - Let users remove an avatar while editing a card [Implemented] [Tested]
Implementation: Add a clear remove-image control in the card editor so pressing it means no avatar should remain on the card after save. If a saved avatar exists, it should be removed from the card and cleaned from Storage on save. If a new image was only selected in the editor, the control should clear it instead of keeping any previous avatar.
#### E.5 - Clean up replaced avatar files safely [Implemented] [Tested]
Implementation: When a user replaces an existing avatar, delete the previous stored file after the new image is saved successfully so Storage does not accumulate orphaned avatar files.

### Step F - Mobile admin layout polish [Not implemented]
Implementation: Make admin user/card/invite management easier to scan and operate on small screens.
#### F.1 - Review admin header on mobile [Not implemented] [Not tested]
Implementation: Ensure signed-in identity, dashboard navigation, and sign-out actions fit without crowding.
#### F.2 - Improve user/card action layout on mobile [Not implemented] [Not tested]
Implementation: Make block, delete card, and delete user actions readable and tappable on narrow screens.
#### F.3 - Improve invite list layout on mobile [Not implemented] [Not tested]
Implementation: Ensure invite email, status, link, copy action, and revoke action are readable on phones.

### Step G - Friendly error and status messages [Implemented] [Tested]
Implementation: Replace technical or ambiguous flow messages with plain-language explanations and next steps.
#### G.1 - Review auth error messages [Implemented] [Tested]
Implementation: Ensure invalid login, missing credentials, blocked account, invite required, invalid invite, and signup failure messages are clear.
#### G.2 - Review card editor error messages [Implemented] [Tested]
Implementation: Ensure missing fields, slug taken, invalid slug, upload failure, save failure, and delete failure messages are actionable.
#### G.3 - Reduce visible internal codes where possible [Implemented] [Tested]
Implementation: Avoid showing raw internal codes to non-technical users unless they are needed for support.

### Step H - Public card action polish [Implemented] [Tested]
Implementation: Make the public card page clearer for recipients who only want to save or share contact details.
#### H.1 - Prioritize save/share actions [Implemented] [Tested]
Implementation: Review the order and labels of save contact, copy link, share, and email share actions.
#### H.2 - Improve no-avatar presentation [Implemented] [Tested]
Implementation: Use a clear placeholder or initials treatment when no avatar exists instead of an empty square.
#### H.3 - Verify public card mobile spacing [Implemented] [Tested]
Implementation: Confirm all fields, QR code, and actions remain readable on common mobile widths.

### Step I - Admin audit visibility [Not implemented]
Implementation: Let admins review important product actions from the app instead of using SQL for routine checks.
#### I.1 - Define first audit event list [Not implemented] [Not tested]
Implementation: Prioritize invite creation/revocation/acceptance, user block/unblock, card deletion, user deletion, and admin identity updates.
#### I.2 - Add simple audit display route or section [Not implemented] [Not tested]
Implementation: Render a readable list of recent audit events with action, actor, target, metadata summary, and timestamp.
#### I.3 - Keep audit UI operational, not analytical [Not implemented] [Not tested]
Implementation: Avoid charts or analytics; focus on traceability for support/admin work.

### Step J - Production-facing debug cleanup [Not implemented]
Implementation: Remove or reduce temporary password-reset debug logs before production handoff while preserving useful limited error logging.
#### J.1 - Identify temporary reset diagnostics [Not implemented] [Not tested]
Implementation: Review password-reset request, callback, and update-password logs.
#### J.2 - Keep useful limited errors [Not implemented] [Not tested]
Implementation: Preserve safe operational error logs without request bodies, raw tokens, or sensitive data.
#### J.3 - Verify password reset still works after cleanup [Not implemented] [Not tested]
Implementation: Retest desktop and mobile password reset after log cleanup.

### Step K - Prevent duplicate submissions on important actions [Not implemented]
Implementation: Prevent repeated clicks on important actions so users cannot accidentally submit the same operation multiple times while the first request is still running.
#### K.1 - Add pending/disabled button states for important actions [Not implemented] [Not tested]
Implementation: For important actions such as save, delete, block, unblock, revoke, and invite creation, disable the button immediately after the first click until the request finishes.
#### K.2 - Show clear in-progress feedback [Not implemented] [Not tested]
Implementation: Replace the normal button label with a clear loading state such as working, saving, deleting, or revoking so the user knows the action is in progress.
#### K.3 - Keep repeat submissions safe on the server side [Not implemented] [Not tested]
Implementation: Ensure important actions fail safely or return a stable result if the same request is triggered twice before the UI fully updates.
