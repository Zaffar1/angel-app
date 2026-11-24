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

// Deduplicate concurrent identical GET requests
const pendingGetRequests = new Map();
const originalGet = api.get.bind(api);

api.get = function (url, config = {}) {
  const key = `${url}?${JSON.stringify(config.params || {})}`;
  if (pendingGetRequests.has(key)) {
    return pendingGetRequests.get(key);
  }

  const promise = originalGet(url, config).finally(() => {
    pendingGetRequests.delete(key);
  });

  pendingGetRequests.set(key, promise);
  return promise;
};

export default api;

