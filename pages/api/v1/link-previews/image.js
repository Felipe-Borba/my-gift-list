import controller from "infra/controller.js";
import { ServiceError, ValidationError } from "infra/errors.js";
import rateLimit from "infra/rate-limit.js";
import linkPreview from "models/link-preview.js";

const RATE_LIMIT = { limit: 60, windowMs: 60 * 1000 };
const CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

async function getHandler(request, response) {
  rateLimit.assertWithinLimit(
    `link-previews-image:${rateLimit.clientKeyFromRequest(request)}`,
    RATE_LIMIT,
  );

  const url = validateUrl(request.query.url);

  let image;
  try {
    image = await linkPreview.fetchImage(url);
  } catch (error) {
    throw new ServiceError({
      message: "Não foi possível carregar a imagem.",
      cause: error,
    });
  }

  response.setHeader("Content-Type", image.contentType);
  response.setHeader("Cache-Control", CACHE_CONTROL);
  response.status(200).send(image.buffer);
}

function validateUrl(rawUrl) {
  if (!rawUrl || Array.isArray(rawUrl)) {
    throw new ValidationError({
      message: 'O parâmetro "url" é obrigatório.',
      action: "Informe a URL da imagem a ser carregada.",
    });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new ValidationError({
      message: "A URL informada é inválida.",
      action: "Verifique se o link da imagem está correto.",
    });
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new ValidationError({
      message: "Apenas URLs http(s) são suportadas.",
      action: "Verifique se o link da imagem está correto.",
    });
  }

  return parsedUrl.toString();
}

export default controller.router({ GET: getHandler });
