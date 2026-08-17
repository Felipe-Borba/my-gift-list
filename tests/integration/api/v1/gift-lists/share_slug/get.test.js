import database from "infra/database.js";
import billing from "models/billing.js";
import giftList from "models/gift-list.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function createSharedList(user, { title = "Lista Pública" } = {}) {
  await billing.upsertFromSubscription({
    userId: user.id,
    stripeCustomerId: "cus_test_123",
    stripeSubscriptionId: `sub_${user.id}`,
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return await giftList.create({
    ownerUserId: user.id,
    title,
    items: [
      {
        marketplace_url: "https://www.amazon.com.br/produto/1",
        title: "Fone de Ouvido",
        image_url: "https://example.com/foto.jpg",
        price_cents: 19990,
      },
    ],
  });
}

describe("GET /api/v1/gift-lists/[share_slug]", () => {
  describe("Anonymous user", () => {
    test("With an existing, active shared list", async () => {
      const user = await orchestrator.createUser();
      const list = await createSharedList(user);

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists/${list.share_slug}`,
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        title: "Lista Pública",
        status: "active",
        items: [
          {
            id: list.items[0].id,
            title: "Fone de Ouvido",
            image_url: "https://example.com/foto.jpg",
            price_cents: 19990,
            status: "available",
          },
        ],
      });
      expect(JSON.stringify(responseBody)).not.toContain("marketplace_url");
      expect(JSON.stringify(responseBody)).not.toContain("affiliate_url");
    });

    test("With an unknown share_slug", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists/does-not-exist`,
      );

      expect(response.status).toBe(404);
    });

    test("With a list whose hosting fee has lapsed", async () => {
      const user = await orchestrator.createUser();
      const list = await createSharedList(user, { title: "Lista Expirada" });

      await database.query({
        text: "UPDATE gift_lists SET status = 'unshared' WHERE id = $1;",
        values: [list.id],
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists/${list.share_slug}`,
      );

      expect(response.status).toBe(404);
    });
  });
});
