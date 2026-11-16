import { resolve } from "node:path";
import type { Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { feathSeoPlugin } from "./vite-plugin-feath-seo";

const pageEntries = {
  main: resolve(__dirname, "index.html"),
  website: resolve(__dirname, "website/index.html"),
  crm: resolve(__dirname, "crm/index.html"),
  products: resolve(__dirname, "products/index.html"),
  about: resolve(__dirname, "about/index.html"),
  contact: resolve(__dirname, "contact/index.html"),
  privacy: resolve(__dirname, "privacy/index.html"),
  terms: resolve(__dirname, "terms/index.html"),
  cookies: resolve(__dirname, "cookies/index.html"),
  feathBoard: resolve(__dirname, "feath-board/index.html"),
  features: resolve(__dirname, "features/index.html"),
  addOns: resolve(__dirname, "add-ons/index.html"),
  demo: resolve(__dirname, "demo/index.html"),
  share: resolve(__dirname, "share/index.html"),
  training: resolve(__dirname, "training/index.html"),
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

/** Redirect the old /portfolio/ URL to /products/ during local dev and preview. */
function legacyPortfolioRedirect(): Plugin {
  const redirect = (
    req: { url?: string },
    res: { writeHead: (status: number, headers: Record<string, string>) => void; end: () => void }
  ) => {
    if (!req.url) return false;
    const q = req.url.indexOf("?");
    const path = q === -1 ? req.url : req.url.slice(0, q);
    if (path === "/portfolio" || path === "/portfolio/") {
      res.writeHead(301, { Location: "/products/" });
      res.end();
      return true;
    }
    return false;
  };

  return {
    name: "feath-legacy-portfolio-redirect",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (redirect(req, res)) return;
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (redirect(req, res)) return;
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [feathSeoPlugin(), react(), tailwindcss(), shortViewFallback(), legacyPortfolioRedirect()],
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
