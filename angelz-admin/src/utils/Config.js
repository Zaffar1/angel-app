import axios from "axios";
import { store } from "../store/store";
import { logout, loading } from "../store/authSlice";

const rawBaseUrl =
  (import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_URL_PRODUCTION
    : import.meta.env.VITE_API_URL_LOCAL) ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_URL_PRODUCTION ||
  import.meta.env.VITE_API_URL_LOCAL ||
  "https://papayawhip-wren-332567.hostingersite.com/api";

// Normalize base URL: strip any trailing slash or accidental trailing /api
const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, "").replace(/\/api$/, "");

const API = axios.create({
  baseURL: `${cleanBaseUrl}/api`,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    store.dispatch(loading(true));
    return config;
  },
  (error) => {
    store.dispatch(loading(false));
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    store.dispatch(loading(false));
    return response;
  },
  (error) => {
    store.dispatch(loading(false));

    if (error.response && error.response.status === 401) {
      store.dispatch(logout());
    }

    return Promise.reject(error);
  }
);

export default API;
