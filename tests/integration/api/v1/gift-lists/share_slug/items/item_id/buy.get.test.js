import billing from "models/billing.js";
import giftList from "models/gift-list.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function createSharedListWithItem({
  marketplaceUrl = "https://www.amazon.com.br/produto/1",
} = {}) {
  const user = await orchestrator.createUser();

  await billing.upsertFromSubscription({
    userId: user.id,
    stripeCustomerId: "cus_test_123",
    stripeSubscriptionId: `sub_${user.id}`,
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return await giftList.create({
    ownerUserId: user.id,
    title: "Lista para comprar",
    items: [{ marketplace_url: marketplaceUrl, title: "Item" }],
  });
}

describe("GET /api/v1/gift-lists/[share_slug]/items/[item_id]/buy", () => {
  describe("Anonymous visitor", () => {
    test("Buying an item from a supported marketplace", async () => {
      const list = await createSharedListWithItem();
      const item = list.items[0];

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists/${list.share_slug}/items/${item.id}/buy`,
        { redirect: "manual" },
      );

      expect(response.status).toBe(302);
      const location = response.headers.get("location");
      expect(location).toContain("amazon.com.br");
      expect(location).toContain("tag=giftlist-20");

      const publicView = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists/${list.share_slug}`,
      );
      const publicBody = await publicView.json();
      expect(publicBody.items[0].status).toBe("purchased");
    });

    test("Buying an item from an unsupported marketplace falls back to the raw URL", async () => {
      const list = await createSharedListWithItem({
        marketplaceUrl: "https://www.some-other-store.example/produto/1",
      });
      const item = list.items[0];

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists/${list.share_slug}/items/${item.id}/buy`,
        { redirect: "manual" },
      );

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe(
        "https://www.some-other-store.example/produto/1",
      );
    });

    test("Buying the same item twice is idempotent", async () => {
      const list = await createSharedListWithItem();
      const item = list.items[0];
      const buyUrl = `${orchestrator.webserverUrl}/api/v1/gift-lists/${list.share_slug}/items/${item.id}/buy`;

      const first = await fetch(buyUrl, { redirect: "manual" });
      const second = await fetch(buyUrl, { redirect: "manual" });

      expect(first.status).toBe(302);
      expect(second.status).toBe(302);
      expect(second.headers.get("location")).toBe(
        first.headers.get("location"),
      );
    });

    test("With an unknown item id", async () => {
      const list = await createSharedListWithItem();

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists/${list.share_slug}/items/00000000-0000-0000-0000-000000000000/buy`,
        { redirect: "manual" },
      );

      expect(response.status).toBe(404);
    });
  });
});
