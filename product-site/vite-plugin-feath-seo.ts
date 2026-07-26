import type { Plugin } from "vite";
import { getPageSeoForHtmlFile, injectSeoIntoHtml } from "./src/seo";

export function feathSeoPlugin(): Plugin {
  return {
    name: "feath-seo",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const seo = getPageSeoForHtmlFile(ctx.filename);
        if (!seo) return html;
        return injectSeoIntoHtml(html, seo);
      },
    },
  };
}
