import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/status`,
      );
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.updated_at).toBeDefined();
      expect(
        Date.now() - new Date(responseBody.updated_at).getTime(),
      ).toBeLessThan(5000);

      expect(responseBody.dependencies.database.version).toBeDefined();
      expect(
        responseBody.dependencies.database.max_connections,
      ).toBeGreaterThan(0);
      expect(
        responseBody.dependencies.database.opened_connections,
      ).toBeGreaterThanOrEqual(1);
    });
  });
});
