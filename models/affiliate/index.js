import amazon from "models/affiliate/amazon.js";
import mercadoLivre from "models/affiliate/mercado-livre.js";
import shopee from "models/affiliate/shopee.js";

const ADAPTERS = [amazon, mercadoLivre, shopee];

// Resolve o link de afiliado para um marketplace_url; domínios sem adapter
// conhecido caem no fallback (link original, sem rastreamento) — FR-015.
function resolveAffiliateUrl(marketplaceUrl) {
  let hostname;

  try {
    hostname = new URL(marketplaceUrl).hostname;
  } catch {
    return null;
  }

  const adapter = ADAPTERS.find((candidate) => candidate.matches(hostname));

  if (!adapter) {
    return null;
  }

  return adapter.buildAffiliateUrl(marketplaceUrl);
}

const affiliate = {
  resolveAffiliateUrl,
};

export default affiliate;
