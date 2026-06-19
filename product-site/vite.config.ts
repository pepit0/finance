import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        features: resolve(__dirname, "features/index.html"),
        demo: resolve(__dirname, "demo/index.html"),
        contact: resolve(__dirname, "contact/index.html"),
        addOns: resolve(__dirname, "add-ons/index.html"),
        pricing: resolve(__dirname, "pricing/index.html")
      }
    }
  }
});
