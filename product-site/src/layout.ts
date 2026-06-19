import logoUrl from "./assets/logo.png";
import { el } from "./dom";
import { siteConfig, telHref } from "./site.config";
import { initTheme, renderThemeToggle } from "./theme";

export const routes = {
  home: "/",
  features: "/features/",
  addOns: "/add-ons/",
  pricing: "/pricing/",
  demo: "/demo/",
  contact: "/contact/"
} as const;

export type SiteNavId = "features" | "addOns" | "pricing" | "demo" | "contact";

function normalizePath(path: string): string {
  let normalized = path.replace(/\/index\.html$/, "");
  if (!normalized.endsWith("/")) {
    normalized += "/";
  }
  return normalized || "/";
}

function activeNavId(): SiteNavId | null {
  const current = normalizePath(window.location.pathname);
  const entries: [SiteNavId, string][] = [
    ["features", routes.features],
    ["addOns", routes.addOns],
    ["pricing", routes.pricing],
    ["demo", routes.demo],
    ["contact", routes.contact]
  ];

  for (const [id, href] of entries) {
    if (current === normalizePath(href)) {
      return id;
    }
  }

  return null;
}

function navLink(id: SiteNavId, href: string, label: string): HTMLAnchorElement {
  const isActive = activeNavId() === id;
  const attrs: Record<string, string> = {
    href,
    class: isActive ? "siteNavLink siteNavLink--active" : "siteNavLink"
  };
  if (isActive) {
    attrs["aria-current"] = "page";
  }
  return el("a", attrs, [label]);
}

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
    navLink("features", routes.features, "Features"),
    navLink("addOns", routes.addOns, "Add-ons"),
    navLink("pricing", routes.pricing, "Pricing"),
    navLink("demo", routes.demo, "Demo"),
    navLink("contact", routes.contact, "Contact"),
    renderThemeToggle("header")
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
          el("a", { href: routes.features }, ["Features"]),
          el("a", { href: routes.addOns }, ["Add-ons"]),
          el("a", { href: routes.pricing }, ["Pricing"]),
          el("a", { href: routes.demo }, ["Demo"]),
          el("a", { href: routes.contact }, ["Contact"]),
          renderThemeToggle("footer")
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
  initTheme();
}
