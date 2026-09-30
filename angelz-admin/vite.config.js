import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const baseURL =
    mode === "production"
      ? "/admin/"
      : env.VITE_BASE_URL_LOCAL;

  return {
    plugins: [react()],

    base: baseURL,

    server: {
      proxy: {
        "/api": {
          target:
            env.VITE_API_URL_LOCAL ||
            "https://papayawhip-wren-332567.hostingersite.com",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});

// import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd());

//   const baseURL =
//     mode === "production"
//       ? env.VITE_BASE_URL_PRODUCTION
//       : env.VITE_BASE_URL_LOCAL;

//   return {
//     plugins: [react()],
//     base: baseURL,
//     server: {
//       proxy: {
//         "/api": {
//           target:
//             env.VITE_API_URL_LOCAL ||
//             "https://papayawhip-wren-332567.hostingersite.com/api",
//           changeOrigin: true,
//           secure: false,
//         },
//       },
//     },
//   };
// });
