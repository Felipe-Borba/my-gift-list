import controller from "infra/controller.js";
import billing from "models/billing.js";

async function postHandler(request, response) {
  const authenticatedUser = await controller.getAuthenticatedUser(request);

  const checkoutSession = await billing.createCheckoutSession({
    userId: authenticatedUser.id,
    userEmail: authenticatedUser.email,
  });

  response.status(200).json({ checkout_url: checkoutSession.url });
}

export default controller.router({ POST: postHandler });
