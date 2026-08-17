import crypto from "node:crypto";

import database from "infra/database.js";
import { UnauthorizedError } from "infra/errors.js";

const EXPIRATION_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000; // 30 dias

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const results = await database.query({
    text: `
      INSERT INTO sessions (token, user_id, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *;
    `,
    values: [token, userId, expiresAt],
  });

  return results.rows[0];
}

async function findOneValidByToken(token) {
  const results = await database.query({
    text: `
      SELECT * FROM sessions
      WHERE token = $1 AND expires_at > now()
      LIMIT 1;
    `,
    values: [token],
  });

  if (results.rowCount === 0) {
    throw new UnauthorizedError({
      message: "Usuário não possui sessão ativa.",
      action: "Faça login novamente.",
    });
  }

  return results.rows[0];
}

async function expireByToken(token) {
  const results = await database.query({
    text: "DELETE FROM sessions WHERE token = $1 RETURNING *;",
    values: [token],
  });

  return results.rows[0];
}

const session = {
  EXPIRATION_IN_MILLISECONDS,
  create,
  findOneValidByToken,
  expireByToken,
};

export default session;
