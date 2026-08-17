import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function postUser(sessionObject, body) {
  return await fetch(`${orchestrator.webserverUrl}/api/v1/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionObject ? orchestrator.cookieHeaderFor(sessionObject) : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/users", () => {
  describe("Admin user", () => {
    test("With unique and valid data, for each role", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);

      for (const role of ["admin", "teacher", "student"]) {
        const response = await postUser(adminSession, {
          name: `Usuário ${role}`,
          username: `novo.${role}`,
          password: "senha-valida",
          role,
        });

        expect(response.status).toBe(201);

        const responseBody = await response.json();

        expect(responseBody).toEqual({
          id: responseBody.id,
          name: `Usuário ${role}`,
          username: `novo.${role}`,
          role,
          active: true,
          created_at: responseBody.created_at,
          updated_at: responseBody.updated_at,
        });
      }
    });

    test("With duplicated 'username'", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);
      const existingUser = await orchestrator.createUser();

      const response = await postUser(adminSession, {
        name: "Duplicado",
        username: existingUser.username,
        password: "senha-valida",
        role: "student",
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        name: "ValidationError",
        message: "O nome de usuário informado já está em uso.",
        action: "Utilize outro nome de usuário.",
        status_code: 400,
      });
    });

    test("With missing required fields", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);

      const response = await postUser(adminSession, {
        username: "sem.nome",
        password: "senha-valida",
        role: "student",
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.name).toBe("ValidationError");
    });

    test("With invalid role", async () => {
      const admin = await orchestrator.createUser({ role: "admin" });
      const adminSession = await orchestrator.createSession(admin.id);

      const response = await postUser(adminSession, {
        name: "Perfil Inválido",
        username: "perfil.invalido",
        password: "senha-valida",
        role: "gerente",
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        name: "ValidationError",
        message: "O perfil informado é inválido.",
        action: "Utilize um dos perfis válidos: admin, teacher, student.",
        status_code: 400,
      });
    });
  });

  describe("Teacher user", () => {
    test("Creating a student", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);

      const response = await postUser(teacherSession, {
        name: "Aluno do Professor",
        username: "aluno.professor",
        password: "senha-valida",
        role: "student",
      });

      expect(response.status).toBe(201);
    });

    test("Creating a teacher is forbidden", async () => {
      const teacher = await orchestrator.createUser({ role: "teacher" });
      const teacherSession = await orchestrator.createSession(teacher.id);

      const response = await postUser(teacherSession, {
        name: "Outro Professor",
        username: "outro.professor",
        password: "senha-valida",
        role: "teacher",
      });

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para criar usuários com este perfil.",
        action: "Professores só podem cadastrar alunos.",
        status_code: 403,
      });
    });
  });

  describe("Student user", () => {
    test("Creating any user is forbidden", async () => {
      const student = await orchestrator.createUser({ role: "student" });
      const studentSession = await orchestrator.createSession(student.id);

      const response = await postUser(studentSession, {
        name: "Não Deveria",
        username: "nao.deveria",
        password: "senha-valida",
        role: "student",
      });

      expect(response.status).toBe(403);
    });
  });

  describe("Anonymous user", () => {
    test("Without session", async () => {
      const response = await postUser(null, {
        name: "Anônimo",
        username: "anonimo",
        password: "senha-valida",
        role: "student",
      });

      expect(response.status).toBe(401);
    });
  });
});
