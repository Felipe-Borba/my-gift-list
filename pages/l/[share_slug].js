import { useRouter } from "next/router";

import Alert from "components/Alert.js";
import Badge from "components/Badge.js";
import Card from "components/Card.js";
import PageShell from "components/PageShell.js";
import Stack from "components/Stack.js";
import useGiftList from "hooks/useGiftList.js";
import imageProxy from "services/image-proxy.js";

function formatPrice(priceCents) {
  if (priceCents === null || priceCents === undefined) {
    return null;
  }

  return (priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function PublicItemCard({ item, shareSlug }) {
  const price = formatPrice(item.price_cents);
  const purchased = item.status === "purchased";
  const buyUrl = `/api/v1/gift-lists/${shareSlug}/items/${item.id}/buy`;

  return (
    <Card>
      <div className="flex gap-4">
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageProxy.proxiedImageUrl(item.image_url)}
            alt=""
            className="size-20 rounded-lg object-cover"
          />
        )}
        <div className="flex flex-1 flex-col gap-1">
          <p className="font-medium text-text">
            {item.title || "Item sem título"}
          </p>
          {price && <p className="text-sm text-text-muted">{price}</p>}
          <Badge tone={purchased ? "success" : "neutral"}>
            {purchased ? "Já foi presenteado" : "Disponível"}
          </Badge>
        </div>
        {purchased ? (
          <span className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-text-muted opacity-50">
            Comprar
          </span>
        ) : (
          // <a> nativo, não <Link>: precisa ser uma navegação real (sem
          // prefetch do Next.js), já que o clique nesse GET marca o item
          // como comprado antes de redirecionar ao marketplace.
          <a
            href={buyUrl}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Comprar
          </a>
        )}
      </div>
    </Card>
  );
}

export default function PublicGiftListPage() {
  const router = useRouter();
  const shareSlug = router.query.share_slug;
  const { list, error, loading } = useGiftList(shareSlug);

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <PageShell>
        <PageShell.Content>
          <Alert tone="danger" message={error.message} action={error.action} />
        </PageShell.Content>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageShell.Header title={list.title} />
      <PageShell.Content>
        <Stack gap={4}>
          {list.items.map((item) => (
            <PublicItemCard key={item.id} item={item} shareSlug={shareSlug} />
          ))}
        </Stack>
      </PageShell.Content>
    </PageShell>
  );
}
