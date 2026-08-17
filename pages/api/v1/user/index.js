import controller from "infra/controller.js";

async function getHandler(request, response) {
  const authenticatedUser = await controller.getAuthenticatedUser(request);
  response.status(200).json(authenticatedUser);
}

export default controller.router({ GET: getHandler });
