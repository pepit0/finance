import { buttonLink, el, pWithDots } from "./dom";
import { renderFeatureVisual } from "./featureVisuals";
import { renderCrmPreview } from "./crmPreview";
import { routes } from "./layout";
import { mailtoHref, siteConfig, type AddOnStatus } from "./site.config";

export function renderHero(): HTMLElement {
  return el("section", { class: "hero" }, [
    el("div", { class: "siteContainer heroLayout" }, [
      el("div", { class: "heroContent" }, [
        el("p", { class: "heroEyebrow" }, ["For independent dealers & businesses"]),
        el("h1", { class: "heroTitle" }, [siteConfig.tagline]),
        pWithDots("heroDescription", siteConfig.description),
        el("div", { class: "heroActions" }, [
          buttonLink(routes.demo, "Book live demo", "btn btnPrimary"),
          buttonLink(routes.contact, "Contact us", "btn btnSecondary")
        ])
      ]),
      el("div", { class: "heroCarousel", "aria-label": "Product screenshots" }, [
        el("div", { class: "heroCarouselFrame" })
      ])
    ])
  ]);
}

export function renderFeatures(): HTMLElement {
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

  return el("section", { class: "section" }, [
    el("div", { class: "siteContainer" }, [
      el("h1", { class: "sectionTitle" }, ["Everything you need to run the desk."]),
      pWithDots(
        "sectionLead",
        `${siteConfig.productName} focuses on customers, communication, and your team · not features you'll never use.`
      ),
      grid
    ])
  ]);
}

export function renderDemo(): HTMLElement {
  return el("section", { class: "section sectionDemo" }, [
    el("div", { class: "siteContainer demoPage" }, [
      el("div", { class: "demoIntro" }, [
        el("h1", { class: "sectionTitle" }, ["Book live demo"]),
        pWithDots(
          "sectionLead",
          "Schedule a video call with our team. We'll share our screen and walk you through how the system works and why it will benefit your company."
        ),
        el("div", { class: "heroActions" }, [
          el("button", { type: "button", class: "btn btnPrimary btnLarge" }, ["Book live demo"]),
          buttonLink(routes.features, "See more features", "btn btnSecondary btnLarge")
        ])
      ]),
      renderCrmPreview()
    ])
  ]);
}

export function renderContact(): HTMLElement {
  return el("section", { class: "section" }, [
    el("div", { class: "siteContainer contactInner" }, [
      el("h1", { class: "sectionTitle" }, ["Get started"]),
      el("p", { class: "sectionLead" }, [
        `Interested in ${siteConfig.productName} for your dealership? Send us an email and we'll set up a walkthrough.`
      ]),
      buttonLink(
        mailtoHref(`${siteConfig.productName} inquiry`),
        `Email ${siteConfig.contactEmail}`,
        "btn btnPrimary btnLarge"
      )
    ])
  ]);
}

function addOnBadge(status: AddOnStatus): HTMLSpanElement {
  const label = status === "available" ? "Available" : "Coming soon";
  return el("span", { class: `addonBadge addonBadge--${status}` }, [label]);
}

export function renderAddOns(): HTMLElement {
  const addOnGrid = el("div", { class: "addonGrid" });
  for (const addOn of siteConfig.addOns) {
    addOnGrid.append(
      el("article", { class: "addonCard" }, [
        el("div", { class: "addonCardHeader" }, [
          el("h3", { class: "addonTitle" }, [addOn.title]),
          addOnBadge(addOn.status)
        ]),
        pWithDots("addonDescription", addOn.description)
      ])
    );
  }

  return el("section", { class: "section" }, [
    el("div", { class: "siteContainer" }, [
      el("h1", { class: "sectionTitle" }, ["Add-ons"]),
      pWithDots("sectionLead", siteConfig.addOnsIntro),
      el("article", { class: "addonCore" }, [
        el("div", { class: "addonCardHeader" }, [
          el("h2", { class: "addonCoreTitle" }, [siteConfig.productName]),
          el("span", { class: "addonBadge addonBadge--core" }, ["Included"])
        ]),
        pWithDots("addonDescription", siteConfig.coreProductDescription)
      ]),
      el("h2", { class: "addonSectionHeading" }, ["CRM add-ons"]),
      addOnGrid
    ])
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
    el("p", { class: "pricingCardDescription" }, [tier.description]),
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
