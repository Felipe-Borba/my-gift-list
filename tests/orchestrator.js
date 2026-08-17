import { resolve } from "node:path";

import { faker } from "@faker-js/faker";
import { runner as migrationRunner } from "node-pg-migrate";

import database from "infra/database.js";
import session from "models/session.js";
import user from "models/user.js";

const webserverUrl = "http://localhost:3000";

async function waitForAllServices() {
  await waitForWebServer();

  async function waitForWebServer() {
    const maxAttempts = 100;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`${webserverUrl}/api/v1/status`);

        if (response.status === 200) {
          return;
        }
      } catch {
        // servidor ainda não está de pé; tenta de novo
      }

      await new Promise((resolvePromise) => setTimeout(resolvePromise, 1000));
    }

    throw new Error("Web server não ficou disponível a tempo.");
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  const databaseClient = await database.getNewClient();

  try {
    await migrationRunner({
      dbClient: databaseClient,
      dryRun: false,
      dir: resolve("infra", "migrations"),
      direction: "up",
      log: () => {},
      migrationsTable: "pgmigrations",
    });
  } finally {
    await databaseClient.end();
  }
}

async function createUser({ email, password, features } = {}) {
  return await user.create({
    email: email || faker.internet.email().toLowerCase(),
    password: password || "senha-correta",
    features,
  });
}

async function createSession(userId) {
  return await session.create(userId);
}

function cookieHeaderFor(sessionObject) {
  return { Cookie: `session_id=${sessionObject.token}` };
}

const orchestrator = {
  webserverUrl,
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  cookieHeaderFor,
};

export default orchestrator;
