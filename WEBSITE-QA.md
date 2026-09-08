# Website QA — 8 September 2026

QA used the local website with the existing live Supabase project. Temporary, isolated customer and administrator sessions were created for the authorized audit and revoked afterward. No emails were sent. No trading controls, bot algorithms, billing-generation jobs, or payment statuses were changed.

## Issues found and fixed

- Customer invoice previews failed with `PGRST200`: the query embedded a `profiles` relationship that the live schema does not expose. Invoice and customer details are now read separately, with ownership checks retained.
- Browser print handlers were placed in server components. Actions now live in a client component, and a protected endpoint provides direct PDF downloads generated in memory. Responses use `private, no-store`; no receipt is uploaded or retained by the application.
- A second tab retained its loaded billing data after logout. A shared session guard now clears protected content and redirects tabs to login. Back navigation and saved invoice URLs were checked after logout.
- Middleware replaced its response for each refreshed cookie, risking loss of multi-part session cookies. It now preserves the complete cookie batch, including on redirects.
- Mobile navigation was crowded and the drawer appeared beneath the header. The dashboard now has a compact header, two-column account summary, bottom navigation, and a correctly layered menu with focus trapping, Escape dismissal, and focus restoration.
- Live Trading now shows the existing position data instead of a placeholder. The Risk Center no longer labels missing telemetry as healthy. Financial values and status colors use consistent formatting and theme contrast.
- The PDF font was missing from Next.js deployment tracing. The font is now explicitly included, and its presence in the final route bundle was verified.

## Verification

- Production build: compilation, type checks, route generation, and PDF font packaging passed.
- `npm test`: 3 session-cookie regression tests passed, covering multi-part refresh cookies, cookie deletion on redirect, and public access without login.
- Live HTTP suite: 81 checks across all 14 invoices and their 4 owning accounts. Includes customer previews, valid single-page PDF downloads, no-store headers, all administrator previews, foreign-account denial, malformed/missing IDs, signed-out denial, and revoked refresh tokens. Repeated against the production build.
- Synthetic PDF cases: Paid, Unpaid, and loss/No Fee passed text checks, including loss carryover, zero billable profit, absent due date, and an accented customer name. These fixtures were never inserted into Supabase.
- Real PDF: downloaded through an authenticated request, parsed, rendered, and visually reviewed. Synthetic paid PDF also visually reviewed.
- Browser checks: real customer and administrator data; logout; cross-tab logout; Back navigation; saved invoice URL after logout; light/dark mobile layouts; menu focus wrap and Escape; 320, 390, 768, and 1440 pixel layouts.
- Native browser print/download UI is not exposed by the in-app browser. The direct download button issued a successful PDF request without an in-page error; file validity was independently verified from the authenticated endpoint.

## Live data findings

At audit time, all 14 invoices had `No Fee` status. Fee calculations matched the stored values and all due dates were valid. Four account/month groups contained historical duplicates. They were preserved and are now distinguishable by invoice reference in the customer list; financial reconciliation remains a separate task.

Before/after invoice-table hashes matched. No real invoice was created, deleted, or modified. Browser QA session refresh tokens were confirmed revoked, and the local session handoff service was shut down.

## Release scope

Changes are local and have not been deployed. Install the updated locked dependencies and deploy the SaaS application normally. No database migration is required for these website fixes.

## September 8 redesign follow-up

- Replaced the homepage with a charcoal/emerald product showcase and interactive, explicitly labeled sample workspace. Public pages are statically generated; no new bot requests or Supabase polling.
- Added 15 separate product, demo, performance, pricing, security, company, support, and legal destinations. India is the stated jurisdiction; no invented operator registration or regulatory authorization.
- Unified light/dark colors and fixed login contrast. Account currency uses Intl formatting without approximation prefixes. Corrected instrument labels and removed a placeholder margin calculation from the UI.
- Follow-up verification: production build and TypeScript checks passed; four currency/session tests passed; all 16 public URLs returned HTTP 200 with main headings. Browser-tested 390px light mode and 320px INR switching and demo invoice tabs. Narrow INR amount wrapping found and corrected with a two-column layout.
- Previous real-invoice and logout QA above remains applicable; this follow-up made no invoice or bot algorithm changes. Legal operator details should be finalized before publication.
