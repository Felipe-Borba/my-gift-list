import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "unique@example.com",
            password: "senha-correta",
          }),
        },
      );

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody.email).toBe("unique@example.com");
      expect(responseBody.id).toBeDefined();
      expect(responseBody.password).toBeUndefined();
    });

    test("With duplicated 'email'", async () => {
      await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "duplicated@example.com",
          password: "senha-correta",
        }),
      });

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "duplicated@example.com",
            password: "outra-senha",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ValidationError");
    });

    test("With an invalid 'email'", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "not-an-email",
            password: "senha-correta",
          }),
        },
      );

      expect(response.status).toBe(400);
    });

    test("With a missing 'password'", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "missing-password@example.com" }),
        },
      );

      expect(response.status).toBe(400);
    });
  });
});
