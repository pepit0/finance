import type { FeatureVisualId } from "./featureVisuals";

export type SiteFeature = {
  title: string;
  description: string;
  visualId: FeatureVisualId;
};

export type CustomAddOnExample = {
  title: string;
  description: string;
};

export type AddOnProcessStep = {
  title: string;
  description: string;
};

export type PricingTier = {
  name: string;
  description: string;
  idealFor: string;
  priceLabel: string;
  highlights: string[];
  featured?: boolean;
};

export type PricingValue = {
  title: string;
  description: string;
};

export type PortfolioProject = {
  name: string;
  url: string;
  description: string;
  status: "live" | "in-progress";
};

export type HeroDifferentiatorIcon = "support" | "design" | "updates" | "custom" | "ai";

export type HeroDifferentiator = {
  title: string;
  blurb: string;
  detail: string;
  icon: HeroDifferentiatorIcon;
};

export type HeroTagline = {
  /** Text before the rotating word */
  before: string;
  /** Words to cycle through on the home page hero */
  rotatingWords: string[];
  /** How long each word stays visible (ms). Default 2800. */
  intervalMs?: number;
};

export type SiteConfig = {
  productName: string;
  companyTagline: string;
  heroTagline: HeroTagline;
  description: string;
  demoUrl: string;
  contactEmail: string;
  contactPhone: string;
  socialInstagramUrl: string;
  socialFacebookUrl: string;
  heroDifferentiators: HeroDifferentiator[];
  portfolioProjects: PortfolioProject[];
  features: SiteFeature[];
  addOnsIntro: string;
  addOnProcessSteps: AddOnProcessStep[];
  customAddOnExamples: CustomAddOnExample[];
  addOnsClosing: string;
  pricingIntro: string;
  pricingFlexMessage: string;
  pricingNotice: string;
  pricingValues: PricingValue[];
  pricingTiers: PricingTier[];
};

/** Edit this file to rebrand the whole site. Optional Vercel env: VITE_DEMO_URL, VITE_CONTACT_EMAIL */
const defaults: SiteConfig = {
  productName: "Feath",
  companyTagline: "Business solutions that convert",
  heroTagline: {
    before: "Solutions for your",
    rotatingWords: ["business", "team", "customers", "growth"],
    intervalMs: 5800
  },
  description:
    "We develop business solutions that help you convert more customers and never miss a lead · CRM, AI-integrated websites, and custom builds tailored to how you work.",
  demoUrl: "https://demo.sharifian.cfd/crm",
  contactEmail: "info@feath.xyz",
  contactPhone: "(587) 400-0985",
  socialInstagramUrl: "https://instagram.com/feath.ai",
  socialFacebookUrl: "",
  heroDifferentiators: [
    {
      title: "AI-integrated",
      blurb: "Smart websites that work for you",
      detail: "Custom sites with AI built in · capture leads, answer questions, and guide visitors toward becoming customers.",
      icon: "ai"
    },
    {
      title: "Never miss a lead",
      blurb: "Every inquiry captured",
      detail: "Forms, calls, and follow-ups flow into one system so nothing slips through when you're busy.",
      icon: "custom"
    },
    {
      title: "24/7 support",
      blurb: "Real humans when you need them",
      detail: "Questions on a weekend? We're here. Our customers get direct access when something matters.",
      icon: "support"
    },
    {
      title: "Modern design",
      blurb: "Clean, fast, built for today",
      detail: "Products that feel current · not software from a decade ago.",
      icon: "design"
    },
    {
      title: "Constant updates",
      blurb: "Always getting better",
      detail: "New features and fixes ship regularly so your tools stay ahead of the curve.",
      icon: "updates"
    }
  ],
  portfolioProjects: [
    {
      name: "Kamr.app",
      url: "https://kamr.app",
      description:
        "Gathering app for events of every size · create an event, share a link or QR, and invite guests instantly with no download required.",
      status: "live"
    },
    {
      name: "Burdapp.com",
      url: "https://burdapp.com",
      description: "Marketing site for our birding app · clean product storytelling and lead capture for early adopters.",
      status: "live"
    },
    {
      name: "Temptmotorsports.com",
      url: "https://temptmotorsports.com",
      description: "Motorsports brand website · service pages, contact forms, and a polished web presence on their own domain.",
      status: "live"
    }
  ],
  features: [
    {
      title: "Pipeline & customers",
      visualId: "pipeline",
      description:
        "Pipeline stages, customer profiles, edit history, and tasks · everything your team needs in one view."
    },
    {
      title: "Calls & text messages",
      visualId: "comms",
      description:
        "Log calls, SMS threads, and recordings. Stay on top of every conversation without switching apps."
    },
    {
      title: "Team & permissions",
      visualId: "team",
      description:
        "Directory, roles, and position-based access so the right people see the right customers."
    },
    {
      title: "Your company branding",
      visualId: "branding",
      description:
        "Your logo, colors, and header copy. Deploy on your own domain · it looks like yours, not ours."
    },
    {
      title: "Lead alerts",
      visualId: "alerts",
      description:
        "Stale-lead notifications and system leads from your website funnel when you connect marketing."
    },
    {
      title: "Works on mobile",
      visualId: "mobile",
      description:
        "Responsive CRM with optional add-to-home-screen for quick access on the go."
    }
  ],
  addOnsIntro:
    "Your business doesn't run like everyone else's. We build custom add-ons that plug straight into Feath CRM · tailored to your workflow, your tools, and your team.",
  addOnProcessSteps: [
    {
      title: "Share your workflow",
      description:
        "Tell us what's slow, manual, or spread across too many apps. We map it together on a call and figure out what would actually help your team."
    },
    {
      title: "We build it for you",
      description:
        "Custom add-ons connect to the same customer records your team already uses. No duplicate entry, no disconnected tools."
    },
    {
      title: "Launch and refine",
      description:
        "We ship alongside your CRM and adjust as your business grows. You get something built for you, not a generic feature shelf."
    }
  ],
  customAddOnExamples: [
    {
      title: "Custom lead routing",
      description:
        "Auto-assign leads by source, location, salesperson, or rules you set · so the right person follows up first."
    },
    {
      title: "Third-party integrations",
      description:
        "Connect marketing platforms, inventory feeds, payment tools, or apps you already use into one place your team actually opens."
    },
    {
      title: "Custom dashboards",
      description:
        "Reports and views built for how your team measures success · not generic charts you'll never open."
    },
    {
      title: "Automated follow-ups",
      description:
        "Reminders, task rules, and triggers tuned to your pipeline stages so nothing slips through on a busy day."
    },
    {
      title: "One-off workflows",
      description:
        "Approval tracking, internal checklists, handoff flows · if your business does it differently, we can build around it."
    },
    {
      title: "Whatever you need",
      description:
        "No catalog to pick from. Bring us a problem and we'll tell you honestly what's possible, what it costs, and how it fits."
    }
  ],
  addOnsClosing:
    "Have something in mind? Book a free consultation or reach out · we'll scope it with you before we build anything.",
  pricingIntro:
    "We build custom websites for small and growing businesses. Whether you're just getting started or scaling up, we'll find a monthly number that works for you.",
  pricingFlexMessage:
    "Need a site first? Start there. Want leads to flow into a CRM? Add it on. We'll put a plan together on a quick call.",
  pricingNotice: "Month to month. No contract. Cancel anytime.",
  pricingValues: [
    {
      title: "Small & growing teams",
      description: "Local shops, growing dealerships, clinics scaling up. A real website on your domain, not a template."
    },
    {
      title: "Website first, CRM when ready",
      description: "Launch your site now. Add our CRM later when you want every lead tracked in one place."
    },
    {
      title: "Talk to real people",
      description: "You get our team directly. Not a support ticket black hole."
    }
  ],
  pricingTiers: [
    {
      name: "Website",
      description: "A custom site on your domain. Fast, modern, and built to turn visitors into inquiries.",
      idealFor: "Businesses that need a real web presence",
      priceLabel: "Tailored monthly plan",
      highlights: [
        "Custom design for your brand",
        "Contact & lead forms",
        "Mobile-friendly",
        "Your domain, your look"
      ]
    },
    {
      name: "Website + CRM",
      description: "Your site plus our CRM add-on. Every form fill and inquiry lands where your team can follow up.",
      idealFor: "Owners who don't want leads sitting in an inbox",
      priceLabel: "Bundle pricing on request",
      featured: true,
      highlights: [
        "Everything in Website",
        "Feath CRM add-on",
        "Leads sync automatically",
        "Pipeline, calls & texts"
      ]
    },
    {
      name: "Full growth stack",
      description: "Website, CRM, and custom add-ons wired together for how your business actually runs.",
      idealFor: "One partner for site, follow-up, and custom workflows",
      priceLabel: "Scoped on a call",
      highlights: [
        "Everything in Website + CRM",
        "Custom workflows",
        "Priority support",
        "One invoice"
      ]
    }
  ]
};

function envOverride(key: string, fallback: string): string {
  const value = import.meta.env[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export const siteConfig: SiteConfig = {
  ...defaults,
  demoUrl: envOverride("VITE_DEMO_URL", defaults.demoUrl),
  contactEmail: envOverride("VITE_CONTACT_EMAIL", defaults.contactEmail),
  contactPhone: envOverride("VITE_CONTACT_PHONE", defaults.contactPhone)
};

export function mailtoHref(subject?: string): string {
  const params = new URLSearchParams();
  if (subject) {
    params.set("subject", subject);
  }
  const query = params.toString();
  return `mailto:${siteConfig.contactEmail}${query ? `?${query}` : ""}`;
}

export function telHref(): string {
  const digits = siteConfig.contactPhone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `tel:+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `tel:+${digits}`;
  }
  return `tel:${digits ? `+${digits}` : siteConfig.contactPhone}`;
}

/** Internal team board URL (alt-click logo on the website home page). */
export function feathBoardUrl(): string {
  return "/feath-board/";
}

/** Formspree form id (from formspree.io → Integration → endpoint …/f/xyz). Set VITE_FORMSPREE_FORM_ID on Vercel. */
export function formspreeEndpoint(): string | null {
  const raw = envOverride("VITE_FORMSPREE_FORM_ID", "");
  if (!raw) {
    return null;
  }
  if (raw.startsWith("https://")) {
    return raw.replace(/\/$/, "");
  }
  return `https://formspree.io/f/${raw}`;
}
