import axios from "axios";
import { createLogger } from "../utils/logger";

const log = createLogger("api-client");

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  log.debug(`${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

client.interceptors.response.use(
  (response) => {
    log.debug(`Response ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    log.error(`Request failed: ${error.response?.status} ${error.config?.url}`, error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

export default client;
