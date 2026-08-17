# Feature Specification: Gift List Suggestions

**Feature Branch**: `001-gift-list-suggestions`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "quero um projeto simples de lista de sugestão de presentes, a minha idéia principal é o usuário poder criar uma lista de itens que ele gostaria de receber como presente, idealmente ele só colocaria o link de compra do marketplace ai a plataforma se encarrega do resto, listar, puxar foto do item essas coisa, se outra pessoa comprar pelo link gostaria de ter um trafego pago no link para eu ganhar um cascalho e tb registra que o item da lista foi adquirido, a minha idéia e a plataforma ser free salvando tudo em local historage mesmo sem precisar criar conta nem nada, mas ai quando ele quiser compartilhar entra no fluxo de criar conta e combrar um pequena taxinha de hospedagem por estar usando recursos de banco da dados etc."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a gift list from purchase links (Priority: P1)

A person wants to build a wish list of things they'd like to receive as gifts. Instead of typing in item details by hand, they paste the product link from a marketplace and the platform automatically pulls in the item's photo, title, and price to add it to their list. No account is required — the list lives in the browser they're using.

**Why this priority**: This is the core value proposition of the product: turning a few pasted links into a ready-to-share gift list with almost no manual effort. Without this, there is no product.

**Independent Test**: Can be fully tested by opening the app with no account, creating a new list, pasting a marketplace item link, and confirming the item appears with photo/title populated automatically.

**Acceptance Scenarios**:

1. **Given** a user with no account and no existing list, **When** they create a new list and paste a valid marketplace product link, **Then** the system adds an item to the list showing its title, photo, and price when available.
2. **Given** a user has added items to their list, **When** they close and reopen the browser later, **Then** the list and its items are still there without requiring login.
3. **Given** a user pastes a link the system cannot read (invalid, unreachable, or unsupported page), **When** they submit it, **Then** the system shows an error and lets them fill in the item's details manually instead.

---

### User Story 2 - Share the list with others (Priority: P2)

Once the list is ready, the owner wants to share it with friends and family so they know what to buy. Sharing moves the list from the owner's browser onto the platform's servers, which requires creating an account and paying a small recurring fee that covers the hosting cost.

**Why this priority**: Sharing is what makes the list useful to other people, and it's the point where the product starts generating revenue — but it only matters once a list already exists (User Story 1).

**Independent Test**: Starting from an existing local-only list, walk through account creation and fee payment, then confirm a visitor without an account can open the resulting shared link and view the list.

**Acceptance Scenarios**:

1. **Given** a user has a local-only list, **When** they choose to share it, **Then** the system asks them to create an account and pay the hosting fee before producing a shareable link.
2. **Given** a list has been shared, **When** any visitor opens the shareable link, **Then** they can view all items and their availability status, but cannot edit the list.
3. **Given** the fee payment fails or is not completed, **When** the owner tries to share, **Then** the list remains local-only and no shareable link is created.

---

### User Story 3 - Buy a gift and mark it as taken (Priority: P3)

A visitor to a shared list decides to buy one of the items. Clicking the buy button sends them to the marketplace through a tracked link so the platform earns a referral commission, and the item gets marked as acquired so other visitors don't buy a duplicate.

**Why this priority**: This closes the loop that prevents duplicate gifts and is the platform's monetization mechanism, but it depends on a list already being shared (User Story 2).

**Independent Test**: On a shared list, click "buy" on an item, confirm the visitor is routed to the marketplace through the platform's tracked link, and confirm the item's status updates to purchased/acquired for future visitors.

**Acceptance Scenarios**:

1. **Given** a shared list item, **When** a visitor clicks "buy", **Then** they are redirected to the marketplace through the platform's tracked referral link.
2. **Given** a purchase has been registered for an item, **When** any visitor views the list afterward, **Then** that item is shown as already taken/acquired, without revealing who bought it.
3. **Given** an item is already marked acquired, **When** another visitor views the list, **Then** the buy action for that item is disabled or clearly marked as unavailable.

---

### Edge Cases

- What happens when a pasted link points to a marketplace the platform doesn't support for automatic details or referral tracking?
- What happens when a marketplace page changes its layout and the system can no longer extract the photo/title (fetch failure after previously working)?
- What happens when someone buys the item directly on the marketplace without going through the platform's tracked link (no way to auto-detect the purchase)?
- What happens when a user clears their browser data or switches devices before ever creating an account (list is not recoverable)?
- What happens when two visitors try to buy/claim the same item at nearly the same time?
- What happens when the owner deletes an item or the whole list after it has already been shared and some items were marked acquired?
- What happens when the owner's hosting fee payment lapses after the list has already been shared (does the shared link stop working, and are visitors/owner warned beforehand)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow any user, without creating an account, to create a gift list and add items to it.
- **FR-002**: System MUST allow a user to add an item to a list by pasting a marketplace product URL.
- **FR-003**: System MUST automatically retrieve and display the item's title, photo, and price (when available) from the pasted URL.
- **FR-004**: System MUST let the user manually enter or correct an item's title, photo, or price when automatic retrieval fails or returns incomplete information.
- **FR-005**: System MUST persist a list entirely in the user's local browser storage when no account exists, so list creation and editing never require login.
- **FR-006**: System MUST allow the list owner to remove individual items or delete the entire list.
- **FR-007**: System MUST require the owner to create an account before a list can be turned into a shared, publicly viewable list.
- **FR-008**: System MUST charge the owner a small recurring hosting fee, billed monthly, once they choose to share a list, reflecting the ongoing cost of storing and serving that list.
- **FR-009**: System MUST generate a shareable link for a list once the owner has an account and their hosting fee payment is active.
- **FR-010**: System MUST allow anyone with a shared list's link to view its items and their availability status without needing an account of their own.
- **FR-011**: System MUST prevent visitors who are not the list owner from editing list contents.
- **FR-012**: System MUST route outbound "buy" clicks on shared list items through the platform's own affiliate/referral tracked link so the resulting purchase can be attributed to the platform.
- **FR-013**: System MUST let a visitor confirm that they purchased an item (self-reported "I bought this" action) so it can be registered as acquired; the system MAY additionally reconcile this status later using marketplace affiliate conversion data when available, without blocking on it.
- **FR-014**: System MUST display an item's acquired/purchased status to all visitors of a shared list, without revealing who purchased it.
- **FR-015**: System MUST support automatic metadata retrieval and affiliate tracking for a defined initial set of major marketplaces, and MUST still accept links from other sites by falling back to manual entry of the item's details (without affiliate tracking for those unsupported sites).
- **FR-016**: System MUST migrate/attach an existing local-only list to a newly created account when the owner opts to share it, so no list data is lost in the transition.
- **FR-017**: System MUST stop serving a shared list's public link if the owner's hosting fee payment lapses, and MUST notify the owner before that happens.

### Key Entities

- **Gift List**: A named collection of gift items created by an owner; has a storage mode (local-only vs. hosted/shared) and, once shared, a unique shareable link.
- **Gift Item**: A single desired item within a list; holds the marketplace URL, the retrieved (or manually entered) title/photo/price, and an acquisition status (available/purchased).
- **Owner Account**: Created only when a list transitions to shared mode; holds the owner's identity/contact info and hosting-fee billing/subscription status.
- **Affiliate Link Record**: The platform's tracked outbound link for a gift item's marketplace URL, used to attribute a resulting purchase back to the platform for commission.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can create a gift list and add their first item via a pasted link in under 2 minutes without creating an account.
- **SC-002**: At least 80% of pasted marketplace links from supported marketplaces successfully auto-populate title and photo without manual entry.
- **SC-003**: A list owner can go from "local-only list" to having a working shareable link in under 5 minutes, including account creation and fee payment.
- **SC-004**: 100% of purchases initiated through a shared list's buy links are routed through the platform's tracked referral link.
- **SC-005**: Visitors can tell, with zero ambiguity, which items are still available versus already purchased on 100% of shared list views.
- **SC-006**: Users who create a list without an account and return later on the same browser/device find their list intact 100% of the time, barring cleared browser storage.

## Assumptions

- Marketplace product pages expose enough public metadata (e.g., page preview tags) for the system to extract title, image, and price without needing a private data-sharing agreement with every retailer.
- "Local storage" means the list lives entirely in the user's browser and is not backed up by the platform; users are informed that clearing browser data or switching devices loses the list unless they create an account first.
- The hosting fee is intentionally small/nominal, sized to cover backend storage and bandwidth costs rather than to be the primary revenue source — the main monetization is the affiliate/referral commission earned on purchases.
- When a local-list owner creates an account to share, their existing local list is automatically carried over to the new account with no manual re-entry.
- Only one owner account manages a given shared list; collaborative/multi-owner editing of the same list is out of scope for this feature.
- Visitors who buy a gift are not required to create an account or reveal their identity to the list owner (the recipient never learns who bought what).
- Both mobile and desktop web browsers are supported; a native mobile app is not required for this feature.
