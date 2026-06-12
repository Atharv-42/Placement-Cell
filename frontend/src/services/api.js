import axios from "axios";

const isLocalhost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (isLocalhost ? "http://localhost:5000/api" : `${window.location.origin}/api`)
});

if (!import.meta.env.VITE_API_URL && !isLocalhost) {
  console.warn(
    "VITE_API_URL is not set. API requests are using the current site origin plus /api."
  );
}

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);

export default API;
