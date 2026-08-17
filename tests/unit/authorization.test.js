import authorization from "models/authorization.js";

const admin = { id: "admin-id", role: "admin" };
const teacher = { id: "teacher-id", role: "teacher" };
const student = { id: "student-id", role: "student" };
const otherStudent = { id: "other-student-id", role: "student" };

describe("authorization model", () => {
  describe("canManageUser()", () => {
    test("Admin manages any role", () => {
      expect(authorization.canManageUser(admin, "admin")).toBe(true);
      expect(authorization.canManageUser(admin, "teacher")).toBe(true);
      expect(authorization.canManageUser(admin, "student")).toBe(true);
    });

    test("Teacher manages students only", () => {
      expect(authorization.canManageUser(teacher, "student")).toBe(true);
      expect(authorization.canManageUser(teacher, "teacher")).toBe(false);
      expect(authorization.canManageUser(teacher, "admin")).toBe(false);
    });

    test("Student manages no one", () => {
      expect(authorization.canManageUser(student, "student")).toBe(false);
    });
  });

  describe("canDeleteUser() and canDeleteEvaluation()", () => {
    test("Only admin deletes", () => {
      expect(authorization.canDeleteUser(admin)).toBe(true);
      expect(authorization.canDeleteUser(teacher)).toBe(false);
      expect(authorization.canDeleteUser(student)).toBe(false);
      expect(authorization.canDeleteEvaluation(admin)).toBe(true);
      expect(authorization.canDeleteEvaluation(teacher)).toBe(false);
      expect(authorization.canDeleteEvaluation(student)).toBe(false);
    });
  });

  describe("canListUsers()", () => {
    test("Admin and teacher list, student does not", () => {
      expect(authorization.canListUsers(admin)).toBe(true);
      expect(authorization.canListUsers(teacher)).toBe(true);
      expect(authorization.canListUsers(student)).toBe(false);
    });
  });

  describe("canReadUser()", () => {
    test("Everyone reads themselves", () => {
      expect(authorization.canReadUser(student, student)).toBe(true);
      expect(authorization.canReadUser(teacher, teacher)).toBe(true);
    });

    test("Admin reads anyone; teacher reads students; student reads only self", () => {
      expect(authorization.canReadUser(admin, teacher)).toBe(true);
      expect(authorization.canReadUser(teacher, student)).toBe(true);
      expect(authorization.canReadUser(teacher, admin)).toBe(false);
      expect(authorization.canReadUser(student, otherStudent)).toBe(false);
    });
  });

  describe("canCreateEvaluation() and canUpdateEvaluation()", () => {
    test("Admin and teacher create, student does not", () => {
      expect(authorization.canCreateEvaluation(admin)).toBe(true);
      expect(authorization.canCreateEvaluation(teacher)).toBe(true);
      expect(authorization.canCreateEvaluation(student)).toBe(false);
    });

    test("Teacher updates only own evaluations; admin updates any", () => {
      const ownEvaluation = { evaluator_id: teacher.id };
      const otherEvaluation = { evaluator_id: "someone-else" };

      expect(authorization.canUpdateEvaluation(teacher, ownEvaluation)).toBe(
        true,
      );
      expect(authorization.canUpdateEvaluation(teacher, otherEvaluation)).toBe(
        false,
      );
      expect(authorization.canUpdateEvaluation(admin, otherEvaluation)).toBe(
        true,
      );
      expect(authorization.canUpdateEvaluation(student, ownEvaluation)).toBe(
        false,
      );
    });
  });
});
