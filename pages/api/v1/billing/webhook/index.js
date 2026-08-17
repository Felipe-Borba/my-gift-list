import database from "infra/database.js";
import { MethodNotAllowedError, ValidationError } from "infra/errors.js";
import billing from "models/billing.js";

export const config = {
  api: { bodyParser: false },
};

const RELEVANT_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

async function readRawBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function mapStripeStatus(stripeStatus) {
  if (stripeStatus === "active" || stripeStatus === "trialing") {
    return "active";
  }
  if (stripeStatus === "past_due" || stripeStatus === "unpaid") {
    return "past_due";
  }
  return "canceled";
}

async function handleSubscriptionEvent(subscription) {
  const status = mapStripeStatus(subscription.status);
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;

  const hostingSubscription = await billing.upsertFromSubscription({
    userId: subscription.client_reference_id || subscription.metadata?.userId,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    status,
    currentPeriodEnd,
  });

  if (status !== "active" && hostingSubscription?.user_id) {
    await database.query({
      text: `
        UPDATE gift_lists
        SET status = 'unshared', updated_at = now()
        WHERE owner_user_id = $1 AND status = 'active';
      `,
      values: [hostingSubscription.user_id],
    });
  }
}

async function postHandler(request, response) {
  const rawBody = await readRawBody(request);
  const signatureHeader = request.headers["stripe-signature"];

  const event = billing.constructWebhookEvent(rawBody, signatureHeader);

  if (RELEVANT_EVENTS.has(event.type)) {
    await handleSubscriptionEvent(event.data.object);
  }

  response.status(200).json({ received: true });
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    const error = new MethodNotAllowedError();
    return response.status(error.statusCode).json(error);
  }

  try {
    await postHandler(request, response);
  } catch (error) {
    if (error instanceof ValidationError) {
      return response.status(error.statusCode).json(error);
    }
    console.error(error);
    response.status(500).json({ received: false });
  }
}
