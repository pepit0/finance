import type { CrmLenderConfig, CrmLenderSlug, CrmLenderTier } from "../types/crm";

type DefaultLenderSeed = {
  slug: CrmLenderSlug;
  tier: CrmLenderTier;
  label: string;
  icon_domain: string;
  sort_order: number;
};

const SEEDS: DefaultLenderSeed[] = [
  { slug: "national_bank", tier: "prime", label: "National Bank", icon_domain: "nbc.ca", sort_order: 10 },
  { slug: "desjardins", tier: "prime", label: "Desjardins", icon_domain: "desjardins.com", sort_order: 20 },
  { slug: "td", tier: "prime", label: "TD", icon_domain: "td.com", sort_order: 30 },
  { slug: "santander_prime", tier: "prime", label: "Santander", icon_domain: "santanderconsumer.ca", sort_order: 40 },
  { slug: "lendcare", tier: "subprime", label: "Lendcare", icon_domain: "lendcare.ca", sort_order: 10 },
  { slug: "prefera", tier: "subprime", label: "Prefera", icon_domain: "preferafinance.com", sort_order: 20 },
  {
    slug: "santander_subprime",
    tier: "subprime",
    label: "Santander",
    icon_domain: "santanderconsumer.ca",
    sort_order: 30
  }
];

export const DEFAULT_CRM_LENDERS: CrmLenderConfig[] = SEEDS.map((seed) => ({
  ...seed,
  custom_icon_path: null
}));

export function sortCrmLenders(lenders: CrmLenderConfig[]): CrmLenderConfig[] {
  return [...lenders].sort((a, b) => {
    if (a.tier !== b.tier) {
      return a.tier === "prime" ? -1 : 1;
    }
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return a.slug.localeCompare(b.slug);
  });
}

export function lendersByTier(lenders: CrmLenderConfig[]) {
  const sorted = sortCrmLenders(lenders);
  return {
    prime: sorted.filter((lender) => lender.tier === "prime"),
    subprime: sorted.filter((lender) => lender.tier === "subprime")
  };
}

export function findCrmLender(lenders: CrmLenderConfig[], slug: CrmLenderSlug): CrmLenderConfig | undefined {
  return lenders.find((lender) => lender.slug === slug);
}

export function slugifyLenderLabel(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return base || "lender";
}

export function uniqueLenderSlug(label: string, lenders: CrmLenderConfig[]): CrmLenderSlug {
  const base = slugifyLenderLabel(label);
  if (!lenders.some((lender) => lender.slug === base)) {
    return base;
  }
  let suffix = 2;
  while (lenders.some((lender) => lender.slug === `${base}_${suffix}`)) {
    suffix += 1;
  }
  return `${base}_${suffix}`;
}

export function nextLenderSortOrder(lenders: CrmLenderConfig[], tier: CrmLenderTier): number {
  const tierLenders = lenders.filter((lender) => lender.tier === tier);
  if (tierLenders.length === 0) {
    return 10;
  }
  return Math.max(...tierLenders.map((lender) => lender.sort_order)) + 10;
}
