import type { CSSProperties } from "react";
import type { CrmPipelineStageConfig } from "../types/crm";
import { normalizeHexColor } from "./crmThemeColor";

export const DEFAULT_PIPELINE_STAGES: CrmPipelineStageConfig[] = [
  {
    slug: "fresh_lead",
    label: "Fresh lead",
    color: "#2563eb",
    sort_order: 10,
    is_system: true,
    is_selectable: true,
    requires_credit_app: false
  },
  {
    slug: "contacted",
    label: "Contacted",
    color: "#2563eb",
    sort_order: 20,
    is_system: false,
    is_selectable: true,
    requires_credit_app: false
  },
  {
    slug: "no_contact",
    label: "No contact",
    color: "#dc2626",
    sort_order: 30,
    is_system: false,
    is_selectable: true,
    requires_credit_app: false
  },
  {
    slug: "apped",
    label: "Apped",
    color: "#16a34a",
    sort_order: 40,
    is_system: false,
    is_selectable: true,
    requires_credit_app: true
  },
  {
    slug: "pending_fi",
    label: "Pending F&I",
    color: "#ca8a04",
    sort_order: 50,
    is_system: false,
    is_selectable: true,
    requires_credit_app: false
  },
  {
    slug: "sold",
    label: "Sold",
    color: "#166534",
    sort_order: 60,
    is_system: false,
    is_selectable: true,
    requires_credit_app: false
  },
  {
    slug: "lost",
    label: "Lost",
    color: "#991b1b",
    sort_order: 70,
    is_system: true,
    is_selectable: false,
    requires_credit_app: false
  }
];

export function pipelineStageBadgeStyle(color: string): CSSProperties {
  const normalized = normalizeHexColor(color);
  if (!normalized) {
    return {};
  }
  return {
    "--crm-pipeline-color": normalized
  } as CSSProperties;
}

export function slugifyPipelineLabel(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
  return base || "stage";
}

export function sortPipelineStages(stages: CrmPipelineStageConfig[]): CrmPipelineStageConfig[] {
  return [...stages].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
}

export function buildPipelineSortRank(stages: CrmPipelineStageConfig[]): Record<string, number> {
  const sorted = sortPipelineStages(stages);
  const rank: Record<string, number> = {};
  sorted.forEach((stage, index) => {
    rank[stage.slug] = index;
  });
  return rank;
}

export function findPipelineStage(
  stages: CrmPipelineStageConfig[],
  slug: string | null | undefined
): CrmPipelineStageConfig | undefined {
  const trimmed = String(slug ?? "").trim();
  if (!trimmed) {
    return undefined;
  }
  return stages.find((stage) => stage.slug === trimmed);
}

export function normalizePipelineStageSlug(
  value: string | null | undefined,
  stages: CrmPipelineStageConfig[] = DEFAULT_PIPELINE_STAGES
): string {
  const trimmed = String(value ?? "").trim();
  if (trimmed && stages.some((stage) => stage.slug === trimmed)) {
    return trimmed;
  }
  if (trimmed && /^[a-z][a-z0-9_]{0,47}$/.test(trimmed)) {
    return trimmed;
  }
  return stages.find((stage) => stage.slug === "fresh_lead")?.slug ?? DEFAULT_PIPELINE_STAGES[0].slug;
}

export function formatPipelineStageLabel(
  slug: string | null | undefined,
  stages: CrmPipelineStageConfig[] = DEFAULT_PIPELINE_STAGES
): string {
  const normalized = normalizePipelineStageSlug(slug, stages);
  return findPipelineStage(stages, normalized)?.label ?? normalized.replace(/_/g, " ");
}

export function selectablePipelineStages(stages: CrmPipelineStageConfig[]): CrmPipelineStageConfig[] {
  return sortPipelineStages(stages).filter((stage) => stage.is_selectable);
}

export function pipelineFilterOptions(stages: CrmPipelineStageConfig[]): { value: string; label: string }[] {
  return [
    { value: "all", label: "All stages" },
    ...selectablePipelineStages(stages).map((stage) => ({ value: stage.slug, label: stage.label }))
  ];
}

export function uniquePipelineSlug(label: string, stages: CrmPipelineStageConfig[]): string {
  const base = slugifyPipelineLabel(label);
  if (!stages.some((stage) => stage.slug === base)) {
    return base;
  }
  let suffix = 2;
  while (stages.some((stage) => stage.slug === `${base}_${suffix}`)) {
    suffix += 1;
  }
  return `${base}_${suffix}`;
}

export function nextPipelineSortOrder(stages: CrmPipelineStageConfig[]): number {
  const selectable = selectablePipelineStages(stages);
  if (selectable.length === 0) {
    return 10;
  }
  return Math.max(...selectable.map((stage) => stage.sort_order)) + 10;
}
