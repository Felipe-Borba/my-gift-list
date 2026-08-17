import controller from "infra/controller.js";
import { ForbiddenError } from "infra/errors.js";
import authorization from "models/authorization.js";
import user from "models/user.js";

async function getHandler(request, response) {
  const actor = await controller.getAuthenticatedUser(request);
  const targetUser = await user.findOneByUsername(request.query.username);

  if (!authorization.canReadUser(actor, targetUser)) {
    throw new ForbiddenError();
  }

  response.status(200).json(user.toPublic(targetUser));
}

async function patchHandler(request, response) {
  const actor = await controller.getAuthenticatedUser(request);
  const targetUser = await user.findOneByUsername(request.query.username);
  const { name, username, password, role, active } = request.body ?? {};

  const canEditTarget = authorization.canManageUser(actor, targetUser.role);
  const canAssignRole =
    role === undefined || authorization.canManageUser(actor, role);

  if (!canEditTarget || !canAssignRole) {
    throw new ForbiddenError({
      message: "Você não tem permissão para editar este usuário.",
      action: "Professores só podem editar alunos.",
    });
  }

  const updatedUser = await user.update(targetUser.username, {
    name,
    username,
    password,
    role,
    active,
  });

  response.status(200).json(updatedUser);
}

async function deleteHandler(request, response) {
  const actor = await controller.getAuthenticatedUser(request);

  if (!authorization.canDeleteUser(actor)) {
    throw new ForbiddenError({
      message: "Você não tem permissão para excluir usuários.",
      action: "Apenas administradores excluem usuários.",
    });
  }

  const deletedUser = await user.remove(request.query.username);

  response.status(200).json(deletedUser);
}

export default controller.router({
  GET: getHandler,
  PATCH: patchHandler,
  DELETE: deleteHandler,
});
