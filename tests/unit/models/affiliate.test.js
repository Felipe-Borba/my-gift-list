import affiliate from "models/affiliate/index.js";

describe("affiliate registry", () => {
  test("wraps an Amazon URL with the affiliate tag", () => {
    const result = affiliate.resolveAffiliateUrl(
      "https://www.amazon.com.br/produto/dp/B000123",
    );

    expect(result).toContain("amazon.com.br");
    expect(result).toContain("tag=giftlist-20");
  });

  test("wraps a Mercado Livre URL with the affiliate tag", () => {
    const result = affiliate.resolveAffiliateUrl(
      "https://www.mercadolivre.com.br/produto/p/MLB123",
    );

    expect(result).toContain("mercadolivre.com.br");
    expect(result).toContain("matt_tool=giftlist_suggestions");
  });

  test("wraps a Shopee URL with the affiliate tag", () => {
    const result = affiliate.resolveAffiliateUrl(
      "https://shopee.com.br/produto-i.123.456",
    );

    expect(result).toContain("shopee.com.br");
    expect(result).toContain("af_tag=giftlist_suggestions");
  });

  test("falls back to null for an unsupported marketplace domain", () => {
    const result = affiliate.resolveAffiliateUrl(
      "https://www.some-other-store.example/produto/1",
    );

    expect(result).toBeNull();
  });

  test("falls back to null for a malformed URL", () => {
    const result = affiliate.resolveAffiliateUrl("not-a-url");

    expect(result).toBeNull();
  });
});
