import rateLimit from "infra/rate-limit.js";

describe("rate-limit", () => {
  test("allows requests under the limit", () => {
    const key = `test-${Date.now()}-under`;

    for (let i = 0; i < 3; i++) {
      expect(() =>
        rateLimit.assertWithinLimit(key, { limit: 3, windowMs: 60000 }),
      ).not.toThrow();
    }
  });

  test("throws once the limit is exceeded within the window", () => {
    const key = `test-${Date.now()}-over`;

    for (let i = 0; i < 2; i++) {
      rateLimit.assertWithinLimit(key, { limit: 2, windowMs: 60000 });
    }

    expect(() =>
      rateLimit.assertWithinLimit(key, { limit: 2, windowMs: 60000 }),
    ).toThrow("Limite de requisições excedido");
  });

  test("resets after the window elapses", async () => {
    const key = `test-${Date.now()}-reset`;

    rateLimit.assertWithinLimit(key, { limit: 1, windowMs: 10 });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(() =>
      rateLimit.assertWithinLimit(key, { limit: 1, windowMs: 10 }),
    ).not.toThrow();
  });
});
