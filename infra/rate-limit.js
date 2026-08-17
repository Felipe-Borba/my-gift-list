import { TooManyRequestsError } from "infra/errors.js";

// Limite em memória por processo — suficiente para uma única instância;
// em produção com múltiplas instâncias precisaria de um contador
// compartilhado (ex.: Redis).
const hitsByKey = new Map();

function assertWithinLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const existing = hitsByKey.get(key);

  if (!existing || now - existing.windowStart > windowMs) {
    hitsByKey.set(key, { count: 1, windowStart: now });
    return;
  }

  if (existing.count >= limit) {
    throw new TooManyRequestsError({
      message: "Limite de requisições excedido para este endpoint.",
      action: "Aguarde um instante antes de tentar novamente.",
    });
  }

  existing.count += 1;
}

function clientKeyFromRequest(request) {
  const forwardedFor = request.headers["x-forwarded-for"];
  return (
    forwardedFor?.split(",")[0].trim() ||
    request.socket?.remoteAddress ||
    "unknown"
  );
}

const rateLimit = {
  assertWithinLimit,
  clientKeyFromRequest,
};

export default rateLimit;
