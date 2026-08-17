import database from "infra/database.js";
import { NotFoundError, ValidationError } from "infra/errors.js";
import authorization from "models/authorization.js";
import password from "models/password.js";

const PUBLIC_FIELDS = "id, email, features, created_at";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function create({ email, password: plainPassword, features }) {
  validateEmail(email);
  validateRequiredField("password", plainPassword);
  await validateUniqueEmail(email);

  const hashedPassword = await password.hash(plainPassword);

  const results = await database.query({
    text: `
      INSERT INTO users (email, password, features)
      VALUES ($1, $2, $3)
      RETURNING ${PUBLIC_FIELDS};
    `,
    values: [
      email.toLowerCase(),
      hashedPassword,
      features ?? authorization.DEFAULT_FEATURES,
    ],
  });

  return results.rows[0];
}

async function findOneByEmail(email) {
  const results = await database.query({
    text: "SELECT * FROM users WHERE email = $1 LIMIT 1;",
    values: [email?.toLowerCase()],
  });

  if (results.rowCount === 0) {
    throw new NotFoundError({
      message: "O usuário informado não foi encontrado no sistema.",
      action: "Verifique se o e-mail está digitado corretamente.",
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

function validateRequiredField(fieldName, value) {
  if (!value) {
    throw new ValidationError({
      message: `O campo "${fieldName}" é obrigatório.`,
      action: "Preencha o campo e tente novamente.",
    });
  }
}

function validateEmail(email) {
  validateRequiredField("email", email);

  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError({
      message: "O e-mail informado é inválido.",
      action: "Informe um e-mail no formato nome@dominio.com.",
    });
  }
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: "SELECT 1 FROM users WHERE email = $1;",
    values: [email.toLowerCase()],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O e-mail informado já está em uso.",
      action: "Utilize outro e-mail ou faça login.",
    });
  }
}

const user = {
  create,
  findOneByEmail,
  findOneById,
};

export default user;
