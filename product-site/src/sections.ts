import { buttonLink, el, pWithDots } from "./dom";
import { renderFeatureVisual } from "./featureVisuals";
import { renderFigmaWebsite } from "./websiteFigma";
import { renderContactBooker } from "./contactBooker";
import { renderCrmPreview } from "./crmPreview";
import { renderHeroTitle } from "./heroRotatingText";
import { routes } from "./layout";
import {
  renderAmbientBackdrop,
  renderHeroShowcase,
  renderPortfolioVisual,
  renderServiceScene,
  type ServiceSceneKind
} from "./sceneGraphics";
import { mailtoHref, siteConfig, telHref } from "./site.config";

const CONTACT_ICONS = {
  phone: `<svg class="contactMethodIconSvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.6 10.8c1.5 2.9 3.7 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.3 21 3 13.7 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/></svg>`,
  email: `<svg class="contactMethodIconSvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`
} as const;

function contactMethodIcon(kind: keyof typeof CONTACT_ICONS): HTMLSpanElement {
  const icon = el("span", { class: "contactMethodIcon", "aria-hidden": "true" });
  icon.innerHTML = CONTACT_ICONS[kind];
  return icon;
}

function renderServiceCard(
  kind: ServiceSceneKind,
  title: string,
  description: string,
  href: string,
  cta: string
): HTMLElement {
  return el("article", { class: "homeServiceCard" }, [
    renderServiceScene(kind, { compact: true }),
    el("h2", { class: "homeServiceTitle" }, [title]),
    pWithDots("homeServiceDescription", description),
    el("a", { href, class: "homeServiceLink" }, [cta, el("span", { "aria-hidden": "true" }, [" →"])])
  ]);
}

export function renderCompanyHome(): HTMLElement {
  const services = el("div", { class: "homeServices" }, [
    renderServiceCard(
      "website",
      "Websites",
      "AI-integrated custom websites that capture leads and convert visitors into customers.",
      routes.website,
      "Explore websites"
    ),
    renderServiceCard(
      "crm",
      "CRM",
      "Our own customer management platform · pipeline, calls, team permissions, and your branding.",
      routes.crm,
      "Explore CRM"
    ),
    renderServiceCard(
      "portfolio",
      "Portfolio",
      "See the sites and products we've built for clients and ourselves.",
      routes.portfolio,
      "View our work"
    )
  ]);

  return el("section", { class: "hero heroHome", "data-scene-root": "true" }, [
    renderAmbientBackdrop(),
    el("div", { class: "siteContainer heroLayout" }, [
      el("div", { class: "heroContent" }, [
        el("p", { class: "heroEyebrow" }, [siteConfig.companyTagline]),
        el("h1", { class: "heroTitle heroTitle--brand" }, [siteConfig.productName]),
        renderHeroTitle(),
        pWithDots("heroDescription", siteConfig.description),
        el("div", { class: "heroActions" }, [
          buttonLink(routes.contact, "Book a consultation", "btn btnPrimary"),
          buttonLink(routes.crm, "Explore our CRM", "btn btnSecondary")
        ])
      ]),
      renderHeroShowcase()
    ]),
    el("div", { class: "siteContainer homeServicesSection" }, [
      el("div", { class: "homeServicesHeader" }, [
        el("h2", { class: "homeServicesTitle" }, ["What we build"]),
        pWithDots(
          "homeServicesLead",
          "Three ways we help businesses grow · pick what fits, or combine them."
        )
      ]),
      services
    ])
  ]);
}

/** @deprecated Use renderCompanyHome */
export function renderHero(): HTMLElement {
  return renderCompanyHome();
}

function buildFeatureGrid(): HTMLElement {
  const grid = el("div", { class: "featureGrid" });
  for (const feature of siteConfig.features) {
    grid.append(
      el("article", { class: "featureCard" }, [
        renderFeatureVisual(feature.visualId),
        el("h3", { class: "featureTitle" }, [feature.title]),
        pWithDots("featureDescription", feature.description)
      ])
    );
  }
  return grid;
}

function renderFeaturesSection(): HTMLElement {
  const header = el("div", { class: "featuresHeader" }, [
    el("h2", { class: "sectionTitle featuresIntroTitle" }, ["Everything you need, all in one place."]),
    el("div", { class: "featuresHeaderCta" }, [
      el("p", { class: "featuresIntroCtaHint" }, ["Don't see what you want?"]),
      buttonLink(`${routes.crm}#addons`, "Custom add-ons", "btn btnSecondary featuresIntroCtaBtn")
    ]),
    pWithDots(
      "sectionLead featuresIntroLead",
      `Feath CRM focuses on customers, communication, and your team · not features you'll never use.`
    )
  ]);

  return el("div", { class: "crmSubsection", id: "features" }, [
    header,
    buildFeatureGrid()
  ]);
}

function renderAddOnsSection(): HTMLElement {
  const processGrid = el("ol", { class: "addonProcessGrid" });
  siteConfig.addOnProcessSteps.forEach((step, index) => {
    processGrid.append(
      el("li", { class: "addonProcessStep" }, [
        el("span", { class: "addonProcessNumber", "aria-hidden": "true" }, [String(index + 1)]),
        el("h3", { class: "addonProcessTitle" }, [step.title]),
        pWithDots("addonDescription", step.description)
      ])
    );
  });

  const examplesGrid = el("div", { class: "addonExamplesGrid" });
  for (const example of siteConfig.customAddOnExamples) {
    examplesGrid.append(
      el("article", { class: "addonExampleCard" }, [
        el("span", { class: "addonExampleAccent", "aria-hidden": "true" }),
        el("h4", { class: "addonExampleTitle" }, [example.title]),
        pWithDots("addonExampleDescription", example.description)
      ])
    );
  }

  return el("div", { class: "crmSubsection crmSubsection--addons", id: "addons" }, [
    el("h2", { class: "sectionTitle" }, ["Custom add-ons"]),
    pWithDots("sectionLead", siteConfig.addOnsIntro),
    el("h3", { class: "addonSectionHeading" }, ["How it works"]),
    processGrid,
    el("h3", { class: "addonSectionHeading" }, ["Examples"]),
    examplesGrid,
    el("div", { class: "addonCta" }, [
      pWithDots("addonCtaLead", siteConfig.addOnsClosing),
      el("div", { class: "heroActions" }, [
        buttonLink(routes.contact, "Talk about a custom add-on", "btn btnPrimary"),
        buttonLink(routes.contact, "Book a consultation", "btn btnSecondary")
      ])
    ])
  ]);
}

function renderDemoSection(): HTMLElement {
  return el("div", { class: "crmSubsection crmSubsection--demo", id: "demo" }, [
    el("div", { class: "demoLayout" }, [
      el("div", { class: "demoIntro" }, [
        el("h2", { class: "sectionTitle" }, ["See it in action"]),
        pWithDots(
          "sectionLead",
          "Explore a live preview of Feath CRM below, or book a video call and we'll walk you through how it fits your business."
        ),
        el("div", { class: "heroActions" }, [
          buttonLink(routes.contact, "Book a walkthrough", "btn btnPrimary btnLarge"),
          el("a", {
            href: siteConfig.demoUrl,
            class: "btn btnSecondary btnLarge",
            target: "_blank",
            rel: "noopener noreferrer"
          }, ["Open live demo"])
        ])
      ]),
      el("div", { class: "demoPreview" }, [renderCrmPreview()])
    ])
  ]);
}

export function renderCrm(): HTMLElement {
  return el("section", { class: "section sectionCrm", "data-scene-root": "true" }, [
    renderAmbientBackdrop(),
    el("div", { class: "siteContainer" }, [
      el("div", { class: "crmIntro" }, [
        el("p", { class: "crmEyebrow" }, ["Feath CRM"]),
        el("h1", { class: "sectionTitle crmIntroTitle" }, ["Customer management built for your business"]),
        pWithDots(
          "sectionLead crmIntroLead",
          "Track leads, customers, calls, and your team in one place. Your branding on your own domain · with custom add-ons when you need more."
        ),
        el("div", { class: "heroActions crmIntroActions" }, [
          buttonLink(routes.contact, "Book a consultation", "btn btnPrimary"),
          buttonLink(`${routes.crm}#demo`, "See the demo", "btn btnSecondary")
        ])
      ]),
      renderFeaturesSection(),
      renderAddOnsSection(),
      renderDemoSection()
    ])
  ]);
}

export function renderPortfolio(): HTMLElement {
  const grid = el("div", { class: "portfolioGrid" });
  for (const project of siteConfig.portfolioProjects) {
    const statusLabel = project.status === "live" ? "Live" : "In progress";
    grid.append(
      el("article", { class: "portfolioCard" }, [
        renderPortfolioVisual(project),
        el("div", { class: "portfolioCardBody" }, [
          el("div", { class: "portfolioCardHead" }, [
            el("h2", { class: "portfolioCardTitle" }, [project.name]),
            el("span", { class: `portfolioStatus portfolioStatus--${project.status}` }, [statusLabel])
          ]),
          pWithDots("portfolioCardDescription", project.description),
          el("a", {
            href: project.url,
            class: "portfolioCardLink",
            target: "_blank",
            rel: "noopener noreferrer"
          }, ["Visit site", el("span", { "aria-hidden": "true" }, [" ↗"])])
        ])
      ])
    );
  }

  return el("section", { class: "section sectionPortfolio", "data-scene-root": "true" }, [
    renderAmbientBackdrop(),
    el("div", { class: "siteContainer" }, [
      el("p", { class: "portfolioEyebrow" }, ["Our work"]),
      el("h1", { class: "sectionTitle" }, ["Projects we've built"]),
      pWithDots(
        "sectionLead",
        "A selection of websites and products we've delivered · from marketing sites to full business solutions."
      ),
      grid,
      el("div", { class: "portfolioCta" }, [
        pWithDots("portfolioCtaLead", "Have a project in mind? We'd love to hear about it."),
        buttonLink(routes.contact, "Book a consultation", "btn btnPrimary")
      ])
    ])
  ]);
}

export function renderFeatures(): HTMLElement {
  return el("section", { class: "section" }, [
    el("div", { class: "siteContainer" }, [
      el("h1", { class: "sectionTitle featuresIntroTitle" }, ["Everything you need, all in one place."]),
      renderFeaturesSection()
    ])
  ]);
}

export function renderDemo(): HTMLElement {
  return el("section", { class: "section sectionDemo" }, [
    el("div", { class: "siteContainer demoPage" }, [renderDemoSection()])
  ]);
}

export function renderContact(): HTMLElement {
  return el("section", { class: "section sectionContact", "data-scene-root": "true" }, [
    renderAmbientBackdrop(),
    el("div", { class: "siteContainer contactPage" }, [
      el("div", { class: "contactLayout" }, [
        el("div", { class: "contactIntro" }, [
          el("p", { class: "contactEyebrow" }, ["Let's talk"]),
          el("h1", { class: "sectionTitle contactTitle" }, ["Book a consultation"]),
          pWithDots(
            "sectionLead contactLead",
            "Whether you need a website, our CRM, or a custom solution · pick a time and tell us what you're working on. We'll follow up to confirm."
          ),
          el("div", { class: "contactMethods" }, [
            el("a", { href: telHref(), class: "contactMethodCard" }, [
              contactMethodIcon("phone"),
              el("span", { class: "contactMethodText" }, [
                el("span", { class: "contactMethodLabel" }, ["Call us"]),
                el("span", { class: "contactMethodValue" }, [siteConfig.contactPhone])
              ])
            ]),
            el("a", {
              href: mailtoHref(`${siteConfig.productName} consultation`),
              class: "contactMethodCard"
            }, [
              contactMethodIcon("email"),
              el("span", { class: "contactMethodText" }, [
                el("span", { class: "contactMethodLabel" }, ["Email us"]),
                el("span", { class: "contactMethodValue" }, [siteConfig.contactEmail])
              ])
            ])
          ]),
        ]),
        renderContactBooker()
      ])
    ])
  ]);
}

export function renderWebsite(): HTMLElement {
  return el("section", { class: "section sectionWebsite" }, [
    renderFigmaWebsite()
  ]);
}

export function renderAddOns(): HTMLElement {
  return el("section", { class: "section sectionAddOns" }, [
    el("div", { class: "siteContainer" }, [renderAddOnsSection()])
  ]);
}

function formatPrice(amount: number): string {
  return `$${amount}`;
}

function renderPricingCard(tier: (typeof siteConfig.pricingTiers)[number]): HTMLElement {
  const cardClass = tier.featured ? "pricingCard pricingCard--featured" : "pricingCard";
  const list = el("ul", { class: "pricingHighlights" });
  for (const item of tier.highlights) {
    list.append(el("li", {}, [item]));
  }

  const card = el("article", { class: cardClass });
  if (tier.featured) {
    card.append(el("span", { class: "pricingCardBadge" }, ["Most popular"]));
  }
  card.append(
    el("h3", { class: "pricingCardName" }, [tier.name]),
    pWithDots("pricingCardDescription", tier.description),
    el("div", { class: "pricingCardPrice" }, [
      el("span", { class: "pricingAmount" }, [formatPrice(tier.price)]),
      el("span", { class: "pricingPeriod" }, ["/ month"])
    ]),
    list,
    el("button", { type: "button", class: "btn btnPrimary pricingCardCta", disabled: "true" }, [
      "Coming soon"
    ])
  );

  return card;
}

export function renderPricing(): HTMLElement {
  const grid = el("div", { class: "pricingGrid" });
  for (const tier of siteConfig.pricingTiers) {
    grid.append(renderPricingCard(tier));
  }

  return el("section", { class: "section sectionPricing" }, [
    el("div", { class: "siteContainer" }, [
      el("h1", { class: "sectionTitle pricingTitle" }, ["Pricing"]),
      pWithDots("sectionLead pricingLead", siteConfig.pricingIntro),
      el("p", { class: "pricingNotice" }, [siteConfig.pricingNotice]),
      grid
    ])
  ]);
}
