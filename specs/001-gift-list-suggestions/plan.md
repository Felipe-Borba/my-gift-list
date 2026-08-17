# Implementation Plan: Gift List Suggestions

**Branch**: `001-gift-list-suggestions` | **Date**: 2026-08-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-gift-list-suggestions/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Let anyone build a gift wish list, account-free, by pasting marketplace links — the app fetches title/photo automatically and stores everything in browser `localStorage`. When the owner wants to share it, they create an account and pay a small recurring hosting fee, at which point the list moves to the server, gets a public shareable link, and buy clicks are routed through platform-tracked affiliate links that also mark items as acquired. Implementation reuses this repo's existing reference stack from branch `impl/next-deschamps` (Next.js Pages Router + Postgres/raw SQL + custom auth), per explicit user request, with three new pieces layered on: a server-side link-metadata fetcher, a per-marketplace affiliate-adapter registry, and Stripe-based recurring billing. See [research.md](research.md) for the reasoning behind each addition.

## Technical Context

**Language/Version**: JavaScript (no TypeScript), Node.js 24 — matches reference stack exactly.

**Primary Dependencies**: Next.js 16.2.10 (Pages Router), React 19.2.7, `pg` 8.x, `node-pg-migrate`, `bcryptjs`, `cookie`, Tailwind CSS 4 (`@tailwindcss/postcss`) — all reused as-is from `impl/next-deschamps`. New for this feature: `cheerio` (server-side HTML/meta-tag parsing for link previews), `stripe` (recurring hosting-fee billing).

**Storage**: PostgreSQL 17 for shared/hosted lists, accounts, and billing state (raw parameterized SQL via `infra/database.js`, no ORM); browser `localStorage` for anonymous/local-only lists (no server storage until a list is shared — see [research.md](research.md)).

**Testing**: Jest 30 via `next/jest`, integration-first against a real Postgres + `next dev` through `tests/orchestrator.js` (mirrors reference `tests/integration/`); `tests/unit/` for the pure-logic `localStorage` client module and affiliate-adapter/price-parsing logic.

**Target Platform**: Web — server as a Linux/Docker container (Postgres via local Docker Compose, matching reference `infra/compose.yaml`); client is modern desktop and mobile browsers.

**Project Type**: Web application — single Next.js app (Pages Router), not a monorepo, matching the reference stack's structure.

**Performance Goals**: List pages interactive in under 2s on typical broadband; link-preview metadata fetch (`POST /api/v1/link-previews`) resolves within 5s p95, since it depends on third-party marketplace response times; buy-redirect adds under 300ms before the 302 to the marketplace.

**Constraints**: Anonymous list creation/editing must work with zero network calls (pure `localStorage`); metadata scraping must degrade gracefully (never block saving an item) when a marketplace page can't be parsed; the public shared-list view must never expose a raw `marketplace_url`/`affiliate_url` to visitors (only the buy-redirect endpoint does), so the affiliate wrapping can't be trivially bypassed by copy-pasting a link.

**Scale/Scope**: MVP — 3 user stories (local list creation, sharing, buy+mark-acquired), initial affiliate/metadata coverage for 3 marketplaces (Amazon, Mercado Livre, Shopee) with graceful fallback to manual entry + un-wrapped links for any other domain.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled bootstrap template for this repo (no ratified principles yet) — there are no project-specific gates to evaluate against. This section is a no-op until `/speckit-constitution` is run with the project owner. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-gift-list-suggestions/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
infra/
├── compose.yaml               # local Postgres (+ existing services) via Docker Compose
├── database.js                # single entry point for parameterized SQL queries
├── errors.js                  # shared error classes ({name, message, action, statusCode})
├── controller.js               # shared API error/route handlers
├── migrations/                # node-pg-migrate migrations, incl. this feature's new tables
└── scripts/

models/
├── user.js, session.js, password.js, authorization.js   # existing auth, reused as-is
├── gift-list.js                # create/read/update gift lists, local→server migration
├── gift-item.js                # item CRUD, status transitions
├── link-preview.js             # fetch + parse Open Graph metadata (uses cheerio)
├── affiliate/
│   ├── index.js                # adapter registry, resolves domain → adapter
│   ├── amazon.js
│   ├── mercado-livre.js
│   └── shopee.js
└── billing.js                  # Stripe checkout/session + webhook event handling

pages/
├── api/v1/
│   ├── users/index.js
│   ├── sessions/index.js
│   ├── link-previews/index.js
│   ├── gift-lists/
│   │   ├── index.js
│   │   └── [share_slug]/
│   │       ├── index.js
│   │       └── items/[item_id]/
│   │           ├── index.js
│   │           └── buy.js
│   └── billing/
│       ├── checkout/index.js
│       └── webhook/index.js
├── l/[share_slug].js           # public shared-list view (visitor)
└── (list editor, share/billing flow pages)

components/                     # existing design system, reused (Card, Button, Modal, etc.)
services/                       # httpClient.js (existing) + local-list.js (new: localStorage data access)
hooks/                          # useGiftList, useGiftItems, useLocalGiftList, etc.
styles/                         # existing globals.css / Tailwind setup, reused as-is

tests/
├── orchestrator.js             # existing
├── integration/api/v1/         # one file per route per HTTP method, mirrors pages/api/v1
└── unit/                       # local-list.js, affiliate adapters, link-preview parsing
```

**Structure Decision**: Single Next.js app (Pages Router), no monorepo — matches the reference stack exactly. This feature adds new `models/` modules (`gift-list.js`, `gift-item.js`, `link-preview.js`, `affiliate/*`, `billing.js`), new versioned API routes under `pages/api/v1/`, and one new frontend-only module (`services/local-list.js`) for the anonymous `localStorage` path, which has no server-side counterpart by design (see [research.md](research.md)).

## Complexity Tracking

No Constitution Check violations to justify — table intentionally omitted (see Constitution Check above).
