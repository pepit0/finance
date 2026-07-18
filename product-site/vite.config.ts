import { resolve } from "node:path";
import type { Plugin } from "vite";
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
  pricing: resolve(__dirname, "pricing/index.html"),
  share: resolve(__dirname, "share/index.html"),
  view: resolve(__dirname, "view/index.html")
};

function isShortViewPath(pathname: string): boolean {
  return /^\/v\/[a-z0-9]+\/?$/i.test(pathname) || /^\/view\/[a-z0-9]+\/?$/i.test(pathname);
}

/** Serve view app for short share URLs like /v/abc12345 */
function shortViewFallback(): Plugin {
  const rewrite = (req: { url?: string }) => {
    if (!req.url) return;
    const q = req.url.indexOf("?");
    const path = q === -1 ? req.url : req.url.slice(0, q);
    const query = q === -1 ? "" : req.url.slice(q);
    if (isShortViewPath(path)) {
      req.url = `/view/${query}`;
    }
  };

  return {
    name: "feath-short-view-fallback",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        rewrite(req);
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), shortViewFallback()],
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
