import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const pageEntries = {
  main: resolve(__dirname, "index.html"),
  website: resolve(__dirname, "website/index.html"),
  crm: resolve(__dirname, "crm/index.html"),
  portfolio: resolve(__dirname, "portfolio/index.html"),
  about: resolve(__dirname, "about/index.html"),
  contact: resolve(__dirname, "contact/index.html"),
  feathBoard: resolve(__dirname, "feath-board/index.html"),
  features: resolve(__dirname, "features/index.html"),
  addOns: resolve(__dirname, "add-ons/index.html"),
  demo: resolve(__dirname, "demo/index.html"),
  pricing: resolve(__dirname, "pricing/index.html")
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: pageEntries
    }
  }
});
