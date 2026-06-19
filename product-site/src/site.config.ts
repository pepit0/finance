import type { FeatureVisualId } from "./featureVisuals";

export type SiteFeature = {
  title: string;
  description: string;
  visualId: FeatureVisualId;
};

export type AddOnStatus = "available" | "coming-soon";

export type SiteAddOn = {
  title: string;
  description: string;
  status: AddOnStatus;
};

export type PricingTier = {
  name: string;
  description: string;
  price: number;
  highlights: string[];
  featured?: boolean;
};

export type SiteConfig = {
  productName: string;
  tagline: string;
  description: string;
  demoUrl: string;
  contactEmail: string;
  contactPhone: string;
  features: SiteFeature[];
  addOnsIntro: string;
  coreProductDescription: string;
  addOns: SiteAddOn[];
  pricingIntro: string;
  pricingNotice: string;
  pricingTiers: PricingTier[];
};

/** Edit this file to rebrand the whole site. Optional Vercel env: VITE_DEMO_URL, VITE_CONTACT_EMAIL */
const defaults: SiteConfig = {
  productName: "Tempt CRM",
  tagline: "Customer management built for your business",
  description:
    "Track leads, customers, calls, and your team in one place. White-label branding on your own domain · no enterprise bloat.",
  demoUrl: "https://demo.sharifian.cfd/crm",
  contactEmail: "hello@example.com",
  contactPhone: "(587) 205-5773",
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
      title: "White-label branding",
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
    "Start with Tempt CRM, then add what you need. Each add-on connects to the same customer records your team already uses · no duplicate entry, no disconnected tools.",
  coreProductDescription:
    "Your foundation — pipeline, customers, team directory, and white-label branding. Tempt CRM is included with every deployment · add-ons extend it when you're ready.",
  addOns: [
    {
      title: "Call & text",
      status: "available",
      description:
        "Make and receive calls, send texts, and log every conversation inside the CRM. Recordings and threads stay tied to the customer · no app-hopping on the lot."
    },
    {
      title: "Dealer website",
      status: "coming-soon",
      description:
        "A modern dealer site built to feed your pipeline. Full credit applications and quick partial leads flow straight into the CRM · so your team can follow up while the lead is still hot."
    },
    {
      title: "DMS",
      status: "coming-soon",
      description:
        "Inventory, deals, and back-office in one place. Integrates with Tempt CRM and your dealer website for a seamless flow from first click to sold unit · one connected stack for the independent dealer."
    }
  ],
  pricingIntro:
    "Simple pricing for independent dealers. Start with the CRM, add capabilities when you need them · no long contracts or hidden fees.",
  pricingNotice: "Pricing coming soon — figures below are placeholders while we finalize plans.",
  pricingTiers: [
    {
      name: "Tempt CRM",
      description: "Core platform for your desk team.",
      price: 0,
      highlights: [
        "Pipeline & customer profiles",
        "Team directory & permissions",
        "White-label branding",
        "Mobile-friendly access"
      ]
    },
    {
      name: "CRM + Call & text",
      description: "Everything in CRM, plus voice and SMS.",
      price: 0,
      featured: true,
      highlights: [
        "Everything in Tempt CRM",
        "Inbound & outbound calling",
        "SMS threads in the CRM",
        "Call recordings & logs"
      ]
    },
    {
      name: "Dealer stack",
      description: "CRM, communications, website, and DMS — connected.",
      price: 0,
      highlights: [
        "Everything in CRM + Call & text",
        "Dealer website with lead capture",
        "Full & partial apps to CRM",
        "DMS integration (coming soon)"
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
