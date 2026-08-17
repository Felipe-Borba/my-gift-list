const bcryptjs = require("bcryptjs");

exports.up = async (pgm) => {
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!initialPassword) {
    throw new Error(
      "ADMIN_INITIAL_PASSWORD precisa estar definida no ambiente para criar o primeiro administrador.",
    );
  }

  const rounds = process.env.NODE_ENV === "production" ? 14 : 1;
  const passwordHash = await bcryptjs.hash(initialPassword, rounds);

  pgm.sql(`
    INSERT INTO users (name, username, password, role)
    VALUES ('Administrador', 'admin', '${passwordHash}', 'admin');
  `);
};

exports.down = false;
