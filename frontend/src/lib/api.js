import axios from "axios";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://hakkiveda2-production.up.railway.app";
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hk_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
