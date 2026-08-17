import evaluation from "models/evaluation.js";
import orchestrator from "tests/orchestrator.js";

let teacher1;
let teacher2;
let student1;
let student2;

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();

  teacher1 = await orchestrator.createUser({ role: "teacher" });
  teacher2 = await orchestrator.createUser({ role: "teacher" });
  student1 = await orchestrator.createUser({ role: "student" });
  student2 = await orchestrator.createUser({ role: "student" });

  await evaluation.create({
    studentUsername: student1.username,
    evaluatorId: teacher1.id,
    height: 1.7,
    weight: 80,
  });
  await evaluation.create({
    studentUsername: student2.username,
    evaluatorId: teacher2.id,
    height: 1.6,
    weight: 55,
  });
});

async function getEvaluations(sessionObject, queryString = "") {
  return await fetch(
    `${orchestrator.webserverUrl}/api/v1/evaluations${queryString}`,
    {
      headers: sessionObject ? orchestrator.cookieHeaderFor(sessionObject) : {},
    },
  );
}

describe("GET /api/v1/evaluations", () => {
  describe("Admin user", () => {
    test("Listing all evaluations", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);

      const response = await getEvaluations(adminSession);

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.length).toBe(2);
    });

    test("Filtering by student", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);

      const response = await getEvaluations(
        adminSession,
        `?student=${student1.username}`,
      );

      const responseBody = await response.json();

      expect(responseBody.length).toBe(1);
      expect(responseBody[0].student_username).toBe(student1.username);
    });

    test("Filtering by evaluator", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);

      const response = await getEvaluations(
        adminSession,
        `?evaluator=${teacher2.username}`,
      );

      const responseBody = await response.json();

      expect(responseBody.length).toBe(1);
      expect(responseBody[0].evaluator_username).toBe(teacher2.username);
    });
  });

  describe("Teacher user", () => {
    test("Listing returns only evaluations of own students", async () => {
      const teacher1Session = await orchestrator.createSession(teacher1.id);

      const response = await getEvaluations(teacher1Session);

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.length).toBe(1);
      expect(responseBody[0].student_username).toBe(student1.username);
    });
  });

  describe("Student user", () => {
    test("Listing returns only own evaluations, even without filters", async () => {
      const student1Session = await orchestrator.createSession(student1.id);

      const response = await getEvaluations(student1Session);

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.length).toBe(1);
      expect(responseBody[0].student_username).toBe(student1.username);
    });

    test("Filtering by another student is forbidden", async () => {
      const student1Session = await orchestrator.createSession(student1.id);

      const response = await getEvaluations(
        student1Session,
        `?student=${student2.username}`,
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Anonymous user", () => {
    test("Without session", async () => {
      const response = await getEvaluations(null);

      expect(response.status).toBe(401);
    });
  });
});
