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
  price: number;
  highlights: string[];
  featured?: boolean;
};

export type HeroDifferentiatorIcon = "support" | "design" | "updates" | "custom" | "dealers";

export type HeroDifferentiator = {
  title: string;
  blurb: string;
  detail: string;
  icon: HeroDifferentiatorIcon;
};

export type HeroTagline = {
  /** Text before the rotating word, e.g. "Customer management built for your" */
  before: string;
  /** Words to cycle through on the home page hero */
  rotatingWords: string[];
  /** How long each word stays visible (ms). Default 2800. */
  intervalMs?: number;
};

export type SiteConfig = {
  productName: string;
  heroTagline: HeroTagline;
  description: string;
  demoUrl: string;
  contactEmail: string;
  contactPhone: string;
  heroDifferentiators: HeroDifferentiator[];
  features: SiteFeature[];
  addOnsIntro: string;
  addOnProcessSteps: AddOnProcessStep[];
  customAddOnExamples: CustomAddOnExample[];
  addOnsClosing: string;
  pricingIntro: string;
  pricingNotice: string;
  pricingTiers: PricingTier[];
};

/** Edit this file to rebrand the whole site. Optional Vercel env: VITE_DEMO_URL, VITE_CONTACT_EMAIL */
const defaults: SiteConfig = {
  productName: "Tempt CRM",
  heroTagline: {
    before: "Customer management built for your",
    rotatingWords: ["business", "dealership", "company", "enterprise"],
    intervalMs: 5800
  },
  description:
    "Track leads, customers, calls, and your team in one place. Your branding on your own domain · no enterprise bloat.",
  demoUrl: "https://demo.sharifian.cfd/crm",
  contactEmail: "info@tempt.com",
  contactPhone: "(587) 205-5773",
  heroDifferentiators: [
    {
      title: "24/7 support",
      blurb: "Real humans when you need them",
      detail: "Questions at 9pm on a Saturday? We're here! Give us a ring. Our customers get put on an emergency call list.",
      icon: "support"
    },
    {
      title: "Modern design",
      blurb: "Clean, fast, built for today",
      detail: "A CRM that feels current. Not like software from a decade ago.",
      icon: "design"
    },
    {
      title: "Constant updates",
      blurb: "Always getting better",
      detail: "New features and fixes ship regularly so your desk stays ahead.",
      icon: "updates"
    },
    {
      title: "Customizability",
      blurb: "Your brand, your workflow",
      detail: "Logo, colors, pipeline stages, and permissions. All tuned to your store.",
      icon: "custom"
    },
    {
      title: "Built by dealers for dealers",
      blurb: "Finance Directors & General Managers",
      detail: "Our team consists of dealership veterans who understand what you need. If you're not a dealer, we can still help out.",
      icon: "dealers"
    }
  ],
  features: [
    {
      title: "Pipeline & customers",
      visualId: "pipeline",
      description:
        "Pipeline stages, customer profiles, edit history, and tasks · everything your floor team needs in one view."
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
        "Your logo, colors, and header copy. Deploy on crm.yourdealership.com · it looks like yours, not ours."
    },
    {
      title: "Lead alerts",
      visualId: "alerts",
      description:
        "Stale-lead notifications and system leads from your website funnel when you connect marketing later."
    },
    {
      title: "Works on mobile",
      visualId: "mobile",
      description:
        "Responsive CRM with optional add-to-home-screen for quick access on the lot."
    }
  ],
  addOnsIntro:
    "Your business doesn't run like everyone else's. We build custom add-ons that plug straight into Tempt CRM · tailored to your workflow, your tools, and your team.",
  addOnProcessSteps: [
    {
      title: "Share your workflow",
      description:
        "Tell us what's slow, manual, or spread across too many apps. We map it together on a call and figure out what would actually help your desk."
    },
    {
      title: "We build it for you",
      description:
        "Custom add-ons connect to the same customer records your team already uses. No duplicate entry, no disconnected tools."
    },
    {
      title: "Launch and refine",
      description:
        "We ship alongside your CRM and adjust as your business grows. You get something built for your store, not a generic feature shelf."
    }
  ],
  customAddOnExamples: [
    {
      title: "Custom lead routing",
      description:
        "Auto-assign leads by source, location, salesperson, or rules your GM sets · so the right person follows up first."
    },
    {
      title: "Third-party integrations",
      description:
        "Connect lenders, marketing platforms, inventory feeds, or tools you already pay for into one place your team actually uses."
    },
    {
      title: "Desk-specific dashboards",
      description:
        "Reports and views built for how your finance office or BDC measures success · not generic charts you'll never open."
    },
    {
      title: "Automated follow-ups",
      description:
        "Reminders, task rules, and triggers tuned to your pipeline stages so nothing slips through on a busy Saturday."
    },
    {
      title: "One-off workflows",
      description:
        "Credit app handoffs, approval tracking, internal checklists · if your store does it differently, we can build around it."
    },
    {
      title: "Whatever you need",
      description:
        "No catalog to pick from. Bring us a problem and we'll tell you honestly what's possible, what it costs, and how it fits your CRM."
    }
  ],
  addOnsClosing:
    "Have something in mind? Book a free consultation or reach out · we'll scope it with you before we build anything.",
  pricingIntro:
    "Simple pricing for independent dealers. Start with the CRM, add capabilities when you need them · no long contracts or hidden fees.",
  pricingNotice: "Month to month billing, no contract required. Cancel anytime.",
  pricingTiers: [
    {
      name: "Complete CRM",
      description: "Core platform for your desk team. Comes with constant updates and support.",
      price: 999,
      highlights: [
        "Pipeline & customer profiles",
        "Team directory & permissions",
        "White-label branding",
        "Mobile-friendly access"
      ]
    },
    {
      name: "CRM + Website",
      description: "Everything in CRM, plus a website. Connective functionality.",
      price: 1999,
      featured: true,
      highlights: [
        "Everything in Complete CRM",
        "Brand themed website",
        "Application lead system",
        "Connectivity between both"
      ]
    },
    {
      name: "CRM, Website & DMS",
      description: "CRM, website, and DMS · all connected together.",
      price: 2999,
      highlights: [
        "Everything in CRM + Website",
        "DMS integration (coming soon)",
        "Request company specific features",
        "Everything connected together"
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
