# MyHello (HiHello-style) v1 -- Statement of Work (SOW)

## Summary
MyHello v1 is an internal-use, web-only digital business card tool inspired by HiHello. Users can sign up, create a simple employee card (name, company, email, phone, photo/logo), and share it via a public link and QR code that can be viewed without login. This v1 focuses on being usable on mobile web, not on copying all HiHello features. The first shipped version is treated as "v1" (no MVP/beta/prototype/staging process).

## Goals
- Enable any invited person to create an account (open signup; no paywall; no domain allowlist).
- Create and manage a simple digital business card.
- Share the card publicly (viewable without login) via link and QR.
- Support "save to contacts" via downloadable vCard (`.vcf`).
- Keep the experience mobile-friendly in a browser.

## Success Metrics (KPIs)
- Versioning approach: This is **Version 1** (no MVP/beta/prototype/staging track).
- Time to create a card (from signup to shareable link): **<= 5 minutes**
- Card page loads reliably on mobile (no broken layout on common mobile widths).
- Share flow works: **copy link**, **QR scan opens card**, **email share opens compose**.
- vCard download works and imports into iOS/Android contacts.
- Admin can **disable/block** or **delete** accounts that misuse the tool.
- Prod error visibility: Unhandled client/server errors are captured in an error tracker with enough context to debug (stack trace + breadcrumbs).

## Scope -- Included in v1
### Core user flows
1. **Sign up / Log in** (normal authentication; login screen includes a toggle for Admin login vs Normal login).
2. **Create/Edit employee card**
   - Upload photo/logo.
   - Enter basic card details (name, email, company, phone).
   - Save card data.
3. **Public card page**
   - Public URL (e.g., `/card/[slug]`) viewable without login.
4. **QR code generation**
   - QR encodes the public card URL.
5. **Sharing**
   - Share card link (copy + optional Web Share API).
   - Share by email (initially `mailto:` link; no email provider required).
6. **Save contact**
   - Generate downloadable `.vcf` vCard based on card data.
7. **Mobile-friendly web view**
   - Responsive design optimized for mobile web.

### Card limits (complexity control)
- Start with **1 card per account**.
- Optionally allow up to **3 cards per account** (hard limit), if needed later without expanding scope significantly.

### Must-have features and implementation approach
| Feature | How to build it |
| --- | --- |
| Admin login | Supabase Auth |
| Login mode toggle (Admin/User) | Toggle on login screen; admin routes to admin dashboard; admin can still use normal user flow |
| Add/edit employee card | Form connected to Supabase table |
| Upload image | Supabase Storage bucket |
| Public card URL | `/card/[slug]` |
| QR code | QR generated from public card URL |
| Share card link | Copy link button + Web Share API |
| Share by email | `mailto:` link |
| Save to contacts | Generate downloadable `.vcf` file |
| Mobile web view | Responsive card page / PWA-style layout |
| Runtime error reporting (Prod) | Error tracker (e.g., Sentry) for client + server exceptions |
| Structured app logging (Prod) | Use Vercel logs for operational debugging; DB writes only for auditable events (no raw stack traces) |

## Scope -- Excluded (Not in v1)
Do **not** build these in v1:
- Native mobile app
- NFC card system
- Advanced analytics
- CRM integrations
- Lead capture forms
- Team roles/permissions
- Email signature generator
- Virtual background generator
- Multiple card templates/themes
- Persist raw stack traces or request bodies in Postgres

## Recommended v1 Tech Stack
| Layer | Tool | Why |
| --- | --- | --- |
| Frontend | Next.js / React | Easy deployment on Vercel |
| Hosting | Vercel | Fast prototype hosting |
| Database | Supabase Postgres | Store card data |
| Auth | Supabase Auth | Admin/user login |
| File storage | Supabase Storage | Store profile pictures/logos |
| QR code | Frontend QR library | No paid API needed |
| Email sharing | `mailto:` link first | No email provider needed |
| Contact save | `.vcf` vCard generation | Lets users save contact to phone |
| Error reporting | Sentry (or equivalent) | Capture client + server exceptions with stack traces/breadcrumbs |
| Operational logs | Vercel logs | Practical production debugging without DB log spam |

> Note: Supabase/Vercel free-tier limits change over time. Treat any specific numbers as **indicative only** and verify current plan limits before relying on them.

## Admin Panel (Minimum)
- View users list (basic details).
- Disable/block user access (prevent login and/or prevent edits).
- Delete user (and associated card data) when required.
- Admin login uses the login-mode toggle; admins can also use the app as normal users.
- Minimal moderation tools only; no complex role system in v1.

## Decisions Deferred (Explicitly "later")
- Exact list of card fields beyond the basics (keep v1 limited to: photo/logo, name, email, company, phone).
- Whether cards are "unlisted link-only" vs. discoverable/indexed (v1 supports public viewing by URL; **no directory/indexing** required).
- Downloading extras beyond vCard (e.g., PDFs, templates) -- later.

## Rough Delivery Estimate (Single developer)
If starting from a fresh Next.js + Supabase setup:
- **2-4 days**: Auth + card CRUD + image upload + public card page.
- **1 day**: QR code + share link/email + vCard generation.
- **1-2 days**: Basic admin panel + polish for mobile.

Total: **~4-7 working days** for a usable v1, assuming minimal design iterations.

## Important Caution (Brand/IP)
- Do not market this publicly as a "HiHello clone".
- Do not copy HiHello's UI, branding, logos, or wording.
- "HiHello" and the HiHello logo may be registered trademarks; keep MyHello branding and UI distinct.
