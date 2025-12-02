// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5000/api" // dev: Vite + local Express
      : "/api",                     // production: same origin as frontend
  withCredentials: true,
});

export default api;

