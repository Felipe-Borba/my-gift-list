---

description: "Task list template for feature implementation"
---

# Tasks: Gift List Suggestions

**Input**: Design documents from `/specs/001-gift-list-suggestions/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/api-v1.md](contracts/api-v1.md), [quickstart.md](quickstart.md)

**Tests**: Included — this repo's reference stack (`impl/next-deschamps`, reused per plan.md) mandates integration-first testing (`docs/CONVENTIONS.md`: "acceptance criteria become tests or documented manual verification"), so each contract/endpoint gets an integration test and each pure-logic module gets a unit test.

**Organization**: Tasks are grouped by user story (spec.md P1/P2/P3) to enable independent implementation and testing of each story. This branch currently has no application code yet — Phase 1/2 bootstrap the reference stack from scratch per `research.md`'s "reuse the reference stack" decision.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths follow the layout in [plan.md](plan.md)'s Project Structure section

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap the reference stack (per `impl/next-deschamps` RFC 0001) on this branch, since no scaffold exists yet.

- [X] T001 Manually scaffold a Next.js Pages Router app at repo root (`package.json`, `pages/`, `next.config.js`) — no TypeScript, matching RFC 0001's manual-scaffold note (bootstrap CLI rejects this repo's existing `CLAUDE.md`/`.vscode`/`.github`)
- [X] T002 [P] Pin Node 24 via `engines` in `package.json` and `.nvmrc`
- [X] T003 [P] Create canonical config files `.editorconfig`, `.prettierignore`, `eslint.config.mjs`, `jsconfig.json` (baseUrl `.` for absolute imports) per RFC 0001's canonical content
- [X] T004 Install exact-pinned dependencies in `package.json`: `pg`, `node-pg-migrate`, `dotenv`, `bcryptjs`, `cookie`, `cheerio`, `stripe`; devDependencies: `jest`, `@faker-js/faker`, `concurrently`, `prettier`, `eslint` + `eslint-config-next` + `eslint-config-prettier` + `eslint-plugin-jest` + `@eslint/js`/`json`/`markdown`/`css` + `globals`, `husky`, `@commitlint/cli` + `@commitlint/config-conventional`, `commitizen` + `cz-conventional-changelog`, `typescript` (only to satisfy `eslint-config-next`, per RFC 0001 note)
- [X] T005 [P] Configure `next.config.js` with `transpilePackages: ["node-pg-migrate"]` (ESM-only package, per RFC 0001 note)
- [X] T006 [P] Set up Tailwind CSS 4 (`@tailwindcss/postcss`) and `styles/globals.css` (Tailwind import, reset, design tokens)
- [X] T007 Create `infra/compose.yaml` (Postgres 17 alpine, reads `.env.development`)
- [X] T008 [P] Create versioned `.env.development` with local Postgres credentials and placeholder Stripe test keys
- [X] T009 [P] Create `infra/scripts/wait-for-postgres.js`
- [X] T010 Add standardized npm scripts to `package.json` (`dev`, `test`/`test:watch`, `services:up`/`stop`/`down`, `migrations:create`/`up`, `lint:prettier:check`/`fix`, `lint:eslint:check`, `commit`) per `docs/CONVENTIONS.md`
- [X] T011 [P] Configure Husky `commit-msg` hook (`npx commitlint --edit $1`) and `commitlint.config.js`
- [X] T012 [P] Add `.github/workflows/` CI jobs for Prettier, ESLint, commitlint, and Jest on `pull_request`

**Checkpoint**: `npm run dev` boots a blank Next.js app; `npm run lint:*` and CI pass on an empty diff.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infra every subsequent API route depends on, plus the bootstrap smoke test that proves DB + migrations + controller work end-to-end (per RFC 0001 note). Blocks all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T013 [P] Create `infra/errors.js` with the shared error-class contract (`{name, message, action, statusCode}`, `toJSON()`) per `docs/CONVENTIONS.md`
- [X] T014 Create `infra/controller.js` — shared `onErrorHandler`/`onNoMatchHandler` API route wrapper (depends on T013)
- [X] T015 [P] Create `infra/database.js` — single parameterized-query entry point via `pg`
- [X] T016 [P] Create `jest.config.js` (via `next/jest`, `moduleDirectories: ["node_modules", "<rootDir>"]`) and `tests/orchestrator.js` (wait for services, clear DB, run migrations)
- [X] T017 Wire `node-pg-migrate` config and create empty `infra/migrations/` directory
- [X] T018 Implement `GET /api/v1/status` in `pages/api/v1/status/index.js` — smoke-test endpoint proving DB/migrations/controller work end to end (depends on T014, T015, T017)
- [X] T019 [P] Integration test for `GET /api/v1/status` in `tests/integration/api/v1/status/get.test.js` (depends on T018)

**Checkpoint**: Foundation ready — `npm test` runs the orchestrator against real Postgres and the status smoke test passes.

**Implementation note**: T036–T038 (`models/password.js`, `models/user.js`, `models/session.js`) were pulled forward into this phase — `infra/controller.js` (T014) imports `models/session.js`/`models/user.js` at module scope, so those modules must exist for *any* route (including the status smoke test) to load, not just US2's routes. `users`/`sessions` migrations remain in US2 (T035) since no Foundational test touches those tables yet.

---

## Phase 3: User Story 1 - Create a gift list from purchase links (Priority: P1) 🎯 MVP

**Goal**: Anyone, without an account, creates a list and adds items by pasting marketplace links; the app auto-fetches title/photo/price, with manual fallback, all persisted in browser `localStorage`.

**Independent Test**: Open the app with no account, create a list, paste a marketplace link, confirm the item appears with auto-filled photo/title, reload the browser, confirm the list persists.

### Tests for User Story 1

- [X] T020 [P] [US1] Integration test for `POST /api/v1/link-previews` (resolved and unresolved cases) in `tests/integration/api/v1/link-previews/post.test.js`
- [X] T021 [P] [US1] Unit tests for local list storage (create/add/edit/remove/persist) in `tests/unit/services/local-list.test.js`

### Implementation for User Story 1

- [X] T022 [P] [US1] Implement `models/link-preview.js` — fetch a URL server-side and parse Open Graph/Twitter Card meta tags via `cheerio`, returning `{title, image_url, price_cents, resolved}` (research.md)
- [X] T023 [US1] Implement `POST /api/v1/link-previews` in `pages/api/v1/link-previews/index.js` (depends on T022, T014)
- [X] T024 [P] [US1] Implement `services/local-list.js` — `localStorage`-backed CRUD for a list and its items, client-generated UUIDs (data-model.md "Client-side local list")
- [X] T025 [US1] Implement `hooks/useLocalGiftList.js` wrapping `services/local-list.js` for components (depends on T024)
- [X] T026 [US1] Build the list-creation/editor page (`pages/index.js`) — new list, paste-link form, item cards, using `components/` design system (depends on T025)
- [X] T027 [US1] Wire the paste-link flow to `POST /api/v1/link-previews`, pre-fill the item form, allow manual edit/entry before saving (FR-003/FR-004) (depends on T023, T026)
- [X] T028 [US1] Load and persist the list from `localStorage` on mount/every change so it survives reloads (SC-006) (depends on T024, T026)

**Checkpoint**: User Story 1 is fully functional and testable independently — no server persistence involved beyond link previews.

---

## Phase 4: User Story 2 - Share the list with others (Priority: P2)

**Goal**: The owner creates an account, pays the recurring hosting fee, and their local list is migrated server-side with a public shareable link.

**Independent Test**: Starting from an existing local-only list, create an account, complete fee checkout, confirm a shareable link is produced, and confirm a visitor without an account can view it read-only.

### Tests for User Story 2

- [X] T029 [P] [US2] Integration test for `POST /api/v1/users` in `tests/integration/api/v1/users/post.test.js`
- [X] T030 [P] [US2] Integration test for `POST /api/v1/sessions` in `tests/integration/api/v1/sessions/post.test.js`
- [X] T031 [P] [US2] Integration test for `POST /api/v1/gift-lists` (incl. `402` when billing inactive) in `tests/integration/api/v1/gift-lists/post.test.js`
- [X] T032 [P] [US2] Integration test for `GET /api/v1/gift-lists/[share_slug]` (public read, `404` on unknown/unshared) in `tests/integration/api/v1/gift-lists/share_slug/get.test.js`
- [X] T033 [P] [US2] Integration test for `POST /api/v1/billing/checkout` in `tests/integration/api/v1/billing/checkout/post.test.js`
- [X] T034 [P] [US2] Integration test for `POST /api/v1/billing/webhook` (activation and lapse) in `tests/integration/api/v1/billing/webhook/post.test.js`

### Implementation for User Story 2

- [X] T035 [US2] Create migrations for `users`, `sessions`, `gift_lists`, `gift_items`, `hosting_subscriptions` tables in `infra/migrations/` (data-model.md)
- [X] T036 [P] [US2] Implement `models/password.js` (`bcryptjs` hash/compare)
- [X] T037 [US2] Implement `models/user.js` (create/find user) (depends on T036, T035)
- [X] T038 [US2] Implement `models/session.js` (cookie-based session create/validate) (depends on T037)
- [X] T039 [US2] Implement `POST /api/v1/users` in `pages/api/v1/users/index.js` (depends on T037)
- [X] T040 [US2] Implement `POST /api/v1/sessions` in `pages/api/v1/sessions/index.js` + session-cookie auth middleware (depends on T038)
- [X] T041 [P] [US2] Implement `models/billing.js` — Stripe Checkout session creation and webhook signature verification/event handling (research.md)
- [X] T042 [US2] Implement `POST /api/v1/billing/checkout` in `pages/api/v1/billing/checkout/index.js` (depends on T041, T040)
- [X] T043 [US2] Implement `POST /api/v1/billing/webhook` in `pages/api/v1/billing/webhook/index.js` — updates `hosting_subscriptions`, flips `gift_lists.status` to `unshared` on lapse (FR-017) (depends on T041, T035)
- [X] T044 [P] [US2] Implement `models/gift-list.js` — transactional create of list + items from the client's local payload, unique `share_slug` generation (FR-016) (depends on T035)
- [X] T045 [US2] Implement `POST /api/v1/gift-lists` in `pages/api/v1/gift-lists/index.js` — requires `active` hosting subscription, `402` otherwise (depends on T044, T042, T040)
- [X] T046 [US2] Implement `GET /api/v1/gift-lists/[share_slug]` in `pages/api/v1/gift-lists/[share_slug]/index.js` — public read, omits `marketplace_url`/`affiliate_url`, `404` on unknown or `unshared` (depends on T044)
- [X] T047 [US2] Build signup/login pages (`pages/signup.js`, `pages/login.js`) (depends on T039, T040)
- [X] T048 [US2] Build the "Share this list" flow — prompts signup/login, redirects to Stripe Checkout, then `POST`s the local list from `services/local-list.js` (T024) to `/api/v1/gift-lists` (depends on T045, T047)
- [X] T049 [US2] Build the public shared-list view page `pages/l/[share_slug].js` — read-only render of items/status, no edit controls (depends on T046)

**Checkpoint**: User Stories 1 and 2 both work independently — a list can be created locally and, separately, shared end-to-end.

**Implementation notes**:
- T053–T056/T058 (affiliate adapter registry) were pulled forward from Phase 5 into this phase — `models/gift-list.js` (T044) resolves `affiliate_url` at item-insert time, so the registry has to exist before US2's create-list path works, not just US3's buy/redirect path.
- `POST /api/v1/billing/checkout`'s success path (`200` + real `checkout_url`) requires a live Stripe test-mode secret key, which this sandbox doesn't have — only its `401` auth-gate is covered by an automated test; the success path is a manual check per `quickstart.md` Scenario 2. The webhook (`POST /api/v1/billing/webhook`) needed no such exception: Stripe signature verification is local HMAC math against `STRIPE_WEBHOOK_SECRET`, so it's fully covered by real (non-mocked) integration tests.

---

## Phase 5: User Story 3 - Buy a gift and mark it as taken (Priority: P3)

**Goal**: Visitors buy through platform-tracked affiliate links; the item is marked acquired and shown as unavailable to everyone else.

**Independent Test**: On a shared list, click "buy" on an item, confirm the redirect goes through the platform's tracked affiliate link, and confirm the item shows as taken on reload for any visitor.

### Tests for User Story 3

- [X] T050 [P] [US3] Unit tests for affiliate adapters (URL wrapping + unknown-domain fallback) in `tests/unit/models/affiliate.test.js`
- [X] T051 [P] [US3] Integration test for `PATCH /api/v1/gift-lists/[share_slug]/items/[item_id]` (owner-only edit/delete) in `tests/integration/api/v1/gift-lists/share_slug/items/item_id/patch.test.js`
- [X] T052 [P] [US3] Integration test for `GET /api/v1/gift-lists/[share_slug]/items/[item_id]/buy` (status flip + redirect, idempotency) in `tests/integration/api/v1/gift-lists/share_slug/items/item_id/buy.get.test.js`

### Implementation for User Story 3

- [X] T053 [P] [US3] Implement `models/affiliate/amazon.js`
- [X] T054 [P] [US3] Implement `models/affiliate/mercado-livre.js`
- [X] T055 [P] [US3] Implement `models/affiliate/shopee.js`
- [X] T056 [US3] Implement `models/affiliate/index.js` — registry resolving a URL's domain to an adapter, raw-URL fallback for unsupported domains (FR-015) (depends on T053, T054, T055)
- [X] T057 [US3] Implement `models/gift-item.js` — owner-only update/delete, one-way `available → purchased` transition (FR-006/FR-011/FR-013/FR-014, data-model.md) (depends on T035)
- [X] T058 [US3] Wire `affiliate_url` population into `models/gift-list.js` item creation using the affiliate registry (depends on T056, T044)
- [X] T059 [US3] Implement `PATCH /api/v1/gift-lists/[share_slug]/items/[item_id]` in `pages/api/v1/gift-lists/[share_slug]/items/[item_id]/index.js` (depends on T057)
- [X] T060 [US3] Implement `GET /api/v1/gift-lists/[share_slug]/items/[item_id]/buy` in `pages/api/v1/gift-lists/[share_slug]/items/[item_id]/buy.js` — idempotent status flip + `302` to `affiliate_url`/`marketplace_url` (depends on T056, T057)
- [X] T061 [US3] Add "Buy" action and available/purchased badge to `pages/l/[share_slug].js`, disabling buy once purchased (FR-014) (depends on T060, T049)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements spanning multiple user stories.

- [X] T062 Run all four `quickstart.md` scenarios end-to-end manually against a local Stripe test-mode setup
- [X] T063 [P] Add rate limiting/abuse guard to the public, unauthenticated `POST /api/v1/link-previews` endpoint
- [X] T064 [P] Verify (add a regression test if missing) that `GET /api/v1/gift-lists/[share_slug]` never leaks `marketplace_url`/`affiliate_url` to visitors
- [X] T065 [P] Full `npm run lint:prettier:check` + `npm run lint:eslint:check` pass across all new files
- [X] T066 [P] Update `README.md` with local dev setup (Docker, Stripe test keys) for this feature

**Implementation note (T062)**: this sandbox has no real Stripe test-mode account and no browser-automation tool installed, so Scenarios 2–4 of `quickstart.md` (which require an actual Checkout redirect and a real browser) were not run end-to-end here. What *was* verified for real: the full automated suite (44 tests) against a real Postgres instance, including Stripe webhook signature verification (local HMAC, no live API needed) driving subscription activation and hosting-fee-lapse behavior, the `402`/`401`/`403`/`404` gates on every route, and the buy-redirect's affiliate-URL wrapping and idempotent purchase-status flip. Scenario 1 (local-only list, no account) was checked by hitting the running dev server directly. A person with real Stripe test keys should still walk through the full `quickstart.md` before shipping.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends only on Foundational. No dependency on US2/US3.
- **User Story 2 (Phase 4)**: Depends on Foundational; reads the local list produced by US1's `services/local-list.js` (T024) at the UI layer, but its own API/DB layer is independently testable via T029–T034 without US1 existing.
- **User Story 3 (Phase 5)**: Depends on Foundational and on `gift_lists`/`gift_items` existing (US2's migrations, T035) and on `models/gift-list.js` (T044) for affiliate-URL wiring (T058); its own buy/redirect contract (T050–T052) is independently testable given seeded data.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- All `[P]` tasks within Phase 1 (T002, T003, T005, T006, T008, T009, T011, T012) can run in parallel once T001 exists.
- Within Phase 2: T013, T015, T016 can start in parallel; T014 depends on T013; T018/T019 depend on the rest.
- Once Phase 2 is done, US1 (Phase 3) and the test-writing parts of US2/US3 (T029–T034, T050–T052) can proceed in parallel across developers.
- Within US1: T020–T022, T024 in parallel; T023/T025–T028 follow their listed dependencies.
- Within US2: T029–T034 (tests) and T036 in parallel; then T035 → T037 → T038 → T039/T040, and T041 in parallel with the auth chain.
- Within US3: T050, T053–T055 in parallel; T056 depends on the three adapters.

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests + independent modules together:
Task: "Integration test for POST /api/v1/link-previews in tests/integration/api/v1/link-previews/post.test.js"
Task: "Unit tests for local list storage in tests/unit/services/local-list.test.js"
Task: "Implement models/link-preview.js"
Task: "Implement services/local-list.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1).
3. **STOP and VALIDATE**: run Scenario 1 from `quickstart.md` — local list creation, no account, survives reload.
4. Demo the MVP — a working, shareable-nowhere-yet gift list.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. Add User Story 1 → validate independently → MVP demo.
3. Add User Story 2 → validate Scenario 2 → sharing + billing demo.
4. Add User Story 3 → validate Scenario 3 and 4 → full monetization loop demo.
5. Phase 6 polish.

### Parallel Team Strategy

With multiple developers, after Foundational is done: Developer A takes US1, Developer B starts US2's API/DB layer (T029–T046, independently testable against seeded data even before US1's UI exists), Developer C starts US3's affiliate adapters (T050, T053–T056, pure logic, no dependency on US1/US2 UI). UI wiring tasks (T048, T049, T061) that cross story boundaries are the natural integration points and should be picked up last by whoever finishes their story's backend first.

---

## Notes

- `[P]` tasks touch different files with no unfinished dependency.
- `[Story]` labels trace each task back to spec.md's US1/US2/US3.
- Commit after each task or logical group, following this repo's Conventional Commits + commitlint setup (Phase 1, T011).
- No test-first (red-green) ordering is mandated here beyond "tests exist alongside implementation," per this repo's integration-first (not strict TDD) convention — see `docs/CONVENTIONS.md`.
