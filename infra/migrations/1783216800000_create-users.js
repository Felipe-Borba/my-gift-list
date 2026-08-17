exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: { type: "varchar(60)", notNull: true },
    username: { type: "varchar(30)", notNull: true, unique: true },
    password: { type: "varchar(72)", notNull: true },
    role: {
      type: "varchar(20)",
      notNull: true,
      check: "role IN ('admin', 'teacher', 'student')",
    },
    active: { type: "boolean", notNull: true, default: true },
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
