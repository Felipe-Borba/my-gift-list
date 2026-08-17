import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("Authenticated user", () => {
    test("Logging out invalidates the session", async () => {
      const createdUser = await orchestrator.createUser();
      const createdSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sessions`,
        {
          method: "DELETE",
          headers: orchestrator.cookieHeaderFor(createdSession),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.token).toBe(createdSession.token);

      const setCookieHeader = response.headers.get("set-cookie");
      expect(setCookieHeader).toContain("session_id=;");

      const meResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/user`,
        { headers: orchestrator.cookieHeaderFor(createdSession) },
      );

      expect(meResponse.status).toBe(401);
    });
  });

  describe("Anonymous user", () => {
    test("Without session cookie", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sessions`,
        { method: "DELETE" },
      );

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não autenticado.",
        action: "Faça login para acessar este recurso.",
        status_code: 401,
      });
    });
  });
});
