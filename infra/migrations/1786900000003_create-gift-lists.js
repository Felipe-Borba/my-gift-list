exports.up = (pgm) => {
  pgm.createTable("gift_lists", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    owner_user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    title: { type: "varchar(200)", notNull: true },
    share_slug: { type: "text", notNull: true, unique: true },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "active",
      check: "status IN ('active', 'unshared')",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
};

exports.down = false;
