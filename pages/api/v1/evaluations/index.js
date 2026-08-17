import controller from "infra/controller.js";
import { ForbiddenError } from "infra/errors.js";
import authorization from "models/authorization.js";
import evaluation from "models/evaluation.js";
import user from "models/user.js";

async function getHandler(request, response) {
  const actor = await controller.getAuthenticatedUser(request);
  const filters = await resolveFilters(request.query, actor);

  const evaluations = await evaluation.findAll(filters);

  response.status(200).json(evaluations);
}

async function resolveFilters(query, actor) {
  const filters = {};

  if (query.student) {
    const student = await user.findOneByUsername(query.student);
    filters.studentId = student.id;
  }

  if (query.evaluator) {
    const evaluator = await user.findOneByUsername(query.evaluator);
    filters.evaluatorId = evaluator.id;
  }

  if (actor.role === "student") {
    if (filters.studentId && filters.studentId !== actor.id) {
      throw new ForbiddenError({
        message: "Alunos só podem consultar as próprias avaliações.",
        action: "Remova o filtro de aluno ou filtre por você mesmo.",
      });
    }
    filters.studentId = actor.id;
  }

  if (actor.role === "teacher") {
    filters.visibleToTeacherId = actor.id;
  }

  return filters;
}

async function postHandler(request, response) {
  const actor = await controller.getAuthenticatedUser(request);

  if (!authorization.canCreateEvaluation(actor)) {
    throw new ForbiddenError({
      message: "Você não tem permissão para registrar avaliações.",
      action: "Apenas administradores e professores registram avaliações.",
    });
  }

  const {
    student_username: studentUsername,
    height,
    weight,
  } = request.body ?? {};

  const createdEvaluation = await evaluation.create({
    studentUsername,
    evaluatorId: actor.id,
    height,
    weight,
  });

  response.status(201).json(createdEvaluation);
}

export default controller.router({
  GET: getHandler,
  POST: postHandler,
});
