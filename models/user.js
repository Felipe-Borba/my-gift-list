import database from "infra/database.js";
import { NotFoundError, ValidationError } from "infra/errors.js";
import password from "models/password.js";

const VALID_ROLES = ["admin", "teacher", "student"];
const PUBLIC_FIELDS =
  "id, name, username, role, active, created_at, updated_at";

async function create({ name, username, password: plainPassword, role }) {
  validateRequiredField("name", name);
  validateRequiredField("username", username);
  validateRequiredField("password", plainPassword);
  validateRole(role);
  await validateUniqueUsername(username);

  const hashedPassword = await password.hash(plainPassword);

  const results = await database.query({
    text: `
      INSERT INTO users (name, username, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING ${PUBLIC_FIELDS};
    `,
    values: [name, username, hashedPassword, role],
  });

  return results.rows[0];
}

async function findAll({ role } = {}) {
  const results = await database.query({
    text: `
      SELECT ${PUBLIC_FIELDS}
      FROM users
      WHERE $1::varchar IS NULL OR role = $1
      ORDER BY name ASC;
    `,
    values: [role ?? null],
  });

  return results.rows;
}

async function findOneByUsername(username) {
  const results = await database.query({
    text: "SELECT * FROM users WHERE username = $1 LIMIT 1;",
    values: [username],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "O usuário informado não foi encontrado no sistema.",
      action: "Verifique se o usuário está digitado corretamente.",
    });
  }

  return results.rows[0];
}

async function findOneById(id) {
  const results = await database.query({
    text: `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = $1 LIMIT 1;`,
    values: [id],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "O usuário informado não foi encontrado no sistema.",
      action: "Verifique se o identificador está correto.",
    });
  }

  return results.rows[0];
}

async function update(
  username,
  { name, username: newUsername, password: newPassword, role, active },
) {
  const currentUser = await findOneByUsername(username);

  if (newUsername !== undefined && newUsername !== currentUser.username) {
    await validateUniqueUsername(newUsername);
  }

  if (role !== undefined) {
    validateRole(role);
  }

  const hashedPassword =
    newPassword !== undefined ? await password.hash(newPassword) : undefined;

  const results = await database.query({
    text: `
      UPDATE users
      SET
        name = COALESCE($2, name),
        username = COALESCE($3, username),
        password = COALESCE($4, password),
        role = COALESCE($5, role),
        active = COALESCE($6, active),
        updated_at = now()
      WHERE id = $1
      RETURNING ${PUBLIC_FIELDS};
    `,
    values: [
      currentUser.id,
      name ?? null,
      newUsername ?? null,
      hashedPassword ?? null,
      role ?? null,
      active ?? null,
    ],
  });

  return results.rows[0];
}

async function remove(username) {
  const currentUser = await findOneByUsername(username);

  const linkedEvaluations = await database.query({
    text: `
      SELECT COUNT(*)::int AS total
      FROM evaluations
      WHERE student_id = $1 OR evaluator_id = $1;
    `,
    values: [currentUser.id],
  });

  if (linkedEvaluations.rows[0].total > 0) {
    throw new ValidationError({
      message: "Não é possível excluir um usuário com avaliações vinculadas.",
      action:
        "Exclua as avaliações do usuário antes, ou inative-o para bloquear o acesso.",
    });
  }

  const results = await database.query({
    text: `DELETE FROM users WHERE id = $1 RETURNING ${PUBLIC_FIELDS};`,
    values: [currentUser.id],
  });

  return results.rows[0];
}

function toPublic(userRow) {
  const publicUser = { ...userRow };
  delete publicUser.password;
  return publicUser;
}

function validateRequiredField(fieldName, value) {
  if (!value) {
    throw new ValidationError({
      message: `O campo "${fieldName}" é obrigatório.`,
      action: "Preencha o campo e tente novamente.",
    });
  }
}

function validateRole(role) {
  if (!VALID_ROLES.includes(role)) {
    throw new ValidationError({
      message: "O perfil informado é inválido.",
      action: `Utilize um dos perfis válidos: ${VALID_ROLES.join(", ")}.`,
    });
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: "SELECT 1 FROM users WHERE username = $1;",
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O nome de usuário informado já está em uso.",
      action: "Utilize outro nome de usuário.",
    });
  }
}

const user = {
  create,
  findAll,
  findOneByUsername,
  findOneById,
  update,
  remove,
  toPublic,
};

export default user;
