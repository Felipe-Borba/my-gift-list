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

async function postHandler(request, response) {
  const { username, password: providedPassword } = request.body ?? {};

  if (!username || !providedPassword) {
    throw new ValidationError({
      message: "Usuário e senha são obrigatórios.",
      action: "Preencha os dois campos e tente novamente.",
    });
  }

  const authenticatedUser = await authenticate(username, providedPassword);
  const newSession = await session.create(authenticatedUser.id);

  setSessionCookie(
    response,
    newSession.token,
    session.EXPIRATION_IN_MILLISECONDS,
  );

  response.status(201).json(newSession);
}

async function authenticate(username, providedPassword) {
  const credentialsError = new UnauthorizedError({
    message: "Dados de autenticação não conferem.",
    action: "Verifique usuário e senha e tente novamente.",
  });

  let storedUser;

  try {
    storedUser = await user.findOneByUsername(username);
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

  if (!storedUser.active) {
    throw new UnauthorizedError({
      message: "Usuário inativo.",
      action: "Entre em contato com a administração da academia.",
    });
  }

  return storedUser;
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies?.session_id;

  if (!sessionToken) {
    throw new UnauthorizedError();
  }

  const activeSession = await session.findOneValidByToken(sessionToken);
  const expiredSession = await session.expireByToken(activeSession.token);

  setSessionCookie(response, "", 0);

  response.status(200).json(expiredSession);
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

export default controller.router({
  POST: postHandler,
  DELETE: deleteHandler,
});
