import httpClient from "services/httpClient.js";

async function list({ role } = {}) {
  const query = role ? `?role=${encodeURIComponent(role)}` : "";
  return await httpClient.get(`/users${query}`);
}

async function getByUsername(username) {
  return await httpClient.get(`/users/${encodeURIComponent(username)}`);
}

async function create(data) {
  return await httpClient.post("/users", data);
}

async function update(username, data) {
  return await httpClient.patch(`/users/${encodeURIComponent(username)}`, data);
}

async function remove(username) {
  return await httpClient.delete(`/users/${encodeURIComponent(username)}`);
}

const usersService = {
  list,
  getByUsername,
  create,
  update,
  remove,
};

export default usersService;
