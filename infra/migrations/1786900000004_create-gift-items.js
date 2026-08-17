exports.up = (pgm) => {
  pgm.createTable("gift_items", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    gift_list_id: {
      type: "uuid",
      notNull: true,
      references: "gift_lists",
      onDelete: "CASCADE",
    },
    marketplace_url: { type: "text", notNull: true },
    affiliate_url: { type: "text" },
    title: { type: "text" },
    image_url: { type: "text" },
    price_cents: { type: "integer" },
    manual_override: { type: "boolean", notNull: true, default: false },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "available",
      check: "status IN ('available', 'purchased')",
    },
    purchased_at: { type: "timestamptz" },
    position: { type: "integer", notNull: true, default: 0 },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
};

exports.down = false;
