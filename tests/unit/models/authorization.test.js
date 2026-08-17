import authorization from "models/authorization.js";

describe("authorization.can", () => {
  test("returns true when the user has the feature", () => {
    const user = { features: ["create:gift-list"] };

    expect(authorization.can(user, "create:gift-list")).toBe(true);
  });

  test("returns false when the user does not have the feature", () => {
    const user = { features: ["create:gift-list"] };

    expect(authorization.can(user, "create:gift-list:without-payment")).toBe(
      false,
    );
  });

  test("returns false when the user has no features", () => {
    expect(authorization.can({ features: [] }, "create:gift-list")).toBe(false);
  });

  test("returns false for a nullish user", () => {
    expect(authorization.can(null, "create:gift-list")).toBe(false);
  });

  test("ROOT_FEATURES contains every default feature plus the payment bypass", () => {
    for (const feature of authorization.DEFAULT_FEATURES) {
      expect(authorization.ROOT_FEATURES).toContain(feature);
    }
    expect(authorization.ROOT_FEATURES).toContain(
      "create:gift-list:without-payment",
    );
  });
});
