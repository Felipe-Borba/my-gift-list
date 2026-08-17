const AFFILIATE_TAG =
  process.env.SHOPEE_AFFILIATE_TAG || "giftlist_suggestions";
const HOSTNAME_PATTERN = /(^|\.)shopee\.[a-z.]+$/i;

function matches(hostname) {
  return HOSTNAME_PATTERN.test(hostname);
}

function buildAffiliateUrl(url) {
  const affiliateUrl = new URL(url);
  affiliateUrl.searchParams.set("af_tag", AFFILIATE_TAG);
  return affiliateUrl.toString();
}

const shopee = { matches, buildAffiliateUrl };

export default shopee;
