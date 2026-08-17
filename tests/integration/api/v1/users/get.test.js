import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function getUsers(sessionObject) {
  return await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
    headers: sessionObject ? orchestrator.cookieHeaderFor(sessionObject) : {},
  });
}

describe("GET /api/v1/users", () => {
  describe("Admin user", () => {
    test("Listing all users, without password field", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const student = await orchestrator.createUser({ role: "student" });

      const response = await getUsers(adminSession);

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const usernames = responseBody.map((row) => row.username);

      expect(usernames).toEqual(
        expect.arrayContaining([
          "admin",
          admin.username,
          teacher.username,
          student.username,
        ]),
      );

      for (const row of responseBody) {
        expect(row.password).toBeUndefined();
      }
    });
  });

  describe("Teacher user", () => {
    test("Listing returns students only", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);
      await orchestrator.createUser({ role: "student" });

      const response = await getUsers(teacherSession);

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.length).toBeGreaterThan(0);
      for (const row of responseBody) {
        expect(row.role).toBe("student");
      }
    });
  });

  describe("Student user", () => {
    test("Listing is forbidden", async () => {
      const student = await orchestrator.createUser({ role: "student" });
      const studentSession = await orchestrator.createSession(student.id);

      const response = await getUsers(studentSession);

      expect(response.status).toBe(403);
    });
  });

  describe("Anonymous user", () => {
    test("Without session", async () => {
      const response = await getUsers(null);

      expect(response.status).toBe(401);
    });
  });
});
