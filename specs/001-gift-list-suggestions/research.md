# Phase 0 Research: Gift List Suggestions

## Reference stack (reused from `impl/next-deschamps`)

**Decision**: Reuse this project's existing reference stack in full, as requested: Next.js 16.2.10 (Pages Router), React 19.2.7, plain JavaScript (no TypeScript), Node.js 24, PostgreSQL 17 accessed via raw parameterized SQL through `pg` (no ORM), `node-pg-migrate` for schema migrations, Tailwind CSS 4 for styling, custom cookie-based session auth (`bcryptjs`), Jest 30 with an integration-first testing philosophy (`tests/orchestrator.js` against a real Postgres + `next dev`), and exact-pinned dependency versions with Conventional Commits.

**Rationale**: This stack is already documented and working in this repo (`docs/rfcs/0001-stack-padrao.md`, `docs/CONVENTIONS.md` on `impl/next-deschamps`), and the user explicitly asked for this implementation to follow it. Reusing it avoids re-litigating stack choices and keeps conventions (folder layout, error contract, API versioning, snake_case JSON, integration-first tests) consistent across features in this repo.

**Alternatives considered**: None — this was a direct requirement, not an open choice.

## Anonymous, account-free list storage

**Decision**: Anonymous lists live entirely in the browser's `localStorage` as a single JSON document (list + items), managed by a thin client-side data-access module (mirrors the `services/` pattern, but backed by `localStorage` instead of `httpClient`). No server round-trip is required to create, edit, or view a local-only list.

**Rationale**: Matches FR-005/FR-001 (no account, no login) and SC-006 (list persists across reloads on the same browser). Keeps the MVP database free of unauthenticated writes, avoiding spam/abuse vectors on an open write endpoint.

**Alternatives considered**: Anonymous server-side rows keyed by a browser-generated UUID/cookie — rejected because it still requires a database write path with no auth, inviting abuse, and provides no real benefit over `localStorage` until the user actually wants to share.

## Marketplace link metadata retrieval

**Decision**: A server-side endpoint (`pages/api/v1/link-previews/index.js`) fetches the pasted marketplace URL server-side and parses Open Graph / Twitter Card `<meta>` tags (title, image, price when present) using `cheerio`. Returns extracted fields; the client pre-fills the item form and lets the user edit before saving. On fetch failure or missing tags, the endpoint returns a "partial/empty" result and the client falls back to manual entry (FR-004).

**Rationale**: Browsers block cross-origin fetches of arbitrary marketplace pages (CORS), so this must happen server-side. Open Graph tags are the de facto standard most marketplaces already populate for link-preview purposes (WhatsApp/social sharing), giving reasonable coverage (target SC-002: 80%) without needing a paid data API.

**Alternatives considered**: Client-side fetch via a public CORS proxy — rejected as unreliable/rate-limited and a security liability (open proxy). Per-marketplace official product APIs (e.g., paid PA-API) — deferred; adds per-retailer approval/credentialing overhead disproportionate to MVP scope, but each marketplace adapter (below) can later swap in an official API without changing the endpoint's contract.

## Marketplace affiliate tracking (initial coverage)

**Decision**: A small "affiliate adapter" registry (one module per supported marketplace domain, e.g., `models/affiliate/mercado-livre.js`, `models/affiliate/amazon.js`, `models/affiliate/shopee.js`) knows how to turn a plain product URL into that marketplace's tracked affiliate URL (query param or path-based tag, per each program's rules). Initial launch set: Amazon, Mercado Livre, Shopee (largest marketplaces for gift-relevant categories in the target market). A pasted link from an unrecognized domain is still accepted (FR-015): metadata retrieval is attempted the same way, but the buy click links straight to the original URL with no affiliate wrapping.

**Rationale**: Directly satisfies FR-012/FR-015 and keeps the door open to add marketplaces later by adding an adapter, without a schema change.

**Alternatives considered**: A generic universal-affiliate-network aggregator (e.g., a single cross-retailer affiliate network) — rejected for MVP because coverage/payout terms vary too much by region and would need its own vetting; direct per-marketplace affiliate programs are simpler to reason about and match what the user described.

## Purchase confirmation ("mark as acquired")

**Decision**: The public buy action does two things in one request: (1) logs the click and issues a 302 redirect to the affiliate-tracked marketplace URL, and (2) immediately flips the item's status to `purchased` based on the visitor's self-reported "I'm buying/bought this" intent (FR-013) — i.e., clicking "Buy" is itself the confirmation, no separate confirmation step is required, which keeps the flow to a single click. A later reconciliation job MAY compare against marketplace affiliate conversion reports when a given marketplace's program exposes them, but the item's visible status never blocks on that.

**Rationale**: Marketplaces do not provide synchronous, real-time purchase-completion webhooks to arbitrary third-party affiliates, so an "automatically confirmed" design would leave the status wrong/stale most of the time. Treating the buy-click itself as the confirmation keeps SC-004/FR-014 achievable without an external dependency, at the accepted cost (documented in spec.md Edge Cases) that someone who clicks buy but backs out still marks the item taken.

**Alternatives considered**: Separate "I bought this" confirmation step after redirect — rejected as extra friction and unreliable (visitors rarely return to a tab they've navigated away from to confirm). Waiting on marketplace affiliate conversion postbacks before marking status — rejected as too slow (often days) and inconsistent across marketplaces.

## Hosting fee billing

**Decision**: Stripe Billing (Checkout for signup, Customer Portal for self-service management, webhooks for renewal/lapse events) handles the small recurring monthly hosting fee. A `hosting_subscriptions` table stores the Stripe customer/subscription IDs and cached status; a webhook handler (`pages/api/v1/billing/webhook/index.js`) updates that status and, on lapse, flips the list's `is_shared` flag off per FR-017.

**Rationale**: Stripe is the standard, well-documented choice for recurring SaaS billing on Node/Next.js, has first-class subscription lifecycle webhooks (needed for FR-017's "notify before lapse / stop serving" requirement), and needs no bespoke PCI-handling code since Checkout is hosted.

**Alternatives considered**: Rolling a custom billing ledger — rejected, reinvents subscription lifecycle handling (dunning, proration, webhooks) that Stripe already solves. A different processor (e.g., Paddle) — Stripe was chosen for broader ecosystem docs/tooling; no requirement favors one over the other, so the well-known default was picked.

## Local-to-account migration ("claim" flow)

**Decision**: When the owner chooses to share, the client first walks the account-creation step, then POSTs the current `localStorage` list JSON to `pages/api/v1/gift-lists/index.js` (create), which persists the list and all items server-side under the new account in one transaction, per FR-016. Only after that succeeds does the client clear its local copy and switch to reading the list from the server.

**Rationale**: Keeps the migration atomic and simple — one authenticated write, no separate "claim token" indirection needed since there was never an anonymous server-side record to begin with.

**Alternatives considered**: Server-issued anonymous list ID from the start, "claimed" later by attaching a user — rejected per the anonymous-storage decision above (no server record exists until sharing).
