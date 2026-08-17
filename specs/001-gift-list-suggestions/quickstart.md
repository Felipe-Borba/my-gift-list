# Quickstart: Gift List Suggestions

Validates the three user stories end-to-end. Assumes the reference stack conventions (`npm run dev` boots Postgres via Docker Compose, runs migrations, then `next dev` — see reference `impl/next-deschamps` `package.json`).

## Prerequisites

- Node 24, Docker running (for local Postgres via `infra/compose.yaml`).
- `npm install`, then `npm run dev`.
- A Stripe test-mode account with test API keys in `.env.development` (for User Story 2's fee checkout, in test mode).

## Scenario 1 — Create a local list, no account (US1 / SC-001, SC-002, SC-006)

1. Open the app in a fresh browser profile (no login).
2. Create a new list, paste a supported marketplace product URL.
3. **Expect**: item appears within a few seconds with title + photo auto-filled (`POST /api/v1/link-previews` resolved `true`).
4. Paste a second, unsupported/broken URL. **Expect**: `resolved: false`, manual entry form shown, item still saveable.
5. Reload the browser. **Expect**: both items still present, loaded from `localStorage`, no network calls to `/api/v1/gift-lists`.

## Scenario 2 — Share the list (US2 / SC-003)

1. From the local list, choose "Share".
2. Create an account (`POST /api/v1/users`, then session via `POST /api/v1/sessions`).
3. Complete Stripe test-mode checkout (`POST /api/v1/billing/checkout` → hosted Checkout page → test card).
4. **Expect**: `POST /api/v1/gift-lists` succeeds once billing is active, returning a `share_url`.
5. Open the `share_url` in an incognito window (no session). **Expect**: list and items visible, no edit controls.

## Scenario 3 — Buy and mark acquired (US3 / SC-004, SC-005)

1. From the incognito/visitor view of the shared list, click "Buy" on an item.
2. **Expect**: browser is redirected (via `GET .../items/[item_id]/buy`) to the marketplace, through a URL containing the affiliate tag for that marketplace domain.
3. Reload the shared list page (still incognito). **Expect**: that item now shows as taken/unavailable, with its buy action disabled, and no indication of who bought it.
4. Repeat the buy click on the same item from a different browser/session. **Expect**: same "already taken" outcome — no duplicate purchase path.

## Scenario 4 — Hosting fee lapse (FR-017)

1. In Stripe test mode, cancel or simulate a failed renewal for the test subscription.
2. Wait for the webhook (`POST /api/v1/billing/webhook`) to process, or trigger it via `stripe trigger customer.subscription.deleted` in the Stripe CLI.
3. **Expect**: `GET /api/v1/gift-lists/[share_slug]` now returns `404` for visitors; the owner's dashboard shows the list as unshared and reflects the lapsed billing state.

## Automated coverage

Per this repo's integration-first testing convention, each endpoint in [contracts/api-v1.md](contracts/api-v1.md) gets one `tests/integration/api/v1/.../<method>.test.js` file exercising the scenarios above against a real Postgres instance via `tests/orchestrator.js`. Client-side `localStorage` list logic (Scenario 1) is covered by `tests/unit/` since it has no I/O.
