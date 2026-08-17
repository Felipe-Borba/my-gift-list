import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function patchUser(sessionObject, username, body) {
  return await fetch(`${orchestrator.webserverUrl}/api/v1/users/${username}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(sessionObject ? orchestrator.cookieHeaderFor(sessionObject) : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/v1/users/[username]", () => {
  describe("Admin user", () => {
    test("Editing name and inactivating a user", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const target = await orchestrator.createUser({ role: "student" });

      const response = await patchUser(adminSession, target.username, {
        name: "Nome Atualizado",
        active: false,
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: target.id,
        name: "Nome Atualizado",
        username: target.username,
        role: "student",
        active: false,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(responseBody.updated_at).not.toBe(target.updated_at);
    });

    test("Inactivated user can no longer log in", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const target = await orchestrator.createUser({
        password: "senha-correta",
      });

      await patchUser(adminSession, target.username, { active: false });

      const loginResponse = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sessions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: target.username,
            password: "senha-correta",
          }),
        },
      );

      expect(loginResponse.status).toBe(401);
    });

    test("Changing password updates authentication", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const target = await orchestrator.createUser({
        password: "senha-antiga",
      });

      await patchUser(adminSession, target.username, {
        password: "senha-nova",
      });

      const oldPasswordLogin = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sessions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: target.username,
            password: "senha-antiga",
          }),
        },
      );
      expect(oldPasswordLogin.status).toBe(401);

      const newPasswordLogin = await fetch(
        `${orchestrator.webserverUrl}/api/v1/sessions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: target.username,
            password: "senha-nova",
          }),
        },
      );
      expect(newPasswordLogin.status).toBe(201);
    });

    test("With duplicated new 'username'", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const target = await orchestrator.createUser();
      const otherUser = await orchestrator.createUser();

      const response = await patchUser(adminSession, target.username, {
        username: otherUser.username,
      });

      expect(response.status).toBe(400);
    });
  });

  describe("Teacher user", () => {
    test("Editing a student", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);
      const student = await orchestrator.createUser({ role: "student" });

      const response = await patchUser(teacherSession, student.username, {
        name: "Aluno Editado",
      });

      expect(response.status).toBe(200);
    });

    test("Editing another teacher is forbidden", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);
      const otherTeacher = await orchestrator.createUser({ role: "teacher" });

      const response = await patchUser(teacherSession, otherTeacher.username, {
        name: "Não Deveria",
      });

      expect(response.status).toBe(403);
    });

    test("Promoting a student to teacher is forbidden", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);
      const student = await orchestrator.createUser({ role: "student" });

      const response = await patchUser(teacherSession, student.username, {
        role: "teacher",
      });

      expect(response.status).toBe(403);
    });
  });

  describe("Student user", () => {
    test("Editing anyone is forbidden", async () => {
      const student = await orchestrator.createUser({ role: "student" });
      const studentSession = await orchestrator.createSession(student.id);

      const response = await patchUser(studentSession, student.username, {
        name: "Não Deveria",
      });

      expect(response.status).toBe(403);
    });
  });
});
