import Stripe from "stripe";

import database from "infra/database.js";
import billing from "models/billing.js";
import orchestrator from "tests/orchestrator.js";

// Verificação de assinatura do Stripe é puramente local (HMAC com
// STRIPE_WEBHOOK_SECRET) — não depende de rede, então dá para testar de
// ponta a ponta sem credenciais reais do Stripe.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function signedRequestBody(eventPayload) {
  const payload = JSON.stringify(eventPayload);
  const header = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });
  return { payload, header };
}

function subscriptionEventPayload({ userId, status, subscriptionId }) {
  return {
    id: `evt_${subscriptionId}`,
    type: "customer.subscription.updated",
    data: {
      object: {
        id: subscriptionId,
        customer: "cus_test_123",
        status,
        client_reference_id: userId,
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
    },
  };
}

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/billing/webhook", () => {
  describe("Stripe", () => {
    test("With an invalid signature", async () => {
      const { payload } = signedRequestBody(
        subscriptionEventPayload({
          userId: "irrelevant",
          status: "active",
          subscriptionId: "sub_invalid",
        }),
      );

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/billing/webhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "stripe-signature": "t=0,v1=assinatura-forjada",
          },
          body: payload,
        },
      );

      expect(response.status).toBe(400);
    });

    test("With a subscription activation event", async () => {
      const user = await orchestrator.createUser();
      const { payload, header } = signedRequestBody(
        subscriptionEventPayload({
          userId: user.id,
          status: "active",
          subscriptionId: "sub_activation_test",
        }),
      );

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/billing/webhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "stripe-signature": header,
          },
          body: payload,
        },
      );

      expect(response.status).toBe(200);

      const subscription = await billing.findByStripeSubscriptionId(
        "sub_activation_test",
      );
      expect(subscription.status).toBe("active");
      expect(subscription.user_id).toBe(user.id);
    });

    test("With a subscription lapse event, flipping shared lists to unshared", async () => {
      const user = await orchestrator.createUser();

      await billing.upsertFromSubscription({
        userId: user.id,
        stripeCustomerId: "cus_test_123",
        stripeSubscriptionId: "sub_lapse_test",
        status: "active",
        currentPeriodEnd: new Date(),
      });

      const listResult = await database.query({
        text: `
          INSERT INTO gift_lists (owner_user_id, title, share_slug, status)
          VALUES ($1, 'Lista Ativa', 'lista-ativa-lapse-test', 'active')
          RETURNING id;
        `,
        values: [user.id],
      });
      const listId = listResult.rows[0].id;

      const { payload, header } = signedRequestBody(
        subscriptionEventPayload({
          userId: user.id,
          status: "canceled",
          subscriptionId: "sub_lapse_test",
        }),
      );

      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/billing/webhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "stripe-signature": header,
          },
          body: payload,
        },
      );

      expect(response.status).toBe(200);

      const listResultAfter = await database.query({
        text: "SELECT status FROM gift_lists WHERE id = $1;",
        values: [listId],
      });
      expect(listResultAfter.rows[0].status).toBe("unshared");
    });
  });
});
