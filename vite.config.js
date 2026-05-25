import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

const base = process.env.VERCEL ? "/" : process.env.VITE_BASE_PATH || "/";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({
      plugins: ["babel-plugin-styled-components"],
    }),
  ],
  base,
  server: {
    // allowedHosts: true,
    proxy: {
      "/tatoeba": {
        target: "https://tatoeba.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tatoeba/, ""),
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes, req, res) => {
            // 如果 Tatoeba 返回重定向，提取 Location 头里的真实路径重新请求
            if (proxyRes.statusCode === 301 || proxyRes.statusCode === 302) {
              const location = proxyRes.headers["location"];
              if (location) {
                // 直接把重定向目标的路径转发给客户端做实际请求
                res.writeHead(302, {
                  Location:
                    "/tatoeba" +
                    new URL(location, "https://tatoeba.org").pathname +
                    new URL(location, "https://tatoeba.org").search,
                });
                res.end();
              }
            }
          });
        },
      },
    },
  },
});
