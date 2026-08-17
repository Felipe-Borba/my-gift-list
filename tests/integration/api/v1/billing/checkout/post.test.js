import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/billing/checkout", () => {
  describe("Anonymous user", () => {
    test("Without authentication", async () => {
      const response = await fetch(
        `${orchestrator.webserverUrl}/api/v1/billing/checkout`,
        { method: "POST" },
      );

      expect(response.status).toBe(401);
    });
  });

  // A criação de sessão de Checkout em si (200 + checkout_url) exige uma
  // chamada real à API do Stripe com uma chave de teste válida — diferente
  // da verificação de assinatura do webhook, aqui não há como validar
  // localmente sem credenciais. Esse caminho é validado manualmente
  // (quickstart.md, Cenário 2) contra uma conta Stripe em modo de teste.
});
