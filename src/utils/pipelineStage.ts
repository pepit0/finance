import type { CrmPipelineStage } from "../types/crm";

export const PIPELINE_STAGE_OPTIONS: { value: CrmPipelineStage; label: string }[] = [
  { value: "fresh_lead", label: "Fresh lead" },
  { value: "contacted", label: "Contacted" },
  { value: "no_contact", label: "No contact" },
  { value: "apped", label: "Apped" },
  { value: "pending_fi", label: "Pending F&I" },
  { value: "sold", label: "Sold" }
];

const PIPELINE_STAGE_LABEL_BY_VALUE = Object.fromEntries(
  PIPELINE_STAGE_OPTIONS.map((opt) => [opt.value, opt.label])
) as Record<CrmPipelineStage, string>;

const VALID_STAGES = new Set<string>(PIPELINE_STAGE_OPTIONS.map((opt) => opt.value));

export function normalizePipelineStage(value: string | null | undefined): CrmPipelineStage {
  const trimmed = String(value ?? "").trim();
  if (VALID_STAGES.has(trimmed)) {
    return trimmed as CrmPipelineStage;
  }
  return "fresh_lead";
}

export function formatPipelineStageDisplay(stage: string | null | undefined): string {
  const normalized = normalizePipelineStage(stage);
  return PIPELINE_STAGE_LABEL_BY_VALUE[normalized];
}

export function pipelineStageBadgeClass(stage: CrmPipelineStage): string {
  switch (stage) {
    case "fresh_lead":
      return "crmPipelineBadgeFresh";
    case "contacted":
      return "crmPipelineBadgeContacted";
    case "no_contact":
      return "crmPipelineBadgeNoContact";
    case "apped":
      return "crmPipelineBadgeApped";
    case "pending_fi":
      return "crmPipelineBadgePendingFi";
    case "sold":
      return "crmPipelineBadgeSold";
    default:
      return "crmPipelineBadgeFresh";
  }
}

export const PIPELINE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All stages" },
  ...PIPELINE_STAGE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))
];
