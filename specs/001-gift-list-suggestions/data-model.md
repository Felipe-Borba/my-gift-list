# Data Model: Gift List Suggestions

Server-side (PostgreSQL) entities only come into existence once a list is shared (see [research.md](research.md) — Anonymous list storage). Anonymous/local-only lists use the equivalent shape below serialized as JSON in the browser's `localStorage`, so migrating to the server on "share" is a direct mapping.

## `users`

Created only when an owner shares a list for the first time (FR-007).

| Field | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `email` | text, unique | |
| `password_hash` | text | via `bcryptjs`, mirrors reference `models/password.js` |
| `features` | text[], default `{}` | permissões do usuário, ver `models/authorization.js`; sysadmin seeded/synced com `ROOT_FEATURES` a partir de `ADMIN_EMAIL`/`ADMIN_PASSWORD` em fixed row id, ver `infra/scripts/seed-admin.js` |
| `created_at` | timestamptz | |

## `sessions`

Cookie-based session, mirrors reference `models/session.js`.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid, PK | value stored in session cookie |
| `user_id` | uuid, FK → `users.id` | |
| `expires_at` | timestamptz | |
| `created_at` | timestamptz | |

## `gift_lists`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `owner_user_id` | uuid, FK → `users.id`, not null | server-side rows only exist once shared, so always owned |
| `title` | text, not null | |
| `share_slug` | text, unique, not null | public URL segment for the shareable link (FR-009) |
| `status` | enum: `active`, `unshared` | flips to `unshared` when hosting fee lapses (FR-017) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Validation rules**: `title` required, 1–200 chars. `share_slug` generated server-side on creation, URL-safe, unique.

## `gift_items`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `gift_list_id` | uuid, FK → `gift_lists.id`, not null | |
| `marketplace_url` | text, not null | the original pasted link |
| `affiliate_url` | text, nullable | populated when the domain has a known affiliate adapter (FR-012/FR-015) |
| `title` | text, nullable | auto-fetched or manually entered (FR-003/FR-004) |
| `image_url` | text, nullable | |
| `price_cents` | integer, nullable | stored as integer cents to avoid float rounding; currency assumed store-local |
| `manual_override` | boolean, default false | true when the owner edited auto-fetched fields |
| `status` | enum: `available`, `purchased` | (FR-013/FR-014) |
| `purchased_at` | timestamptz, nullable | set when status flips to `purchased` |
| `position` | integer | manual ordering within the list |
| `created_at` | timestamptz | |

**Validation rules**: `marketplace_url` required, must be a well-formed URL. `title` required before an item is visible to visitors (either auto-fetched or manually filled) — an item cannot be saved with no title at all.

**State transitions**: `available → purchased` (one-way; only a list re-open by the owner, e.g. deleting/re-adding the item, can reset it — no direct `purchased → available` transition is exposed, matching Edge Cases in spec.md).

## `hosting_subscriptions`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `users.id`, not null, unique | one active subscription per owner account |
| `stripe_customer_id` | text, not null | |
| `stripe_subscription_id` | text, not null | |
| `status` | enum: `active`, `past_due`, `canceled` | mirrors Stripe subscription status via webhook |
| `current_period_end` | timestamptz | |
| `updated_at` | timestamptz | |

**Relationship**: an owner's `gift_lists.status` is kept in sync with their `hosting_subscriptions.status` by the billing webhook handler (research.md — Hosting fee billing): subscription becomes `past_due`/`canceled` → owned lists flip to `unshared`.

## Client-side local list (pre-sharing, `localStorage`)

Same shape as `gift_lists` + `gift_items` above, minus server-only fields (`owner_user_id`, `share_slug`, `affiliate_url`, `hosting_subscriptions`); `id` values are client-generated (UUID) and are reused as-is when the list is migrated server-side on share (FR-016), so items keep stable identity across the transition.
