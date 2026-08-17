import controller from "infra/controller.js";
import giftItem from "models/gift-item.js";

async function getHandler(request, response) {
  const { share_slug: shareSlug, item_id: itemId } = request.query;

  const item = await giftItem.markPurchased(shareSlug, itemId);
  const redirectUrl = item.affiliate_url || item.marketplace_url;

  response.redirect(302, redirectUrl);
}

export default controller.router({ GET: getHandler });
