import { useEffect, useRef, useState } from "react";

import Alert from "components/Alert.js";
import Badge from "components/Badge.js";
import Button from "components/Button.js";
import Card from "components/Card.js";
import Input from "components/Input.js";
import PageShell from "components/PageShell.js";
import Spinner from "components/Spinner.js";
import Stack from "components/Stack.js";
import useLocalGiftList from "hooks/useLocalGiftList.js";
import httpClient from "services/httpClient.js";
import imageProxy from "services/image-proxy.js";

const PREVIEW_DEBOUNCE_MS = 600;

function isPreviewableUrl(value) {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

function formatPrice(priceCents) {
  if (priceCents === null || priceCents === undefined) {
    return null;
  }

  return (priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function CreateListForm({ onCreate }) {
  const [title, setTitle] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (title.trim()) {
      onCreate(title.trim());
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          <Input
            label="Nome da lista"
            placeholder="Ex.: Aniversário da Maria"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Button type="submit">Criar lista</Button>
        </Stack>
      </form>
    </Card>
  );
}

// Estilo "preview de link" de apps de chat: colar/editar a URL dispara a
// busca sozinha (debounced), sem precisar de um botão "Buscar". Cada preview
// carrega a URL que o gerou (forUrl); se o usuário editar o campo antes da
// resposta chegar, o preview desatualizado simplesmente para de bater com a
// URL atual e some da tela — sem precisar "resetar" estado num efeito.
function AddItemForm({ onAdd }) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const [manualDraft, setManualDraft] = useState(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmedUrl = url.trim();

    if (!isPreviewableUrl(trimmedUrl)) {
      requestIdRef.current += 1;
      return;
    }

    const requestId = ++requestIdRef.current;

    const timeoutId = setTimeout(async () => {
      setPreview({ forUrl: trimmedUrl, status: "loading" });

      try {
        const result = await httpClient.post("/link-previews", {
          url: trimmedUrl,
        });
        if (requestIdRef.current !== requestId) {
          return;
        }
        setPreview({ forUrl: trimmedUrl, status: "done", ...result });
        setManualDraft(result.resolved ? null : { title: "", imageUrl: "" });
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return;
        }
        setPreview({ forUrl: trimmedUrl, status: "error", error });
      }
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [url]);

  const trimmedUrl = url.trim();
  const activePreview = preview?.forUrl === trimmedUrl ? preview : null;

  function handleAdd() {
    onAdd({
      marketplaceUrl: trimmedUrl,
      title: (manualDraft ? manualDraft.title : activePreview.title) || null,
      imageUrl:
        (manualDraft ? manualDraft.imageUrl : activePreview.image_url) || null,
      priceCents: activePreview.price_cents,
      manualOverride: !activePreview.resolved,
    });

    setUrl("");
    setManualDraft(null);
  }

  const price =
    activePreview?.status === "done"
      ? formatPrice(activePreview.price_cents)
      : null;

  return (
    <Card>
      <Stack gap={4}>
        <Input
          label="Link do produto no marketplace"
          placeholder="Cole aqui o link de compra"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />

        {activePreview?.status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Spinner />
            Buscando informações do item…
          </div>
        )}

        {activePreview?.status === "error" && (
          <Alert
            tone="danger"
            message={activePreview.error.message}
            action={activePreview.error.action}
          />
        )}

        {activePreview?.status === "done" && (
          <Stack gap={4}>
            {!activePreview.resolved && (
              <Alert
                tone="info"
                message="Não conseguimos identificar os dados desse link automaticamente."
                action="Preencha as informações do item manualmente."
              />
            )}

            <div className="flex gap-4">
              {activePreview.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageProxy.proxiedImageUrl(activePreview.image_url)}
                  alt=""
                  className="size-16 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="flex flex-1 flex-col gap-3">
                {manualDraft ? (
                  <>
                    <Input
                      label="Título do item"
                      value={manualDraft.title}
                      onChange={(event) =>
                        setManualDraft({
                          ...manualDraft,
                          title: event.target.value,
                        })
                      }
                    />
                    <Input
                      label="URL da foto (opcional)"
                      value={manualDraft.imageUrl}
                      onChange={(event) =>
                        setManualDraft({
                          ...manualDraft,
                          imageUrl: event.target.value,
                        })
                      }
                    />
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-text">
                      {activePreview.title}
                    </p>
                    {price && (
                      <p className="text-sm text-text-muted">{price}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button onClick={handleAdd}>Adicionar à lista</Button>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}

function ItemCard({ item, onRemove }) {
  const price = formatPrice(item.price_cents);

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
          <Badge tone={item.status === "purchased" ? "success" : "neutral"}>
            {item.status === "purchased" ? "Já foi presenteado" : "Disponível"}
          </Badge>
        </div>
        <Button variant="ghost-danger" onClick={() => onRemove(item.id)}>
          Remover
        </Button>
      </div>
    </Card>
  );
}

export default function HomePage() {
  const { list, createList, addItem, removeItem } = useLocalGiftList();

  return (
    <PageShell>
      <PageShell.Header
        title="Lista de sugestão de presentes"
        subtitle="Crie sua lista sem precisar de conta — tudo fica salvo neste navegador."
        actions={list && <Button href="/share">Compartilhar lista</Button>}
      />
      <PageShell.Content>
        {!list ? (
          <CreateListForm onCreate={createList} />
        ) : (
          <>
            <h2 className="text-xl font-semibold text-text">{list.title}</h2>
            <AddItemForm onAdd={addItem} />
            <Stack gap={4}>
              {list.items.map((item) => (
                <ItemCard key={item.id} item={item} onRemove={removeItem} />
              ))}
            </Stack>
          </>
        )}
      </PageShell.Content>
    </PageShell>
  );
}
