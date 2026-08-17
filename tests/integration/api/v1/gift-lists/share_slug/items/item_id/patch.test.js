import billing from "models/billing.js";
import giftList from "models/gift-list.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function createSharedListWithItem(user) {
  await billing.upsertFromSubscription({
    userId: user.id,
    stripeCustomerId: "cus_test_123",
    stripeSubscriptionId: `sub_${user.id}`,
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return await giftList.create({
    ownerUserId: user.id,
    title: "Lista com item",
    items: [
      {
        marketplace_url: "https://www.amazon.com.br/produto/1",
        title: "Fone de Ouvido",
        price_cents: 19990,
      },
    ],
  });
}

describe("PATCH /api/v1/gift-lists/[share_slug]/items/[item_id]", () => {
  describe("Authenticated owner", () => {
    test("Editing the item's title", async () => {
      const user = await orchestrator.createUser();
      const session = await orchestrator.createSession(user.id);
      const list = await createSharedListWithItem(user);
      const item = list.items[0];

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists/${list.share_slug}/items/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...orchestrator.cookieHeaderFor(session),
          },
          body: JSON.stringify({ title: "Nome corrigido" }),
        },
      );

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody.title).toBe("Nome corrigido");
    });

    test("Deleting the item", async () => {
      const user = await orchestrator.createUser();
      const session = await orchestrator.createSession(user.id);
      const list = await createSharedListWithItem(user);
      const item = list.items[0];

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists/${list.share_slug}/items/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...orchestrator.cookieHeaderFor(session),
          },
          body: JSON.stringify({ deleted: true }),
        },
      );

      expect(response.status).toBe(200);

      const getResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists/${list.share_slug}`,
      );
      const getBody = await getResponse.json();
      expect(getBody.items).toHaveLength(0);
    });
  });

  describe("A user who is not the list owner", () => {
    test("Attempting to edit someone else's item", async () => {
      const owner = await orchestrator.createUser();
      const list = await createSharedListWithItem(owner);
      const item = list.items[0];

      const otherUser = await orchestrator.createUser();
      const otherSession = await orchestrator.createSession(otherUser.id);

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists/${list.share_slug}/items/${item.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...orchestrator.cookieHeaderFor(otherSession),
          },
          body: JSON.stringify({ title: "Tentativa de invasão" }),
        },
      );

      expect(response.status).toBe(403);
    });
  });
});
