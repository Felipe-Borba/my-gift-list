exports.up = (pgm) => {
  pgm.createTable("evaluations", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    student_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "RESTRICT",
    },
    evaluator_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "RESTRICT",
    },
    height: { type: "numeric(3,2)", notNull: true },
    weight: { type: "numeric(5,2)", notNull: true },
    bmi: { type: "numeric(4,2)", notNull: true },
    classification: { type: "varchar(30)", notNull: true },
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

  pgm.createIndex("evaluations", "student_id");
  pgm.createIndex("evaluations", "evaluator_id");
};

exports.down = false;
