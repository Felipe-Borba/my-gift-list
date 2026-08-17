import controller from "infra/controller.js";
import { ForbiddenError } from "infra/errors.js";
import authorization from "models/authorization.js";
import user from "models/user.js";

async function getHandler(request, response) {
  const actor = await controller.getAuthenticatedUser(request);

  if (!authorization.canListUsers(actor)) {
    throw new ForbiddenError();
  }

  const role = actor.role === "teacher" ? "student" : request.query.role;
  const users = await user.findAll({ role });

  response.status(200).json(users);
}

async function postHandler(request, response) {
  const actor = await controller.getAuthenticatedUser(request);
  const { name, username, password, role } = request.body ?? {};

  if (!authorization.canManageUser(actor, role)) {
    throw new ForbiddenError({
      message: "Você não tem permissão para criar usuários com este perfil.",
      action: "Professores só podem cadastrar alunos.",
    });
  }

  const createdUser = await user.create({ name, username, password, role });

  response.status(201).json(createdUser);
}

export default controller.router({
  GET: getHandler,
  POST: postHandler,
});
