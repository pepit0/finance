import type { CrmPipelineStageConfig } from "../types/crm";
import {
  buildPipelineSortRank,
  DEFAULT_PIPELINE_STAGES,
  findPipelineStage,
  formatPipelineStageLabel,
  normalizePipelineStageSlug,
  pipelineFilterOptions,
  selectablePipelineStages,
  sortPipelineStages
} from "./pipelineStageConfig";

/** @deprecated Use pipelineStageConfig helpers with loaded stages from context. */
export const PIPELINE_STAGE_OPTIONS = selectablePipelineStages(DEFAULT_PIPELINE_STAGES).map((stage) => ({
  value: stage.slug,
  label: stage.label
}));

/** @deprecated Use pipelineStageConfig helpers with loaded stages from context. */
export const PIPELINE_FILTER_OPTIONS = pipelineFilterOptions(DEFAULT_PIPELINE_STAGES);

/** @deprecated Use pipelineStageConfig helpers with loaded stages from context. */
export const PIPELINE_SORT_RANK = buildPipelineSortRank(DEFAULT_PIPELINE_STAGES);

export function normalizePipelineStage(
  value: string | null | undefined,
  stages: CrmPipelineStageConfig[] = DEFAULT_PIPELINE_STAGES
): string {
  return normalizePipelineStageSlug(value, stages);
}

export function formatPipelineStageDisplay(
  stage: string | null | undefined,
  stages: CrmPipelineStageConfig[] = DEFAULT_PIPELINE_STAGES
): string {
  return formatPipelineStageLabel(stage, stages);
}

/** Legacy class names for built-in stages; prefer inline styles from pipelineStageBadgeStyle. */
export function pipelineStageBadgeClass(stage: string): string {
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
    case "lost":
      return "crmPipelineBadgeLost";
    default:
      return "crmPipelineBadgeCustom";
  }
}

export {
  buildPipelineSortRank,
  DEFAULT_PIPELINE_STAGES,
  findPipelineStage,
  formatPipelineStageLabel,
  normalizePipelineStageSlug,
  pipelineFilterOptions,
  pipelineStageBadgeStyle,
  selectablePipelineStages,
  sortPipelineStages,
  slugifyPipelineLabel,
  uniquePipelineSlug,
  nextPipelineSortOrder
} from "./pipelineStageConfig";
