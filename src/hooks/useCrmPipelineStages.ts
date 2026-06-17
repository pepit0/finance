import { useCallback, useEffect, useState } from "react";
import {
  createCrmPipelineStage,
  deleteCrmPipelineStage,
  fetchCrmPipelineStages,
  reorderCrmPipelineStages,
  updateCrmPipelineStage
} from "../lib/crmApi";
import type { CrmPipelineStageConfig } from "../types/crm";
import { DEFAULT_PIPELINE_STAGES, selectablePipelineStages, sortPipelineStages } from "../utils/pipelineStage";

export function useCrmPipelineStages() {
  const [stages, setStages] = useState<CrmPipelineStageConfig[]>(DEFAULT_PIPELINE_STAGES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchCrmPipelineStages();
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.data.length > 0) {
      setStages(result.data);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createStage = useCallback(
    async (label: string, color: string) => {
      setSaving(true);
      setError(null);
      const result = await createCrmPipelineStage({ label, color, existingStages: stages });
      setSaving(false);
      if (result.error) {
        setError(result.error);
        return false;
      }
      await reload();
      return true;
    },
    [reload, stages]
  );

  const updateStageLabel = useCallback(
    async (slug: string, label: string) => {
      setSaving(true);
      setError(null);
      const result = await updateCrmPipelineStage(slug, { label });
      setSaving(false);
      if (result.error) {
        setError(result.error);
        return false;
      }
      await reload();
      return true;
    },
    [reload]
  );

  const updateStageColor = useCallback(
    async (slug: string, color: string) => {
      setSaving(true);
      setError(null);
      const result = await updateCrmPipelineStage(slug, { color });
      setSaving(false);
      if (result.error) {
        setError(result.error);
        return false;
      }
      await reload();
      return true;
    },
    [reload]
  );

  const updateStageRequiresCreditApp = useCallback(
    async (slug: string, requiresCreditApp: boolean) => {
      setSaving(true);
      setError(null);
      const result = await updateCrmPipelineStage(slug, { requires_credit_app: requiresCreditApp });
      setSaving(false);
      if (result.error) {
        setError(result.error);
        return false;
      }
      await reload();
      return true;
    },
    [reload]
  );

  const moveStage = useCallback(
    async (slug: string, direction: "up" | "down") => {
      const ordered = selectablePipelineStages(stages);
      const index = ordered.findIndex((stage) => stage.slug === slug);
      if (index < 0) {
        return false;
      }
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= ordered.length) {
        return false;
      }

      const next = [...ordered];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);

      const lostStage = stages.find((stage) => stage.slug === "lost");
      const orderedSlugs = next.map((stage) => stage.slug);
      if (lostStage) {
        orderedSlugs.push(lostStage.slug);
      }

      setSaving(true);
      setError(null);
      const result = await reorderCrmPipelineStages(orderedSlugs);
      setSaving(false);
      if (result.error) {
        setError(result.error);
        return false;
      }
      await reload();
      return true;
    },
    [reload, stages]
  );

  const deleteStage = useCallback(
    async (slug: string, reassignToSlug?: string) => {
      setSaving(true);
      setError(null);
      const result = await deleteCrmPipelineStage({ slug, reassignToSlug });
      setSaving(false);
      if (result.error) {
        setError(result.error);
        return false;
      }
      await reload();
      return true;
    },
    [reload]
  );

  return {
    stages: sortPipelineStages(stages),
    loading,
    saving,
    error,
    reload,
    createStage,
    updateStageLabel,
    updateStageColor,
    updateStageRequiresCreditApp,
    moveStage,
    deleteStage,
    clearError: () => setError(null)
  };
}
