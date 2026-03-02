import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { mars3dPlugin } from "vite-plugin-mars3d";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    mars3dPlugin(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "~": resolve(__dirname, "./"),
    },
  },
  server: {
    // Listening on all local IPs
    host: true,
    https: false,
    port: 5173,
    // Load proxy configuration from .env
    // proxy: createProxy(VITE_PROXY),
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
  },
});

