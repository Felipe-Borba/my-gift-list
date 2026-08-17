exports.up = (pgm) => {
  pgm.createTable("hosting_subscriptions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      unique: true,
      references: "users",
      onDelete: "CASCADE",
    },
    stripe_customer_id: { type: "text", notNull: true },
    stripe_subscription_id: { type: "text", notNull: true },
    status: {
      type: "varchar(20)",
      notNull: true,
      check: "status IN ('active', 'past_due', 'canceled')",
    },
    current_period_end: { type: "timestamptz" },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
};

exports.down = false;
