import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import type { CrmPipelineStageConfig } from "../types/crm";
import { useCrmPipelineStages } from "../hooks/useCrmPipelineStages";
import {
  buildPipelineSortRank,
  findPipelineStage,
  formatPipelineStageLabel,
  pipelineFilterOptions,
  pipelineStageBadgeStyle,
  selectablePipelineStages,
  sortPipelineStages
} from "../utils/pipelineStage";

export type CrmPipelineStagesContextValue = {
  stages: CrmPipelineStageConfig[];
  selectableStages: CrmPipelineStageConfig[];
  filterOptions: { value: string; label: string }[];
  sortRank: Record<string, number>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  reload: () => Promise<void>;
  formatLabel: (slug: string | null | undefined) => string;
  badgeStyle: (slug: string | null | undefined) => CSSProperties;
  getStage: (slug: string | null | undefined) => CrmPipelineStageConfig | undefined;
  createStage: (label: string, color: string) => Promise<boolean>;
  updateStageLabel: (slug: string, label: string) => Promise<boolean>;
  updateStageColor: (slug: string, color: string) => Promise<boolean>;
  updateStageRequiresCreditApp: (slug: string, requiresCreditApp: boolean) => Promise<boolean>;
  moveStage: (slug: string, direction: "up" | "down") => Promise<boolean>;
  deleteStage: (slug: string, reassignToSlug?: string) => Promise<boolean>;
  clearError: () => void;
};

const CrmPipelineStagesContext = createContext<CrmPipelineStagesContextValue | null>(null);

export function CrmPipelineStagesProvider({ children }: { children: ReactNode }) {
  const pipeline = useCrmPipelineStages();
  const stages = sortPipelineStages(pipeline.stages);
  const selectable = selectablePipelineStages(stages);

  const value: CrmPipelineStagesContextValue = {
    stages,
    selectableStages: selectable,
    filterOptions: pipelineFilterOptions(stages),
    sortRank: buildPipelineSortRank(stages),
    loading: pipeline.loading,
    saving: pipeline.saving,
    error: pipeline.error,
    reload: pipeline.reload,
    formatLabel: (slug) => formatPipelineStageLabel(slug, stages),
    badgeStyle: (slug) => {
      const stage = findPipelineStage(stages, slug);
      return pipelineStageBadgeStyle(stage?.color ?? "#2563eb");
    },
    getStage: (slug) => findPipelineStage(stages, slug),
    createStage: pipeline.createStage,
    updateStageLabel: pipeline.updateStageLabel,
    updateStageColor: pipeline.updateStageColor,
    updateStageRequiresCreditApp: pipeline.updateStageRequiresCreditApp,
    moveStage: pipeline.moveStage,
    deleteStage: pipeline.deleteStage,
    clearError: pipeline.clearError
  };

  return <CrmPipelineStagesContext.Provider value={value}>{children}</CrmPipelineStagesContext.Provider>;
}

export function useCrmPipelineStagesContext(): CrmPipelineStagesContextValue {
  const context = useContext(CrmPipelineStagesContext);
  if (!context) {
    throw new Error("useCrmPipelineStagesContext must be used within CrmPipelineStagesProvider");
  }
  return context;
}
