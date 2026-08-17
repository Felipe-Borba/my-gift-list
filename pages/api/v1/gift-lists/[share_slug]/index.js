import controller from "infra/controller.js";
import { NotFoundError } from "infra/errors.js";
import giftList from "models/gift-list.js";

async function getHandler(request, response) {
  const { share_slug: shareSlug } = request.query;

  const list = await giftList.findByShareSlug(shareSlug);

  if (list.status !== "active") {
    // Mesmo 404 de "nunca existiu" — o visitante não sabe se a hospedagem
    // do dono expirou ou se o link nunca existiu (FR-017).
    throw new NotFoundError({
      message: "Lista não encontrada.",
      action: "Verifique se o link foi digitado corretamente.",
    });
  }

  response.status(200).json({
    title: list.title,
    status: list.status,
    items: list.items.map((item) => ({
      id: item.id,
      title: item.title,
      image_url: item.image_url,
      price_cents: item.price_cents,
      status: item.status,
    })),
  });
}

export default controller.router({ GET: getHandler });
