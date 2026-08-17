import * as cheerio from "cheerio";

const FETCH_TIMEOUT_IN_MILLISECONDS = 8000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Vários marketplaces (ex.: Mercado Livre) bloqueiam qualquer User-Agent que
// não reconheçam, mas liberam os crawlers de preview de apps de chat/redes
// sociais (WhatsApp, Facebook) — o mesmo og:title/og:image que o comerciante
// já expõe publicamente para esse fim. Identificar-se como esse crawler é o
// que faz esses links resolverem aqui do mesmo jeito que resolvem no WhatsApp.
const USER_AGENT = "WhatsApp/2.23.20.0 A";

async function fetchAndParse(url) {
  try {
    const html = await fetchHtml(url);
    return parseMetaTags(html);
  } catch {
    return { title: null, image_url: null, price_cents: null, resolved: false };
  }
}

async function fetchHtml(url) {
  const response = await fetchWithTimeout(url);
  return await response.text();
}

// Baixa a imagem no servidor em vez de deixar o navegador do visitante
// carregá-la direto do marketplace — mesma ideia usada por clientes de chat
// (ex.: WhatsApp) ao gerar preview de link, para não vazar IP/referrer do
// visitante ao site de origem e não quebrar a lista se a URL expirar.
async function fetchImage(url) {
  const response = await fetchWithTimeout(url);

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected content-type ${contentType}`);
  }

  const buffer = await readBufferWithLimit(response.body, MAX_IMAGE_BYTES);
  return { buffer, contentType };
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    FETCH_TIMEOUT_IN_MILLISECONDS,
  );

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Unexpected status ${response.status}`);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function readBufferWithLimit(stream, maxBytes) {
  const reader = stream.getReader();
  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error("Image exceeds maximum allowed size");
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

function parseMetaTags(html) {
  const $ = cheerio.load(html);

  // Sem fallback para a tag <title> pura: páginas de bloqueio/verificação
  // anti-bot (ex.: Mercado Livre) respondem 200 com um <title> genérico do
  // site, o que fazia o preview "resolver" com lixo em vez de cair no
  // preenchimento manual. og:title/twitter:title só existem quando a página
  // real do produto foi servida.
  const title = metaContent($, [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
  ]);

  const imageUrl = metaContent($, [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
  ]);

  const priceCents = parsePriceCents(
    metaContent($, [
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
    ]),
  );

  const resolved = Boolean(title || imageUrl);

  return { title, image_url: imageUrl, price_cents: priceCents, resolved };
}

function metaContent($, selectors) {
  for (const selector of selectors) {
    const content = $(selector).first().attr("content");
    if (content) {
      return content.trim();
    }
  }
  return null;
}

function parsePriceCents(rawValue) {
  if (!rawValue) {
    return null;
  }

  const numericValue = Number.parseFloat(rawValue.replace(",", "."));
  if (Number.isNaN(numericValue)) {
    return null;
  }

  return Math.round(numericValue * 100);
}

const linkPreview = {
  fetchAndParse,
  fetchImage,
};

export default linkPreview;
