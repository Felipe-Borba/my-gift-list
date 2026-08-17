import http from "node:http";

import orchestrator from "tests/orchestrator.js";

const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

let fixtureServer;
let fixtureUrl;

beforeAll(async () => {
  await orchestrator.waitForAllServices();

  fixtureServer = http.createServer((request, response) => {
    if (request.url === "/photo.png") {
      response.writeHead(200, { "Content-Type": "image/png" });
      response.end(PIXEL_PNG);
      return;
    }

    response.writeHead(200, { "Content-Type": "text/html" });
    response.end("<html></html>");
  });

  await new Promise((resolve) => fixtureServer.listen(0, resolve));
  const { port } = fixtureServer.address();
  fixtureUrl = `http://localhost:${port}/photo.png`;
});

afterAll(async () => {
  await new Promise((resolve) => fixtureServer.close(resolve));
});

describe("GET /api/v1/link-previews/image", () => {
  describe("Anonymous user", () => {
    test("With a URL that resolves to an image", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/link-previews/image?url=${encodeURIComponent(fixtureUrl)}`,
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/png");
      expect(response.headers.get("cache-control")).toContain("max-age");

      const responseBody = Buffer.from(await response.arrayBuffer());
      expect(responseBody.equals(PIXEL_PNG)).toBe(true);
    });

    test("With a URL that does not resolve to an image", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/link-previews/image?url=${encodeURIComponent(`http://localhost:${fixtureServer.address().port}/not-an-image`)}`,
      );

      expect(response.status).toBe(503);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("InternalServerError");
    });

    test("With a missing 'url' query param", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/link-previews/image`,
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ValidationError");
    });

    test("With an invalid URL", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/link-previews/image?url=not-a-url`,
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ValidationError");
    });
  });
});
