import http from "node:http";

import orchestrator from "tests/orchestrator.js";

let fixtureServer;
let fixtureUrl;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();

  fixtureServer = http.createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(`<!doctype html>
      <html>
        <head>
          <meta property="og:title" content="Fone de Ouvido Sem Fio" />
          <meta property="og:image" content="https://example.com/photo.jpg" />
          <meta property="product:price:amount" content="299.90" />
        </head>
        <body></body>
      </html>`);
  });

  await new Promise((resolve) => fixtureServer.listen(0, resolve));
  const { port } = fixtureServer.address();
  fixtureUrl = `http://localhost:${port}/product/123`;
});

afterAll(async () => {
  await new Promise((resolve) => fixtureServer.close(resolve));
});

describe("POST /api/v1/link-previews", () => {
  describe("Anonymous user", () => {
    test("With a URL that resolves Open Graph metadata", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/link-previews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: fixtureUrl }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        title: "Fone de Ouvido Sem Fio",
        image_url: "https://example.com/photo.jpg",
        price_cents: 29990,
        resolved: true,
      });
    });

    test("With a URL that cannot be reached", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/link-previews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: "http://localhost:1/unreachable" }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        title: null,
        image_url: null,
        price_cents: null,
        resolved: false,
      });
    });

    test("With a missing 'url' field", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/link-previews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ValidationError");
    });
  });
});
