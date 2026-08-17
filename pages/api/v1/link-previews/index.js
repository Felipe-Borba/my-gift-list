import controller from "infra/controller.js";
import { ValidationError } from "infra/errors.js";
import rateLimit from "infra/rate-limit.js";
import linkPreview from "models/link-preview.js";

const RATE_LIMIT = { limit: 20, windowMs: 60 * 1000 };

async function postHandler(request, response) {
  rateLimit.assertWithinLimit(
    `link-previews:${rateLimit.clientKeyFromRequest(request)}`,
    RATE_LIMIT,
  );

  const { url } = request.body ?? {};

  validateUrl(url);

  const preview = await linkPreview.fetchAndParse(url);

  response.status(200).json(preview);
}

function validateUrl(url) {
  if (!url) {
    throw new ValidationError({
      message: 'O campo "url" é obrigatório.',
      action: "Informe o link do produto no marketplace.",
    });
  }

  try {
    new URL(url);
  } catch {
    throw new ValidationError({
      message: "A URL informada é inválida.",
      action: "Verifique se o link foi colado corretamente.",
    });
  }
}

export default controller.router({ POST: postHandler });
