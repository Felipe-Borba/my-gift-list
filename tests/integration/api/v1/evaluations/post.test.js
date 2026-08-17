import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function postEvaluation(sessionObject, body) {
  return await fetch(`${orchestrator.webserverUrl}/api/v1/evaluations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionObject ? orchestrator.cookieHeaderFor(sessionObject) : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/evaluations", () => {
  describe("Teacher user", () => {
    test("With valid measurements computes and stores BMI", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);
      const student = await orchestrator.createUser({ role: "student" });

      const response = await postEvaluation(teacherSession, {
        student_username: student.username,
        height: 1.7,
        weight: 80,
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        student_id: student.id,
        evaluator_id: teacher.id,
        height: 1.7,
        weight: 80,
        bmi: 27.68,
        classification: "Sobrepeso",
        student_username: student.username,
        student_name: student.name,
        evaluator_username: teacher.username,
        evaluator_name: teacher.name,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("For an inactive student is blocked", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);
      const inactiveStudent = await orchestrator.createUser({
        role: "student",
        active: false,
      });

      const response = await postEvaluation(teacherSession, {
        student_username: inactiveStudent.username,
        height: 1.7,
        weight: 80,
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        name: "ValidationError",
        message: "Não é possível registrar avaliação para um aluno inativo.",
        action: "Reative o aluno antes de registrar novas avaliações.",
        status_code: 400,
      });
    });

    test("For a non-student user is blocked", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);
      const otherTeacher = await orchestrator.createUser({ role: "teacher" });

      const response = await postEvaluation(teacherSession, {
        student_username: otherTeacher.username,
        height: 1.7,
        weight: 80,
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        name: "ValidationError",
        message: "O usuário informado não é um aluno.",
        action: "Avaliações só podem ser registradas para alunos.",
        status_code: 400,
      });
    });

    test("With invalid height", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);
      const student = await orchestrator.createUser({ role: "student" });

      const response = await postEvaluation(teacherSession, {
        student_username: student.username,
        height: 17,
        weight: 80,
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.message).toBe("A altura informada é inválida.");
    });
  });

  describe("Admin user", () => {
    test("Admin can also evaluate", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const student = await orchestrator.createUser({ role: "student" });

      const response = await postEvaluation(adminSession, {
        student_username: student.username,
        height: 1.8,
        weight: 59.9,
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();
      expect(responseBody.bmi).toBe(18.49);
      expect(responseBody.classification).toBe("Abaixo do peso");
    });
  });

  describe("Student user", () => {
    test("Creating evaluations is forbidden", async () => {
      const student = await orchestrator.createUser({ role: "student" });
      const studentSession = await orchestrator.createSession(student.id);

      const response = await postEvaluation(studentSession, {
        student_username: student.username,
        height: 1.7,
        weight: 80,
      });

      expect(response.status).toBe(403);
    });
  });

  describe("Anonymous user", () => {
    test("Without session", async () => {
      const response = await postEvaluation(null, {
        student_username: "qualquer",
        height: 1.7,
        weight: 80,
      });

      expect(response.status).toBe(401);
    });
  });
});
