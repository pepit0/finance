import logoUrl from "./assets/logo.png";
import { el } from "./dom";
import { siteConfig, telHref } from "./site.config";

export const routes = {
  home: "/",
  features: "/features/",
  addOns: "/add-ons/",
  pricing: "/pricing/",
  demo: "/demo/",
  contact: "/contact/"
} as const;

function homeLink(): HTMLAnchorElement {
  return el("a", { href: routes.home, class: "siteLogo", "aria-label": siteConfig.productName }, [
    el("img", {
      class: "siteLogoMark",
      src: logoUrl,
      alt: "",
      width: "36",
      height: "36",
      decoding: "async"
    }),
    el("span", { class: "siteLogoText" }, [siteConfig.productName])
  ]);
}

export function renderHeader(): HTMLElement {
  const nav = el("nav", { class: "siteNav", "aria-label": "Primary" }, [
    el("a", { href: routes.features, class: "siteNavLink" }, ["Features"]),
    el("a", { href: routes.addOns, class: "siteNavLink" }, ["Add-ons"]),
    el("a", { href: routes.pricing, class: "siteNavLink" }, ["Pricing"]),
    el("a", { href: routes.demo, class: "siteNavLink" }, ["Demo"]),
    el("a", { href: routes.contact, class: "siteNavLink" }, ["Contact"])
  ]);

  return el("header", { class: "siteHeader" }, [
    el("div", { class: "siteContainer siteHeaderInner" }, [homeLink(), nav])
  ]);
}

export function renderFooter(): HTMLElement {
  const year = new Date().getFullYear();
  return el("footer", { class: "siteFooter" }, [
    el("div", { class: "siteContainer siteFooterInner" }, [
      el("div", { class: "footerTop" }, [
        el("div", { class: "footerBrandBlock" }, [
          el("span", { class: "footerBrand" }, [siteConfig.productName]),
          el("span", { class: "footerTagline" }, ["Built for independent dealers"])
        ]),
        el("nav", { class: "footerLinks", "aria-label": "Footer" }, [
          el("a", { href: routes.addOns }, ["Add-ons"]),
          el("a", { href: routes.pricing }, ["Pricing"]),
          el("a", { href: routes.demo }, ["Demo"]),
          el("a", { href: routes.contact }, ["Contact"])
        ])
      ]),
      el("div", { class: "footerBottom" }, [
        el("a", { href: telHref(), class: "footerContactLink" }, [siteConfig.contactPhone]),
        el("span", { class: "footerCopy" }, [`© ${year} ${siteConfig.productName}`])
      ])
    ])
  ]);
}

export type PageMeta = {
  title: string;
  description: string;
};

export function setPageMeta({ title, description }: PageMeta): void {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.setAttribute("content", description);
  }
}

export function mountPage(mainChildren: HTMLElement[], meta: PageMeta): void {
  setPageMeta(meta);

  const root = document.getElementById("app");
  if (!root) {
    return;
  }

  root.append(renderHeader(), el("main", {}, mainChildren), renderFooter());
}
