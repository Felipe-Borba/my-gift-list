import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Authenticated user", () => {
    test("Retrieving own data", async () => {
      const createdUser = await orchestrator.createUser({ role: "teacher" });
      const createdSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        headers: orchestrator.cookieHeaderFor(createdSession),
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        name: createdUser.name,
        username: createdUser.username,
        role: "teacher",
        active: true,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("With a session of an inactivated user", async () => {
      const createdUser = await orchestrator.createUser();
      const createdSession = await orchestrator.createSession(createdUser.id);

      const adminUser = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(adminUser.id);

      await fetch(
        `${orchestrator.webserverUrl}/api/v1/users/${createdUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...orchestrator.cookieHeaderFor(adminSession),
          },
          body: JSON.stringify({ active: false }),
        },
      );

      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        headers: orchestrator.cookieHeaderFor(createdSession),
      });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        name: "UnauthorizedError",
        message: "Usuário inativo.",
        action: "Entre em contato com a administração da academia.",
        status_code: 401,
      });
    });
  });

  describe("Anonymous user", () => {
    test("Without session cookie", async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`);

      expect(response.status).toBe(401);
    });

    test("With an invalid session token", async () => {
      const response = await fetch(`${orchestrator.webserverUrl}/api/v1/user`, {
        headers: { Cookie: "session_id=token-invalido" },
      });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Faça login novamente.",
        status_code: 401,
      });
    });
  });
});
