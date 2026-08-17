import { Client } from "pg";

// Não reaproveita infra/database.js e models/user.js aqui: eles usam imports
// "bare" (ex.: "infra/errors.js") que só resolvem dentro do bundler do
// Next.js. Esse script roda via `node` puro antes do servidor subir, então
// fala com o Postgres diretamente — mesma ideia de infra/scripts/wait-for-postgres.js.
import authorization from "../../models/authorization.js";
import password from "../../models/password.js";

// ID fixo (não gerado) para o registro do sysadmin: garante que, se
// ADMIN_EMAIL mudar no ambiente, o upsert atualiza a MESMA linha em vez de
// criar um admin duplicado e deixar o antigo órfão no banco.
const ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  const adminEmail = requireEnv("ADMIN_EMAIL").toLowerCase();
  const adminPassword = requireEnv("ADMIN_PASSWORD");
  const hashedPassword = await password.hash(adminPassword);

  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getSSLValues(),
  });

  await client.connect();

  try {
    await client.query({
      text: `
        INSERT INTO users (id, email, password, features)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            password = EXCLUDED.password,
            features = EXCLUDED.features;
      `,
      values: [
        ADMIN_USER_ID,
        adminEmail,
        hashedPassword,
        authorization.ROOT_FEATURES,
      ],
    });
  } finally {
    await client.end();
  }

  console.log(`🟢 Usuário admin (${adminEmail}) sincronizado com o banco.`);
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Variável de ambiente "${name}" é obrigatória para criar o admin.`,
    );
  }

  return value;
}

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return { ca: process.env.POSTGRES_CA };
  }

  return process.env.NODE_ENV === "production";
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
