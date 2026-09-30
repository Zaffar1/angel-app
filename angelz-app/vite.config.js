import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const rawApiUrl =
    env.VITE_API_URL_PRODUCTION ||
    "https://papayawhip-wren-332567.hostingersite.com/api";
  const serverUrl = rawApiUrl.replace(/\/+$/, "").replace(/\/api$/, "");

  return {
    plugins: [react(), tailwindcss()],
    base: mode === "production"
      ? env.VITE_BASE_URL_PRODUCTION
      : env.VITE_BASE_URL_LOCAL,
    server: {
      proxy: {
        "/api": {
          target: serverUrl,
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: serverUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});