import evaluation from "models/evaluation.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function patchEvaluation(sessionObject, id, body) {
  return await fetch(`${orchestrator.webserverUrl}/api/v1/evaluations/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(sessionObject ? orchestrator.cookieHeaderFor(sessionObject) : {}),
    },
    body: JSON.stringify(body),
  });
}

async function createEvaluationFor(teacher) {
  const student = await orchestrator.createUser({ role: "student" });
  return await evaluation.create({
    studentUsername: student.username,
    evaluatorId: teacher.id,
    height: 1.7,
    weight: 80,
  });
}

describe("PATCH /api/v1/evaluations/[id]", () => {
  describe("Teacher user", () => {
    test("Editing own evaluation recomputes BMI and classification", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);
      const createdEvaluation = await createEvaluationFor(teacher);

      const response = await patchEvaluation(
        teacherSession,
        createdEvaluation.id,
        { weight: 95 },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.height).toBe(1.7);
      expect(responseBody.weight).toBe(95);
      expect(responseBody.bmi).toBe(32.87);
      expect(responseBody.classification).toBe("Obesidade grau I");
    });

    test("Editing another teacher's evaluation is forbidden", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const otherTeacher = await orchestrator.createUser({ role: "teacher" });
      const otherTeacherSession = await orchestrator.createSession(
        otherTeacher.id,
      );
      const createdEvaluation = await createEvaluationFor(teacher);

      const response = await patchEvaluation(
        otherTeacherSession,
        createdEvaluation.id,
        { weight: 90 },
      );

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para editar esta avaliação.",
        action: "Professores só editam avaliações registradas por eles.",
        status_code: 403,
      });
    });
  });

  describe("Admin user", () => {
    test("Editing any evaluation", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const createdEvaluation = await createEvaluationFor(teacher);

      const response = await patchEvaluation(
        adminSession,
        createdEvaluation.id,
        { height: 1.75 },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.height).toBe(1.75);
      expect(responseBody.bmi).toBe(26.12);
    });
  });

  describe("Student user", () => {
    test("Editing any evaluation is forbidden", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const student = await orchestrator.createUser({ role: "student" });
      const studentSession = await orchestrator.createSession(student.id);
      const createdEvaluation = await createEvaluationFor(teacher);

      const response = await patchEvaluation(
        studentSession,
        createdEvaluation.id,
        { weight: 70 },
      );

      expect(response.status).toBe(403);
    });
  });
});
