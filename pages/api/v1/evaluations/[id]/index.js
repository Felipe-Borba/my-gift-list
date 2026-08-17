import controller from "infra/controller.js";
import { ForbiddenError } from "infra/errors.js";
import authorization from "models/authorization.js";
import evaluation from "models/evaluation.js";

async function getHandler(request, response) {
  const actor = await controller.getAuthenticatedUser(request);
  const foundEvaluation = await evaluation.findOneById(request.query.id);

  await ensureCanReadEvaluation(actor, foundEvaluation);

  response.status(200).json(foundEvaluation);
}

async function ensureCanReadEvaluation(actor, foundEvaluation) {
  if (actor.role === "admin") {
    return;
  }

  if (actor.role === "student") {
    if (foundEvaluation.student_id !== actor.id) {
      throw new ForbiddenError({
        message: "Alunos só podem consultar as próprias avaliações.",
        action: "Verifique a avaliação consultada.",
      });
    }
    return;
  }

  const isMyStudent = await evaluation.isStudentOfTeacher(
    foundEvaluation.student_id,
    actor.id,
  );

  if (!isMyStudent) {
    throw new ForbiddenError({
      message: "Você só pode consultar avaliações dos seus alunos.",
      action: "Verifique a avaliação consultada.",
    });
  }
}

async function patchHandler(request, response) {
  const actor = await controller.getAuthenticatedUser(request);
  const currentEvaluation = await evaluation.findOneById(request.query.id);

  if (!authorization.canUpdateEvaluation(actor, currentEvaluation)) {
    throw new ForbiddenError({
      message: "Você não tem permissão para editar esta avaliação.",
      action: "Professores só editam avaliações registradas por eles.",
    });
  }

  const { height, weight } = request.body ?? {};
  const updatedEvaluation = await evaluation.update(currentEvaluation.id, {
    height,
    weight,
  });

  response.status(200).json(updatedEvaluation);
}

async function deleteHandler(request, response) {
  const actor = await controller.getAuthenticatedUser(request);

  if (!authorization.canDeleteEvaluation(actor)) {
    throw new ForbiddenError({
      message: "Você não tem permissão para excluir avaliações.",
      action: "Apenas administradores excluem avaliações.",
    });
  }

  const deletedEvaluation = await evaluation.remove(request.query.id);

  response.status(200).json(deletedEvaluation);
}

export default controller.router({
  GET: getHandler,
  PATCH: patchHandler,
  DELETE: deleteHandler,
});
