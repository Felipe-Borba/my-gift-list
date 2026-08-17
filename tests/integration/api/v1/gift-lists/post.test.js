import authorization from "models/authorization.js";
import billing from "models/billing.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/gift-lists", () => {
  describe("Authenticated user without an active hosting subscription", () => {
    test("Attempting to create a shared list", async () => {
      const user = await orchestrator.createUser();
      const session = await orchestrator.createSession(user.id);

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...orchestrator.cookieHeaderFor(session),
          },
          body: JSON.stringify({ title: "Lista sem assinatura", items: [] }),
        },
      );

      expect(response.status).toBe(402);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("PaymentRequiredError");
    });
  });

  describe("Authenticated user with an active hosting subscription", () => {
    test("With a title and items", async () => {
      const user = await orchestrator.createUser();
      const session = await orchestrator.createSession(user.id);

      await billing.upsertFromSubscription({
        userId: user.id,
        stripeCustomerId: "cus_test_123",
        stripeSubscriptionId: "sub_test_123",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...orchestrator.cookieHeaderFor(session),
          },
          body: JSON.stringify({
            title: "Aniversário da Maria",
            items: [
              {
                marketplace_url: "https://www.amazon.com.br/produto/1",
                title: "Fone de Ouvido",
                image_url: "https://example.com/foto.jpg",
                price_cents: 19990,
              },
            ],
          }),
        },
      );

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody.title).toBe("Aniversário da Maria");
      expect(responseBody.status).toBe("active");
      expect(responseBody.share_slug).toMatch(
        /^aniversario-da-maria-[a-f0-9]{8}$/,
      );
      expect(responseBody.share_url).toContain(responseBody.share_slug);
    });

    test("Without authentication", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Sem login", items: [] }),
        },
      );

      expect(response.status).toBe(401);
    });
  });

  describe("Admin user without an active hosting subscription", () => {
    test("Attempting to create a shared list", async () => {
      const admin = await orchestrator.createUser({
        features: authorization.ROOT_FEATURES,
      });
      const session = await orchestrator.createSession(admin.id);

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/gift-lists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...orchestrator.cookieHeaderFor(session),
          },
          body: JSON.stringify({ title: "Lista do admin", items: [] }),
        },
      );

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody.title).toBe("Lista do admin");
    });
  });
});
