import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function login(credentials) {
  return await fetch(`${orchestrator.webserverUrl}/api/v1/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With valid credentials", async () => {
      const createdUser = await orchestrator.createUser({
        password: "senha-correta",
      });

      const response = await login({
        username: createdUser.username,
        password: "senha-correta",
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: createdUser.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      const setCookieHeader = response.headers.get("set-cookie");
      expect(setCookieHeader).toContain(`session_id=${responseBody.token}`);
      expect(setCookieHeader).toContain("HttpOnly");
      expect(setCookieHeader).toContain("SameSite=Lax");
    });

    test("With wrong password", async () => {
      const createdUser = await orchestrator.createUser({
        password: "senha-correta",
      });

      const response = await login({
        username: createdUser.username,
        password: "senha-errada",
      });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique usuário e senha e tente novamente.",
        status_code: 401,
      });
    });

    test("With unknown username", async () => {
      const response = await login({
        username: "nao.existe",
        password: "qualquer-senha",
      });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique usuário e senha e tente novamente.",
        status_code: 401,
      });
    });

    test("With inactive user", async () => {
      const inactiveUser = await orchestrator.createUser({
        password: "senha-correta",
        active: false,
      });

      const response = await login({
        username: inactiveUser.username,
        password: "senha-correta",
      });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        name: "UnauthorizedError",
        message: "Usuário inativo.",
        action: "Entre em contato com a administração da academia.",
        status_code: 401,
      });
    });

    test("With missing fields", async () => {
      const response = await login({ username: "sem-senha" });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        name: "ValidationError",
        message: "Usuário e senha são obrigatórios.",
        action: "Preencha os dois campos e tente novamente.",
        status_code: 400,
      });
    });

    test("With seeded admin credentials", async () => {
      const response = await login({
        username: "admin",
        password: process.env.ADMIN_INITIAL_PASSWORD,
      });

      expect(response.status).toBe(201);
    });
  });
});
