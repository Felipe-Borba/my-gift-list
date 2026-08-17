import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function getUser(sessionObject, username) {
  return await fetch(`${orchestrator.webserverUrl}/api/v1/users/${username}`, {
    headers: sessionObject ? orchestrator.cookieHeaderFor(sessionObject) : {},
  });
}

describe("GET /api/v1/users/[username]", () => {
  describe("Admin user", () => {
    test("Retrieving any user", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const teacher = await orchestrator.createUser({ role: "teacher" });

      const response = await getUser(adminSession, teacher.username);

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: teacher.id,
        name: teacher.name,
        username: teacher.username,
        role: "teacher",
        active: true,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
    });

    test("Retrieving an unknown user", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);

      const response = await getUser(adminSession, "nao.existe");

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        name: "NotFoundError",
        message: "O usuário informado não foi encontrado no sistema.",
        action: "Verifique se o usuário está digitado corretamente.",
        status_code: 404,
      });
    });
  });

  describe("Teacher user", () => {
    test("Retrieving a student", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);
      const student = await orchestrator.createUser({ role: "student" });

      const response = await getUser(teacherSession, student.username);

      expect(response.status).toBe(200);
    });

    test("Retrieving another teacher is forbidden", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);
      const otherTeacher = await orchestrator.createUser({ role: "teacher" });

      const response = await getUser(teacherSession, otherTeacher.username);

      expect(response.status).toBe(403);
    });
  });

  describe("Student user", () => {
    test("Retrieving own profile", async () => {
      const student = await orchestrator.createUser({ role: "student" });
      const studentSession = await orchestrator.createSession(student.id);

      const response = await getUser(studentSession, student.username);

      expect(response.status).toBe(200);
    });

    test("Retrieving another user is forbidden", async () => {
      const student = await orchestrator.createUser({ role: "student" });
      const studentSession = await orchestrator.createSession(student.id);
      const otherStudent = await orchestrator.createUser({ role: "student" });

      const response = await getUser(studentSession, otherStudent.username);

      expect(response.status).toBe(403);
    });
  });
});
