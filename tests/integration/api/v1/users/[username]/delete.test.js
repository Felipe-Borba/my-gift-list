import evaluation from "models/evaluation.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function deleteUser(sessionObject, username) {
  return await fetch(`${orchestrator.webserverUrl}/api/v1/users/${username}`, {
    method: "DELETE",
    headers: sessionObject ? orchestrator.cookieHeaderFor(sessionObject) : {},
  });
}

describe("DELETE /api/v1/users/[username]", () => {
  describe("Admin user", () => {
    test("Deleting a user without evaluations", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const target = await orchestrator.createUser();

      const response = await deleteUser(adminSession, target.username);

      expect(response.status).toBe(200);

      const getResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/users/${target.username}`,
        { headers: orchestrator.cookieHeaderFor(adminSession) },
      );
      expect(getResponse.status).toBe(404);
    });

    test("Deleting a user with linked evaluations is blocked", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const student = await orchestrator.createUser({ role: "student" });

      await evaluation.create({
        studentUsername: student.username,
        evaluatorId: teacher.id,
        height: 1.7,
        weight: 80,
      });

      for (const username of [student.username, teacher.username]) {
        const response = await deleteUser(adminSession, username);

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
          name: "ValidationError",
          message:
            "Não é possível excluir um usuário com avaliações vinculadas.",
          action:
            "Exclua as avaliações do usuário antes, ou inative-o para bloquear o acesso.",
          status_code: 400,
        });
      }
    });
  });

  describe("Teacher user", () => {
    test("Deleting any user is forbidden", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);
      const student = await orchestrator.createUser({ role: "student" });

      const response = await deleteUser(teacherSession, student.username);

      expect(response.status).toBe(403);
    });
  });

  describe("Anonymous user", () => {
    test("Without session", async () => {
      const response = await deleteUser(null, "qualquer");

      expect(response.status).toBe(401);
    });
  });
});
