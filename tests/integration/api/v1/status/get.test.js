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

      expect(responseBody).toEqual({
        updated_at: responseBody.updated_at,
        dependencies: {
          database: {
            version: "17.4",
            max_connections: 100,
            opened_connections: 1,
          },
        },
      });

      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });
  });
});
