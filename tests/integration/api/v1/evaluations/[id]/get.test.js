import evaluation from "models/evaluation.js";
import orchestrator from "tests/orchestrator.js";

let teacher1;
let teacher2;
let student1;
let evaluation1;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();

  teacher1 = await orchestrator.createUser({ role: "teacher" });
  teacher2 = await orchestrator.createUser({ role: "teacher" });
  student1 = await orchestrator.createUser({ role: "student" });

  evaluation1 = await evaluation.create({
    studentUsername: student1.username,
    evaluatorId: teacher1.id,
    height: 1.7,
    weight: 80,
  });
});

async function getEvaluation(sessionObject, id) {
  return await fetch(`${orchestrator.webserverUrl}/api/v1/evaluations/${id}`, {
    headers: sessionObject ? orchestrator.cookieHeaderFor(sessionObject) : {},
  });
}

describe("GET /api/v1/evaluations/[id]", () => {
  describe("Admin user", () => {
    test("Retrieving any evaluation", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);

      const response = await getEvaluation(adminSession, evaluation1.id);

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.id).toBe(evaluation1.id);
      expect(responseBody.bmi).toBe(27.68);
    });

    test("Retrieving an unknown evaluation", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);

      const response = await getEvaluation(adminSession, "id-invalido");

      expect(response.status).toBe(404);
    });
  });

  describe("Teacher user", () => {
    test("Retrieving an evaluation of an own student", async () => {
      const teacher1Session = await orchestrator.createSession(teacher1.id);

      const response = await getEvaluation(teacher1Session, evaluation1.id);

      expect(response.status).toBe(200);
    });

    test("Retrieving an evaluation of another teacher's student is forbidden", async () => {
      const teacher2Session = await orchestrator.createSession(teacher2.id);

      const response = await getEvaluation(teacher2Session, evaluation1.id);

      expect(response.status).toBe(403);
    });
  });

  describe("Student user", () => {
    test("Retrieving own evaluation", async () => {
      const student1Session = await orchestrator.createSession(student1.id);

      const response = await getEvaluation(student1Session, evaluation1.id);

      expect(response.status).toBe(200);
    });

    test("Retrieving another student's evaluation is forbidden", async () => {
      const otherStudent = await orchestrator.createUser({ role: "student" });
      const otherStudentSession = await orchestrator.createSession(
        otherStudent.id,
      );

      const response = await getEvaluation(otherStudentSession, evaluation1.id);

      expect(response.status).toBe(403);
    });
  });
});
