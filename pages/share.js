import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import Alert from "components/Alert.js";
import Button from "components/Button.js";
import Card from "components/Card.js";
import PageShell from "components/PageShell.js";
import Spinner from "components/Spinner.js";
import Stack from "components/Stack.js";
import useLocalGiftList from "hooks/useLocalGiftList.js";
import useMutation from "hooks/useMutation.js";
import authorization from "models/authorization.js";
import httpClient from "services/httpClient.js";

export default function SharePage() {
  const router = useRouter();
  const { list, clear } = useLocalGiftList();
  const [shareUrl, setShareUrl] = useState(null);
  const [authStatus, setAuthStatus] = useState("loading");
  const [userFeatures, setUserFeatures] = useState([]);
  const checkoutReturned = router.query.checkout === "success";

  // Só faz sentido oferecer o pagamento da taxa de hospedagem depois que a
  // conta existe de fato — checa a sessão em vez de assumir que quem chegou
  // no /share acabou de se cadastrar. Quem tem a feature
  // "create:gift-list:without-payment" (só o sysadmin, ver
  // infra/scripts/seed-admin.js) pula a etapa de pagamento — mesma checagem
  // usada em POST /api/v1/gift-lists.
  useEffect(() => {
    httpClient
      .get("/sessions")
      .then((sessionUser) => {
        setUserFeatures(sessionUser.features ?? []);
        setAuthStatus("authenticated");
      })
      .catch(() => setAuthStatus("anonymous"));
  }, []);

  const canSkipPayment =
    authStatus === "authenticated" &&
    authorization.can(
      { features: userFeatures },
      "create:gift-list:without-payment",
    );
  const readyToPublish = checkoutReturned || canSkipPayment;

  const startCheckout = useMutation(async () => {
    const { checkout_url: checkoutUrl } = await httpClient.post(
      "/billing/checkout",
      {},
    );
    window.location.href = checkoutUrl;
  });

  const publishList = useMutation(async () => {
    const created = await httpClient.post("/gift-lists", {
      title: list.title,
      items: list.items.map((item) => ({
        id: item.id,
        marketplace_url: item.marketplace_url,
        title: item.title,
        image_url: item.image_url,
        price_cents: item.price_cents,
        manual_override: item.manual_override,
      })),
    });
    setShareUrl(created.share_url);
    clear();
  });

  if (!list && !shareUrl) {
    return (
      <PageShell>
        <PageShell.Header title="Compartilhar lista" />
        <PageShell.Content>
          <Alert
            tone="info"
            message="Você ainda não tem uma lista local para compartilhar."
            action="Volte à página inicial e crie sua lista primeiro."
          />
          <Button href="/">Voltar para a lista</Button>
        </PageShell.Content>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageShell.Header title="Compartilhar lista" />
      <PageShell.Content>
        {shareUrl ? (
          <Card>
            <Stack gap={4}>
              <Alert
                tone="success"
                message="Sua lista está no ar!"
                action="Compartilhe o link abaixo com quem você quiser."
              />
              <p className="break-all text-sm font-medium text-primary">
                {shareUrl}
              </p>
            </Stack>
          </Card>
        ) : (
          <Card>
            <Stack gap={4}>
              <p className="text-sm text-text-muted">
                Compartilhar exige uma conta e o pagamento de uma pequena taxa
                de hospedagem — é o que cobre o custo de manter sua lista no ar.
              </p>

              {authStatus === "loading" && !readyToPublish && <Spinner />}

              {authStatus === "anonymous" && !readyToPublish && (
                <div className="flex flex-wrap gap-3">
                  <Button href="/signup">1. Criar conta</Button>
                  <Button href="/login" variant="secondary">
                    Já tenho conta
                  </Button>
                </div>
              )}

              {startCheckout.error && (
                <Alert
                  tone="danger"
                  message={startCheckout.error.message}
                  action={startCheckout.error.action}
                />
              )}

              {authStatus === "authenticated" && !readyToPublish && (
                <Button
                  loading={startCheckout.loading}
                  onClick={() => startCheckout.run()}
                >
                  2. Pagar taxa de hospedagem
                </Button>
              )}

              {readyToPublish && (
                <>
                  {publishList.error && (
                    <Alert
                      tone="danger"
                      message={publishList.error.message}
                      action={publishList.error.action}
                    />
                  )}
                  <Button
                    loading={publishList.loading}
                    onClick={() => publishList.run()}
                  >
                    3. Publicar lista
                  </Button>
                </>
              )}
            </Stack>
          </Card>
        )}
      </PageShell.Content>
    </PageShell>
  );
}
