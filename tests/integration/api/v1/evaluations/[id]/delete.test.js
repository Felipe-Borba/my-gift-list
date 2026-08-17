import evaluation from "models/evaluation.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function deleteEvaluation(sessionObject, id) {
  return await fetch(`${orchestrator.webserverUrl}/api/v1/evaluations/${id}`, {
    method: "DELETE",
    headers: sessionObject ? orchestrator.cookieHeaderFor(sessionObject) : {},
  });
}

describe("DELETE /api/v1/evaluations/[id]", () => {
  describe("Admin user", () => {
    test("Deleting an evaluation", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const student = await orchestrator.createUser({ role: "student" });

      const createdEvaluation = await evaluation.create({
        studentUsername: student.username,
        evaluatorId: teacher.id,
        height: 1.7,
        weight: 80,
      });

      const response = await deleteEvaluation(
        adminSession,
        createdEvaluation.id,
      );

      expect(response.status).toBe(200);

      const getResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/evaluations/${createdEvaluation.id}`,
        { headers: orchestrator.cookieHeaderFor(adminSession) },
      );
      expect(getResponse.status).toBe(404);
    });
  });

  describe("Teacher user", () => {
    test("Deleting evaluations is forbidden, even own ones", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);
      const student = await orchestrator.createUser({ role: "student" });

      const createdEvaluation = await evaluation.create({
        studentUsername: student.username,
        evaluatorId: teacher.id,
        height: 1.7,
        weight: 80,
      });

      const response = await deleteEvaluation(
        teacherSession,
        createdEvaluation.id,
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Anonymous user", () => {
    test("Without session", async () => {
      const response = await deleteEvaluation(null, "qualquer-id");

      expect(response.status).toBe(401);
    });
  });
});
