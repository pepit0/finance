import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getPageSeoForPath, normalizePath } from "../../seo";

function upsertMeta(
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  let el = document.querySelector(`meta[${attribute}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function usePageMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = getPageSeoForPath(normalizePath(pathname));
    if (!seo) return;

    document.title = seo.title;
    upsertMeta("name", "description", seo.description);
    upsertMeta("name", "robots", seo.index === false ? "noindex, nofollow" : "index, follow");
    upsertMeta("name", "application-name", "Feath AI");
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", `https://feath.xyz${seo.path === "/" ? "/" : seo.path}`);
    upsertMeta("property", "og:title", seo.title);
    upsertMeta("property", "og:description", seo.description);
    upsertMeta("property", "og:site_name", "Feath AI");
    upsertMeta("property", "og:image", "https://feath.xyz/og-image.png");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", seo.title);
    upsertMeta("name", "twitter:description", seo.description);
    upsertMeta("name", "twitter:image", "https://feath.xyz/og-image.png");
    upsertLink("canonical", `https://feath.xyz${seo.path === "/" ? "/" : seo.path}`);
  }, [pathname]);
}
