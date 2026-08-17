import { stringifySetCookie } from "cookie";

import controller from "infra/controller.js";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors.js";
import password from "models/password.js";
import session from "models/session.js";
import user from "models/user.js";

async function getHandler(request, response) {
  const authenticatedUser = await controller.getAuthenticatedUser(request);
  response.status(200).json(authenticatedUser);
}

async function postHandler(request, response) {
  const { email, password: providedPassword } = request.body ?? {};

  if (!email || !providedPassword) {
    throw new ValidationError({
      message: "E-mail e senha são obrigatórios.",
      action: "Preencha os dois campos e tente novamente.",
    });
  }

  const authenticatedUser = await authenticate(email, providedPassword);
  const newSession = await session.create(authenticatedUser.id);

  setSessionCookie(
    response,
    newSession.token,
    session.EXPIRATION_IN_MILLISECONDS,
  );

  response.status(201).json({ created_at: newSession.created_at });
}

async function authenticate(email, providedPassword) {
  const credentialsError = new UnauthorizedError({
    message: "Dados de autenticação não conferem.",
    action: "Verifique e-mail e senha e tente novamente.",
  });

  let storedUser;

  try {
    storedUser = await user.findOneByEmail(email);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw credentialsError;
    }
    throw error;
  }

  const correctPassword = await password.compare(
    providedPassword,
    storedUser.password,
  );

  if (!correctPassword) {
    throw credentialsError;
  }

  return storedUser;
}

function setSessionCookie(response, token, maxAgeInMilliseconds) {
  response.setHeader(
    "Set-Cookie",
    stringifySetCookie({
      name: "session_id",
      value: token,
      path: "/",
      maxAge: maxAgeInMilliseconds / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    }),
  );
}

export default controller.router({ GET: getHandler, POST: postHandler });
