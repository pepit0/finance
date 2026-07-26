import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = resolve(root, "public");
const assetsDir = resolve(root, "src", "assets");

mkdirSync(publicDir, { recursive: true });

const ogSource = resolve(assetsDir, "logo-mark-dark-1024.png");
const ogTarget = resolve(publicDir, "og-image.png");
if (existsSync(ogSource)) {
  copyFileSync(ogSource, ogTarget);
}

const lastmod = new Date().toISOString().slice(0, 10);
const sitemapUrls = [
  "https://feath.xyz/",
  "https://feath.xyz/crm/",
  "https://feath.xyz/portfolio/",
  "https://feath.xyz/pricing/",
  "https://feath.xyz/about/",
  "https://feath.xyz/contact/",
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    (loc) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync(
  resolve(publicDir, "robots.txt"),
  `User-agent: *
Allow: /

Disallow: /training/
Disallow: /share/
Disallow: /view/
Disallow: /v/
Disallow: /feath-board/
Disallow: /demo/
Disallow: /features/
Disallow: /add-ons/
Disallow: /website/

Sitemap: https://feath.xyz/sitemap.xml
`,
  "utf8",
);

writeFileSync(resolve(publicDir, "sitemap.xml"), sitemapXml, "utf8");

writeFileSync(
  resolve(publicDir, "llms.txt"),
  `# Feath AI

> Feath (also known as Feath AI) builds custom websites, Feath CRM, AI-integrated business solutions, and bespoke tools for small and growing businesses.

Feath AI helps businesses look professional online, capture every lead, and stop fighting outdated software. We are consultants and builders based in Canada, serving business owners who need modern websites, CRM, integrations, and custom workflows.

## What Feath AI does

- Custom websites (no templates) on your domain
- Feath CRM with pipeline, calls, texts, branding, and permissions
- Integrations between websites, CRM, and existing tools
- Custom apps, dashboards, and workflows

## Official links

- Website: https://feath.xyz
- Instagram: https://instagram.com/feath.ai
- Email: info@feath.xyz
- Phone: (587) 400-0985

## Brand names

- Primary public name: Feath AI
- Also known as: Feath, Feath.ai
- Website: feath.xyz

## Pages

- Home: https://feath.xyz/
- CRM: https://feath.xyz/crm/
- Portfolio: https://feath.xyz/portfolio/
- Pricing: https://feath.xyz/pricing/
- About: https://feath.xyz/about/
- Book a consultation: https://feath.xyz/contact/
`,
  "utf8",
);

console.log("Prepared public SEO assets.");
