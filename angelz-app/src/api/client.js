import axios from "axios";
import { store } from "../app/store";
import { clearCredentials } from "../features/auth/authSlice";
import { API_URL } from "../utils/envConfig";

// Ensure baseURL ends with /api without duplicating if API_URL already has /api
const baseURL = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      store.dispatch(clearCredentials());
    }
    return Promise.reject(err);
  }
);

export default api;
