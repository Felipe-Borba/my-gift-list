import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With correct credentials", async () => {
      await orchestrator.createUser({
        email: "session-user@example.com",
        password: "senha-correta",
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sessions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "session-user@example.com",
            password: "senha-correta",
          }),
        },
      );

      expect(response.status).toBe(201);
      expect(response.headers.get("set-cookie")).toContain("session_id=");
    });

    test("With incorrect password", async () => {
      await orchestrator.createUser({
        email: "wrong-password@example.com",
        password: "senha-correta",
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sessions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "wrong-password@example.com",
            password: "senha-errada",
          }),
        },
      );

      expect(response.status).toBe(401);
    });

    test("With an email that doesn't exist", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sessions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "does-not-exist@example.com",
            password: "qualquer-senha",
          }),
        },
      );

      expect(response.status).toBe(401);
    });
  });
});
