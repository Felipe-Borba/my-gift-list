import controller from "infra/controller.js";
import giftItem from "models/gift-item.js";

async function patchHandler(request, response) {
  const authenticatedUser = await controller.getAuthenticatedUser(request);
  const { share_slug: shareSlug, item_id: itemId } = request.query;

  const updatedItem = await giftItem.update(
    shareSlug,
    itemId,
    authenticatedUser.id,
    request.body ?? {},
  );

  if (!updatedItem) {
    return response.status(200).json({ deleted: true });
  }

  response.status(200).json(updatedItem);
}

export default controller.router({ PATCH: patchHandler });
