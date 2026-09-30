// src/utils/envConfig.js
const isProduction = import.meta.env.MODE === "production";

export const BASE_URL = isProduction
  ? import.meta.env.VITE_BASE_URL_PRODUCTION
  : import.meta.env.VITE_BASE_URL_LOCAL;

const rawApiUrl =
  (isProduction
    ? import.meta.env.VITE_API_URL_PRODUCTION
    : import.meta.env.VITE_API_URL_LOCAL) ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_URL_PRODUCTION ||
  import.meta.env.VITE_API_URL_LOCAL ||
  "https://papayawhip-wren-332567.hostingersite.com/api";

// Standardize API_URL: strip any trailing slash
export const API_URL = (rawApiUrl || "").replace(/\/+$/, "");

// Server root URL without /api (for static uploads or socket connections)
export const SERVER_URL = API_URL.replace(/\/api$/, "");
