import { buttonLink, el, pWithDots } from "./dom";
import { renderFeatureVisual } from "./featureVisuals";
import { renderContactBooker } from "./contactBooker";
import { renderCrmPreview } from "./crmPreview";
import { renderHeroCards } from "./heroCards";
import { routes } from "./layout";
import { mailtoHref, siteConfig, telHref, type AddOnStatus } from "./site.config";

const CONTACT_ICONS = {
  phone: `<svg class="contactMethodIconSvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.6 10.8c1.5 2.9 3.7 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.3 21 3 13.7 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/></svg>`,
  email: `<svg class="contactMethodIconSvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`
} as const;

function contactMethodIcon(kind: keyof typeof CONTACT_ICONS): HTMLSpanElement {
  const icon = el("span", { class: "contactMethodIcon", "aria-hidden": "true" });
  icon.innerHTML = CONTACT_ICONS[kind];
  return icon;
}

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
      renderHeroCards()
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
      el("h1", { class: "sectionTitle" }, ["Everything you need, all in one place."]),
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
      el("div", { class: "demoLayout" }, [
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
        el("div", { class: "demoPreview" }, [renderCrmPreview()])
      ])
    ])
  ]);
}

export function renderContact(): HTMLElement {
  return el("section", { class: "section sectionContact" }, [
    el("div", { class: "siteContainer contactPage" }, [
      el("div", { class: "contactLayout" }, [
        el("div", { class: "contactIntro" }, [
          el("p", { class: "contactEyebrow" }, ["Let's talk"]),
          el("h1", { class: "sectionTitle contactTitle" }, ["Get started"]),
          el("p", { class: "sectionLead contactLead" }, [
            `Interested in ${siteConfig.productName} for your dealership? Book a walkthrough, or reach out directly - we'll show you how it fits your desk.`
          ]),
          el("div", { class: "contactMethods" }, [
            el("a", { href: telHref(), class: "contactMethodCard" }, [
              contactMethodIcon("phone"),
              el("span", { class: "contactMethodText" }, [
                el("span", { class: "contactMethodLabel" }, ["Call us"]),
                el("span", { class: "contactMethodValue" }, [siteConfig.contactPhone])
              ])
            ]),
            el("a", {
              href: mailtoHref(`${siteConfig.productName} inquiry`),
              class: "contactMethodCard"
            }, [
              contactMethodIcon("email"),
              el("span", { class: "contactMethodText" }, [
                el("span", { class: "contactMethodLabel" }, ["Email us"]),
                el("span", { class: "contactMethodValue" }, [siteConfig.contactEmail])
              ])
            ])
          ])
        ]),
        renderContactBooker()
      ])
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
