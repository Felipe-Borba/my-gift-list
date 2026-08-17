import {
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  PaymentRequiredError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors.js";
import session from "models/session.js";
import user from "models/user.js";

function router(handlersByMethod) {
  return async function handler(request, response) {
    const methodHandler = handlersByMethod[request.method];

    if (!methodHandler) {
      return onNoMatchHandler(request, response);
    }

    try {
      await methodHandler(request, response);
    } catch (error) {
      onErrorHandler(error, request, response);
    }
  };
}

async function getAuthenticatedUser(request) {
  const sessionToken = request.cookies?.session_id;

  if (!sessionToken) {
    throw new UnauthorizedError();
  }

  const activeSession = await session.findOneValidByToken(sessionToken);
  return await user.findOneById(activeSession.user_id);
}

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  const isKnownError =
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof UnauthorizedError ||
    error instanceof ForbiddenError ||
    error instanceof PaymentRequiredError ||
    error instanceof TooManyRequestsError;

  if (isKnownError) {
    return response.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });

  console.error(publicErrorObject);

  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

const controller = {
  router,
  getAuthenticatedUser,
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};

export default controller;
