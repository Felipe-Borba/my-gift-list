import crypto from "node:crypto";

import database from "infra/database.js";
import { NotFoundError, ValidationError } from "infra/errors.js";
import affiliate from "models/affiliate/index.js";

function slugify(title) {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "lista"
  );
}

function generateShareSlug(title) {
  const suffix = crypto.randomBytes(4).toString("hex");
  return `${slugify(title)}-${suffix}`;
}

async function create({ ownerUserId, title, items }) {
  validateTitle(title);

  const client = await database.getNewClient();

  try {
    await client.query("BEGIN");

    const shareSlug = generateShareSlug(title);

    const listResult = await client.query({
      text: `
        INSERT INTO gift_lists (owner_user_id, title, share_slug)
        VALUES ($1, $2, $3)
        RETURNING *;
      `,
      values: [ownerUserId, title, shareSlug],
    });
    const list = listResult.rows[0];

    const insertedItems = [];
    for (const [index, item] of (items || []).entries()) {
      const affiliateUrl = affiliate.resolveAffiliateUrl(item.marketplace_url);

      const itemResult = await client.query({
        text: `
          INSERT INTO gift_items
            (gift_list_id, marketplace_url, affiliate_url, title, image_url, price_cents, manual_override, position)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `,
        values: [
          list.id,
          item.marketplace_url,
          affiliateUrl,
          item.title || null,
          item.image_url || null,
          item.price_cents ?? null,
          Boolean(item.manual_override),
          index,
        ],
      });
      insertedItems.push(itemResult.rows[0]);
    }

    await client.query("COMMIT");

    return { ...list, items: insertedItems };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

async function findByShareSlug(shareSlug) {
  const listResult = await database.query({
    text: "SELECT * FROM gift_lists WHERE share_slug = $1 LIMIT 1;",
    values: [shareSlug],
  });

  if (listResult.rowCount === 0) {
    throw new NotFoundError({
      message: "Lista não encontrada.",
      action: "Verifique se o link foi digitado corretamente.",
    });
  }

  const list = listResult.rows[0];

  const itemsResult = await database.query({
    text: "SELECT * FROM gift_items WHERE gift_list_id = $1 ORDER BY position ASC;",
    values: [list.id],
  });

  return { ...list, items: itemsResult.rows };
}

function validateTitle(title) {
  if (!title || !title.trim()) {
    throw new ValidationError({
      message: 'O campo "title" é obrigatório.',
      action: "Informe um nome para a lista.",
    });
  }
}

const giftList = {
  create,
  findByShareSlug,
};

export default giftList;
