export const SITE_URL = "https://feath.xyz";
export const BRAND_NAME = "Feath AI";
export const LEGAL_NAME = "Feath";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

const COMPANY_TAGLINE = "Business solutions that convert";
const ORG_DESCRIPTION =
  "We develop business solutions that help you convert more customers and never miss a lead. CRM, AI-integrated websites, and custom builds tailored to how you work.";
const CONTACT_EMAIL = "info@feath.xyz";
const CONTACT_PHONE = "(587) 400-0985";
const INSTAGRAM_URL = "https://instagram.com/feath.ai";

export type PageSeo = {
  path: string;
  title: string;
  description: string;
  index?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

/** Head-only copy. Page body text is unchanged. Titles use Feath AI for search/AI discovery. */
export const pageSeoByPath: Record<string, PageSeo> = {
  "/": {
    path: "/",
    title: `${BRAND_NAME} · ${COMPANY_TAGLINE}`,
    description:
      "Feath · business solutions that convert. CRM, AI-integrated websites, and custom builds.",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: LEGAL_NAME,
        alternateName: [BRAND_NAME, "Feath.ai"],
        url: SITE_URL,
        logo: OG_IMAGE,
        email: CONTACT_EMAIL,
        telephone: CONTACT_PHONE,
        description: ORG_DESCRIPTION,
        sameAs: [INSTAGRAM_URL],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: BRAND_NAME,
        alternateName: LEGAL_NAME,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  },
  "/crm/": {
    path: "/crm/",
    title: `CRM · ${BRAND_NAME}`,
    description: "Feath CRM · pipeline, calls, team permissions, and custom add-ons for your business.",
  },
  "/portfolio/": {
    path: "/portfolio/",
    title: `Portfolio · ${BRAND_NAME}`,
    description: "Projects built by Feath · websites and business solutions.",
  },
  "/about/": {
    path: "/about/",
    title: `About · ${BRAND_NAME}`,
    description: "About Feath · custom websites, CRM, and AI-integrated business solutions.",
  },
  "/pricing/": {
    path: "/pricing/",
    title: `Pricing · ${BRAND_NAME}`,
    description:
      "Feath website pricing for small and growing businesses. Custom sites with optional CRM add-on. Flexible monthly plans.",
  },
  "/contact/": {
    path: "/contact/",
    title: `Book a consultation · ${BRAND_NAME}`,
    description: "Book a consultation with Feath · websites, CRM, or custom business solutions.",
  },
  "/training/": {
    path: "/training/",
    title: `Sales guide · ${LEGAL_NAME}`,
    description: "Feath internal sales training.",
    index: false,
  },
  "/share/": {
    path: "/share/",
    title: `Share prototype · ${LEGAL_NAME}`,
    description: "Create a feath.xyz link for a Figma prototype embed.",
    index: false,
  },
  "/view/": {
    path: "/view/",
    title: `Prototype · ${LEGAL_NAME}`,
    description: "View a Feath-hosted prototype.",
    index: false,
  },
  "/feath-board/": {
    path: "/feath-board/",
    title: `Feath — Feature Board`,
    description: "Internal Feath feature board.",
    index: false,
  },
};

const htmlPathToRoute: Record<string, string> = {
  "index.html": "/",
  "crm/index.html": "/crm/",
  "portfolio/index.html": "/portfolio/",
  "about/index.html": "/about/",
  "pricing/index.html": "/pricing/",
  "contact/index.html": "/contact/",
  "training/index.html": "/training/",
  "share/index.html": "/share/",
  "view/index.html": "/view/",
  "feath-board/index.html": "/feath-board/",
};

export function normalizePath(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function getPageSeoForPath(pathname: string): PageSeo | undefined {
  return pageSeoByPath[normalizePath(pathname)];
}

export function getPageSeoForHtmlFile(htmlPath: string): PageSeo | undefined {
  const normalized = htmlPath.replace(/\\/g, "/");
  for (const [relative, route] of Object.entries(htmlPathToRoute)) {
    if (normalized.endsWith(`/${relative}`) || normalized.endsWith(relative)) {
      return pageSeoByPath[route];
    }
  }
  return undefined;
}

export function buildSeoHeadTags(seo: PageSeo): string {
  const url = `${SITE_URL}${seo.path === "/" ? "/" : seo.path}`;
  const indexable = seo.index !== false;
  const robots = indexable ? "index, follow" : "noindex, nofollow";

  const tags = [
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<meta name="application-name" content="${BRAND_NAME}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${escapeAttr(seo.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(seo.description)}" />`,
    `<meta property="og:site_name" content="${BRAND_NAME}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:alt" content="${BRAND_NAME} logo" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(seo.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(seo.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
  ];

  if (seo.jsonLd) {
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(seo.jsonLd).replace(/</g, "\\u003c")}</script>`,
    );
  }

  return tags.join("\n    ");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function injectSeoIntoHtml(html: string, seo: PageSeo): string {
  let next = html;

  next = next.replace(/<title>[^<]*<\/title>/, `<title>${seo.title}</title>`);
  next = next.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapeAttr(seo.description)}" />`,
  );

  if (next.includes('rel="canonical"')) {
    return next;
  }

  return next.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapeAttr(seo.description)}" />\n    ${buildSeoHeadTags(seo)}`,
  );
}

export const sitemapPaths = Object.values(pageSeoByPath)
  .filter((page) => page.index !== false)
  .map((page) => page.path);
