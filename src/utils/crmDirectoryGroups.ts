import type { CrmDirectoryGroup } from "../types/crm";

export const DEFAULT_DIRECTORY_GROUPS: CrmDirectoryGroup[] = [
  { slug: "general_manager", label: "General Manager", rank: 5, sort_order: 50, is_default: false },
  { slug: "general_sales_manager", label: "General Sales Manager", rank: 4, sort_order: 40, is_default: false },
  { slug: "sales_manager", label: "Sales Manager", rank: 3, sort_order: 30, is_default: false },
  { slug: "finance_manager", label: "Finance Manager", rank: 2, sort_order: 20, is_default: false },
  { slug: "sales", label: "Sales", rank: 1, sort_order: 10, is_default: true }
];

export function sortDirectoryGroups(groups: CrmDirectoryGroup[]): CrmDirectoryGroup[] {
  return [...groups].sort((a, b) => b.rank - a.rank || a.sort_order - b.sort_order || a.label.localeCompare(b.label));
}

export function slugifyDirectoryGroupLabel(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 47);
  return base || "group";
}

export function uniqueDirectoryGroupSlug(label: string, groups: CrmDirectoryGroup[]): string {
  const base = slugifyDirectoryGroupLabel(label);
  if (!groups.some((group) => group.slug === base)) {
    return base;
  }
  let suffix = 2;
  while (groups.some((group) => group.slug === `${base}_${suffix}`)) {
    suffix += 1;
  }
  return `${base}_${suffix}`;
}

export function nextDirectoryGroupRank(groups: CrmDirectoryGroup[]): number {
  if (groups.length === 0) {
    return 1;
  }
  return Math.max(...groups.map((group) => group.rank)) + 1;
}

export function defaultDirectoryGroupSlug(groups: CrmDirectoryGroup[] = DEFAULT_DIRECTORY_GROUPS): string {
  return groups.find((group) => group.is_default)?.slug ?? groups[0]?.slug ?? "sales";
}

export function directoryGroupLabel(
  slug: string | null | undefined,
  groups: CrmDirectoryGroup[] = DEFAULT_DIRECTORY_GROUPS
): string {
  const trimmed = String(slug ?? "").trim();
  if (!trimmed) {
    return "Unassigned";
  }
  return groups.find((group) => group.slug === trimmed)?.label ?? trimmed.replace(/_/g, " ");
}

export function directoryGroupRank(
  slug: string | null | undefined,
  groups: CrmDirectoryGroup[] = DEFAULT_DIRECTORY_GROUPS
): number {
  const trimmed = String(slug ?? "").trim();
  if (!trimmed) {
    return 1;
  }
  return groups.find((group) => group.slug === trimmed)?.rank ?? 1;
}
