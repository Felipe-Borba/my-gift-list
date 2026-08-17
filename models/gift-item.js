import database from "infra/database.js";
import { ForbiddenError, NotFoundError } from "infra/errors.js";

async function findWithOwner(shareSlug, itemId) {
  const results = await database.query({
    text: `
      SELECT gift_items.*, gift_lists.owner_user_id, gift_lists.status AS list_status
      FROM gift_items
      JOIN gift_lists ON gift_lists.id = gift_items.gift_list_id
      WHERE gift_lists.share_slug = $1 AND gift_items.id = $2
      LIMIT 1;
    `,
    values: [shareSlug, itemId],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "Item não encontrado.",
      action: "Verifique se o link foi digitado corretamente.",
    });
  }

  return results.rows[0];
}

function assertOwner(item, actorUserId) {
  if (item.owner_user_id !== actorUserId) {
    throw new ForbiddenError({
      message: "Você não tem permissão para alterar este item.",
      action: "Apenas o dono da lista pode editar ou remover itens.",
    });
  }
}

async function update(shareSlug, itemId, actorUserId, patch) {
  const item = await findWithOwner(shareSlug, itemId);
  assertOwner(item, actorUserId);

  if (patch.deleted) {
    await database.query({
      text: "DELETE FROM gift_items WHERE id = $1;",
      values: [itemId],
    });
    return null;
  }

  const results = await database.query({
    text: `
      UPDATE gift_items
      SET
        title = COALESCE($2, title),
        image_url = COALESCE($3, image_url),
        price_cents = COALESCE($4, price_cents),
        manual_override = COALESCE($5, manual_override)
      WHERE id = $1
      RETURNING *;
    `,
    values: [
      itemId,
      patch.title ?? null,
      patch.image_url ?? null,
      patch.price_cents ?? null,
      patch.manual_override ?? null,
    ],
  });

  return results.rows[0];
}

// Marca o item como adquirido (available -> purchased); idempotente — clicar
// de novo em um item já comprado não gera erro nem reverte o status (FR-013).
async function markPurchased(shareSlug, itemId) {
  const item = await findWithOwner(shareSlug, itemId);

  if (item.status === "purchased") {
    return item;
  }

  const results = await database.query({
    text: `
      UPDATE gift_items
      SET status = 'purchased', purchased_at = now()
      WHERE id = $1
      RETURNING *;
    `,
    values: [itemId],
  });

  return results.rows[0];
}

const giftItem = {
  findWithOwner,
  update,
  markPurchased,
};

export default giftItem;
