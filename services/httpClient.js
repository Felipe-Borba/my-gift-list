// Único módulo que conhece o transporte HTTP.
// Trocar fetch por outra lib (ou mockar a rede) acontece apenas aqui.

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`/api/v1${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      responseBody?.message || "Não foi possível completar a operação.",
    );
    error.action = responseBody?.action || "Tente novamente em instantes.";
    error.statusCode = response.status;
    throw error;
  }

  return responseBody;
}

const httpClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export default httpClient;
