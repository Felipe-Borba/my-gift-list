import Stripe from "stripe";

import database from "infra/database.js";
import { ValidationError } from "infra/errors.js";

let stripeClient;

function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

async function createCheckoutSession({ userId, userEmail }) {
  const stripe = getStripeClient();

  return await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: userEmail,
    line_items: [
      { price: process.env.STRIPE_HOSTING_FEE_PRICE_ID, quantity: 1 },
    ],
    success_url: `${process.env.APP_BASE_URL}/share?checkout=success`,
    cancel_url: `${process.env.APP_BASE_URL}/share?checkout=canceled`,
    client_reference_id: userId,
  });
}

function constructWebhookEvent(rawBody, signatureHeader) {
  const stripe = getStripeClient();

  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    throw new ValidationError({
      cause: error,
      message: "Assinatura do webhook do Stripe inválida.",
      action: "Verifique a configuração do endpoint de webhook no Stripe.",
    });
  }
}

async function upsertFromSubscription({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
  status,
  currentPeriodEnd,
}) {
  const results = await database.query({
    text: `
      INSERT INTO hosting_subscriptions
        (user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        status = EXCLUDED.status,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = now()
      RETURNING *;
    `,
    values: [
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      status,
      currentPeriodEnd,
    ],
  });

  return results.rows[0];
}

async function findActiveByUserId(userId) {
  const results = await database.query({
    text: `
      SELECT * FROM hosting_subscriptions
      WHERE user_id = $1 AND status = 'active'
      LIMIT 1;
    `,
    values: [userId],
  });

  return results.rows[0] || null;
}

async function findByStripeSubscriptionId(stripeSubscriptionId) {
  const results = await database.query({
    text: `
      SELECT * FROM hosting_subscriptions
      WHERE stripe_subscription_id = $1
      LIMIT 1;
    `,
    values: [stripeSubscriptionId],
  });

  return results.rows[0] || null;
}

const billing = {
  createCheckoutSession,
  constructWebhookEvent,
  upsertFromSubscription,
  findActiveByUserId,
  findByStripeSubscriptionId,
};

export default billing;
