const AFFILIATE_TAG =
  process.env.MERCADO_LIVRE_AFFILIATE_TAG || "giftlist_suggestions";
const HOSTNAME_PATTERN = /(^|\.)mercadolivre\.com(\.[a-z]+)?$/i;

function matches(hostname) {
  return HOSTNAME_PATTERN.test(hostname);
}

function buildAffiliateUrl(url) {
  const affiliateUrl = new URL(url);
  affiliateUrl.searchParams.set("matt_tool", AFFILIATE_TAG);
  return affiliateUrl.toString();
}

const mercadoLivre = { matches, buildAffiliateUrl };

export default mercadoLivre;
