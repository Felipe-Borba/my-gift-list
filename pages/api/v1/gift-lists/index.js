import controller from "infra/controller.js";
import { PaymentRequiredError } from "infra/errors.js";
import authorization from "models/authorization.js";
import billing from "models/billing.js";
import giftList from "models/gift-list.js";

async function postHandler(request, response) {
  const authenticatedUser = await controller.getAuthenticatedUser(request);
  const { title, items } = request.body ?? {};

  if (
    !authorization.can(authenticatedUser, "create:gift-list:without-payment")
  ) {
    const activeSubscription = await billing.findActiveByUserId(
      authenticatedUser.id,
    );

    if (!activeSubscription) {
      throw new PaymentRequiredError({
        message:
          "É necessário ativar a assinatura de hospedagem para compartilhar uma lista.",
        action: "Conclua o pagamento da taxa de hospedagem e tente novamente.",
      });
    }
  }

  const list = await giftList.create({
    ownerUserId: authenticatedUser.id,
    title,
    items,
  });

  response.status(201).json({
    id: list.id,
    title: list.title,
    share_slug: list.share_slug,
    status: list.status,
    share_url: `${process.env.APP_BASE_URL}/l/${list.share_slug}`,
    created_at: list.created_at,
  });
}

export default controller.router({ POST: postHandler });
