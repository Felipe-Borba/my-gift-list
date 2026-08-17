import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/sessions", () => {
  describe("Authenticated user", () => {
    test("With a valid session", async () => {
      const user = await orchestrator.createUser({
        email: "current-session@example.com",
      });
      const session = await orchestrator.createSession(user.id);

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sessions`,
        {
          headers: orchestrator.cookieHeaderFor(session),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.id).toBe(user.id);
      expect(responseBody.email).toBe("current-session@example.com");
      expect(responseBody.password).toBeUndefined();
    });
  });

  describe("Anonymous user", () => {
    test("Without a session cookie", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sessions`,
      );

      expect(response.status).toBe(401);
    });
  });
});
