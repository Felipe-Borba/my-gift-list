import httpClient from "services/httpClient.js";

async function list({ student, evaluator } = {}) {
  const params = new URLSearchParams();
  if (student) params.set("student", student);
  if (evaluator) params.set("evaluator", evaluator);

  const query = params.size > 0 ? `?${params.toString()}` : "";
  return await httpClient.get(`/evaluations${query}`);
}

async function getById(id) {
  return await httpClient.get(`/evaluations/${encodeURIComponent(id)}`);
}

async function create(data) {
  return await httpClient.post("/evaluations", data);
}

async function update(id, data) {
  return await httpClient.patch(`/evaluations/${encodeURIComponent(id)}`, data);
}

async function remove(id) {
  return await httpClient.delete(`/evaluations/${encodeURIComponent(id)}`);
}

const evaluationsService = {
  list,
  getById,
  create,
  update,
  remove,
};

export default evaluationsService;
