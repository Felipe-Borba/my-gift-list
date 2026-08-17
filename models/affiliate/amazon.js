const AFFILIATE_TAG = process.env.AMAZON_AFFILIATE_TAG || "giftlist-20";
const HOSTNAME_PATTERN = /(^|\.)amazon\.[a-z.]+$/i;

function matches(hostname) {
  return HOSTNAME_PATTERN.test(hostname);
}

function buildAffiliateUrl(url) {
  const affiliateUrl = new URL(url);
  affiliateUrl.searchParams.set("tag", AFFILIATE_TAG);
  return affiliateUrl.toString();
}

const amazon = { matches, buildAffiliateUrl };

export default amazon;
