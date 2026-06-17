import { useCallback, useEffect, useState } from "react";
import {
  createCrmDirectoryGroup,
  deleteCrmDirectoryGroup,
  fetchCrmDirectoryGroups,
  setCrmDirectoryDefaultGroup,
  updateCrmDirectoryGroup
} from "../lib/crmApi";
import type { CrmDirectoryGroup } from "../types/crm";
import { DEFAULT_DIRECTORY_GROUPS, sortDirectoryGroups } from "../utils/crmDirectoryGroups";

export function useCrmDirectoryGroups() {
  const [groups, setGroups] = useState<CrmDirectoryGroup[]>(DEFAULT_DIRECTORY_GROUPS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableAvailable, setTableAvailable] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchCrmDirectoryGroups();
    setLoading(false);
    setTableAvailable(result.tableAvailable);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.data.length > 0) {
      setGroups(sortDirectoryGroups(result.data));
    } else if (!result.tableAvailable) {
      setGroups(sortDirectoryGroups(DEFAULT_DIRECTORY_GROUPS));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createGroup = useCallback(
    async (label: string) => {
      setSaving(true);
      setError(null);
      const result = await createCrmDirectoryGroup({ label, existingGroups: groups });
      setSaving(false);
      if (result.error) {
        setError(result.error);
        return false;
      }
      await reload();
      return true;
    },
    [groups, reload]
  );

  const updateGroupLabel = useCallback(
    async (slug: string, label: string) => {
      setSaving(true);
      setError(null);
      const result = await updateCrmDirectoryGroup(slug, { label });
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

  const moveGroup = useCallback(
    async (slug: string, direction: "up" | "down") => {
      const ordered = sortDirectoryGroups(groups);
      const index = ordered.findIndex((group) => group.slug === slug);
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

      setSaving(true);
      setError(null);
      const updates = await Promise.all(
        next.map((group, rankIndex) =>
          updateCrmDirectoryGroup(group.slug, {
            rank: next.length - rankIndex,
            sort_order: (rankIndex + 1) * 10
          })
        )
      );
      setSaving(false);
      const failed = updates.find((result) => result.error);
      if (failed?.error) {
        setError(failed.error);
        return false;
      }
      await reload();
      return true;
    },
    [groups, reload]
  );

  const deleteGroup = useCallback(
    async (slug: string, reassignToSlug?: string) => {
      setSaving(true);
      setError(null);
      const result = await deleteCrmDirectoryGroup({ slug, reassignToSlug });
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

  const setDefaultGroup = useCallback(
    async (slug: string) => {
      setSaving(true);
      setError(null);
      const result = await setCrmDirectoryDefaultGroup(slug);
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
    groups: sortDirectoryGroups(groups),
    loading,
    saving,
    error,
    tableAvailable,
    reload,
    createGroup,
    updateGroupLabel,
    moveGroup,
    deleteGroup,
    setDefaultGroup,
    clearError: () => setError(null)
  };
}
