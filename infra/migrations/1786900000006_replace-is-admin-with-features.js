exports.up = (pgm) => {
  pgm.addColumn("users", {
    features: {
      type: "text[]",
      notNull: true,
      default: pgm.func("'{}'"),
    },
  });

  // Usuários existentes ganham o conjunto padrão de features; quem já era
  // is_admin também ganha a feature que hoje libera a taxa de hospedagem.
  pgm.sql(`
    UPDATE users
    SET features = ARRAY['create:session', 'read:session', 'create:gift-list']
      || CASE
           WHEN is_admin THEN ARRAY['create:gift-list:without-payment']
           ELSE ARRAY[]::text[]
         END;
  `);

  pgm.dropColumn("users", "is_admin");
};

exports.down = false;
