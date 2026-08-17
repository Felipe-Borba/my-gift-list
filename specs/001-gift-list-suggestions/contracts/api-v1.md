# API Contracts: Gift List Suggestions (`/api/v1`)

Follows this repo's reference conventions (`impl/next-deschamps`): versioned routes, plural resource names, snake_case JSON, dynamic segments in brackets, and the shared error contract (`{name, message, action, status_code}`) via `infra/controller.js` / `infra/errors.js`. Anonymous list CRUD has **no API contract** — it never leaves the browser (see [research.md](../research.md)). Endpoints below only exist once a list is shared or is in the process of becoming shared.

## `POST /api/v1/link-previews`

Fetches a marketplace URL server-side and extracts metadata (research.md — Marketplace link metadata retrieval). Public, no auth — used both before and after sharing.

**Request**
```json
{ "url": "https://www.marketplace.example/product/123" }
```

**Response `200`** (success or partial)
```json
{
  "title": "Wireless Headphones",
  "image_url": "https://.../photo.jpg",
  "price_cents": 29900,
  "resolved": true
}
```
`resolved: false` (with any subset of the other fields `null`) signals the client to fall back to manual entry (FR-004) — this is not an error response.

**Response `400`** — malformed `url`.

## `POST /api/v1/users`

Creates the owner account, first step of the share flow (FR-007).

**Request**: `{ "email": "...", "password": "..." }`
**Response `201`**: `{ "id": "...", "email": "...", "created_at": "..." }`
**Response `400`**: validation error (duplicate email, weak password, etc.) — standard error contract.

## `POST /api/v1/sessions`

Login, cookie-based session (mirrors reference `models/session.js`).

**Request**: `{ "email": "...", "password": "..." }`
**Response `201`**: sets session cookie; body `{ "created_at": "..." }`
**Response `401`**: invalid credentials.

## `POST /api/v1/gift-lists`

Creates the server-side list from the client's local list, in one transaction (FR-016). **Auth required.**

**Request**
```json
{
  "title": "My Birthday List",
  "items": [
    { "id": "client-uuid-1", "marketplace_url": "...", "title": "...", "image_url": "...", "price_cents": 1000, "manual_override": false }
  ]
}
```

**Response `201`**
```json
{
  "id": "...",
  "title": "My Birthday List",
  "share_slug": "my-birthday-list-x7f2",
  "status": "active",
  "share_url": "https://.../l/my-birthday-list-x7f2",
  "created_at": "..."
}
```

Requires an `active` `hosting_subscriptions` row for the authenticated user — `402` (payment required) if the owner has not completed billing checkout yet (FR-008/FR-009); the client is expected to run Stripe Checkout first and retry.

## `GET /api/v1/gift-lists/[share_slug]`

Public read of a shared list (FR-010). No auth.

**Response `200`**
```json
{
  "title": "My Birthday List",
  "status": "active",
  "items": [
    { "id": "...", "title": "...", "image_url": "...", "price_cents": 1000, "status": "available" }
  ]
}
```
`marketplace_url`/`affiliate_url` are intentionally omitted from this public read — visitors reach the marketplace only through the buy redirect below, never a raw link (keeps affiliate wrapping non-bypassable by casual copy-paste).

**Response `404`**: unknown slug, or list `status = unshared` (fee lapsed) — same 404 in both cases so visitors can't distinguish "never existed" from "owner stopped paying" (FR-017 privacy-neutral behavior for the owner).

## `PATCH /api/v1/gift-lists/[share_slug]/items/[item_id]`

Owner-only edit/remove of an item on an already-shared list (FR-006/FR-011). **Auth required, must be the list's owner.**

**Request** (partial): `{ "title": "...", "image_url": "...", "price_cents": ..., "manual_override": true }` or `{ "deleted": true }`
**Response `200`**: updated item. **Response `403`**: not the owner. **Response `404`**: unknown list/item.

## `GET /api/v1/gift-lists/[share_slug]/items/[item_id]/buy`

Public buy action (FR-012/FR-013/FR-014). No auth. Not a JSON endpoint — a redirect.

**Behavior**: marks the item `purchased` (idempotent if already purchased), then responds `302` to the item's `affiliate_url` (or `marketplace_url` if the domain has no affiliate adapter, per FR-015).

**Response `404`**: unknown list/item, or item already removed.

## `POST /api/v1/billing/checkout`

Starts the Stripe Checkout flow for the hosting fee (FR-008). **Auth required.**

**Response `200`**: `{ "checkout_url": "https://checkout.stripe.com/..." }` — client redirects the browser there.

## `POST /api/v1/billing/webhook`

Stripe webhook receiver (research.md — Hosting fee billing). Verifies Stripe signature, not user-authenticated. Updates `hosting_subscriptions.status` and, on `past_due`/`canceled`, flips the owner's `gift_lists.status` to `unshared` (FR-017).

**Response `200`**: `{ "received": true }` on any recognized event; non-2xx on signature verification failure so Stripe retries.
