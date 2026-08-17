import httpClient from "services/httpClient.js";

async function login({ username, password }) {
  return await httpClient.post("/sessions", { username, password });
}

async function logout() {
  return await httpClient.delete("/sessions");
}

async function currentUser() {
  return await httpClient.get("/user");
}

const sessionsService = {
  login,
  logout,
  currentUser,
};

export default sessionsService;
