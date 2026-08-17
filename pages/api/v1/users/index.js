import controller from "infra/controller.js";
import { ValidationError } from "infra/errors.js";
import user from "models/user.js";

async function postHandler(request, response) {
  const { email, password } = request.body ?? {};

  if (!password) {
    throw new ValidationError({
      message: 'O campo "password" é obrigatório.',
      action: "Preencha o campo e tente novamente.",
    });
  }

  const createdUser = await user.create({ email, password });

  response.status(201).json(createdUser);
}

export default controller.router({ POST: postHandler });
