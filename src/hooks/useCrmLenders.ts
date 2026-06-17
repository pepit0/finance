import { useCallback, useEffect, useState } from "react";
import {
  clearCrmLenderIcon,
  createCrmLender,
  deleteCrmLender,
  fetchCrmLenders,
  updateCrmLender,
  uploadCrmLenderIcon
} from "../lib/crmApi";
import type { CrmLenderConfig, CrmLenderSlug, CrmLenderTier } from "../types/crm";
import { DEFAULT_CRM_LENDERS, sortCrmLenders } from "../utils/crmLenderDefaults";
import { lookupLenderDomainFromName } from "../utils/crmLenderIcon";

export function useCrmLenders() {
  const [lenders, setLenders] = useState<CrmLenderConfig[]>(DEFAULT_CRM_LENDERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlug, setUploadingSlug] = useState<CrmLenderSlug | null>(null);
  const [clearingSlug, setClearingSlug] = useState<CrmLenderSlug | null>(null);
  const [findingSlug, setFindingSlug] = useState<CrmLenderSlug | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<CrmLenderSlug | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchCrmLenders();
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.data.length > 0) {
      setLenders(sortCrmLenders(result.data));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateLabel = useCallback(
    async (slug: CrmLenderSlug, label: string) => {
      setSaving(true);
      setError(null);
      const result = await updateCrmLender(slug, { label });
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

  const updateIconDomain = useCallback(
    async (slug: CrmLenderSlug, iconDomain: string) => {
      setSaving(true);
      setError(null);
      const result = await updateCrmLender(slug, { icon_domain: iconDomain });
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

  const findWebLogo = useCallback(
    async (slug: CrmLenderSlug, label: string) => {
      setFindingSlug(slug);
      setError(null);
      const domain = await lookupLenderDomainFromName(label);
      if (!domain) {
        setFindingSlug(null);
        setError(`Could not find a website logo for "${label.trim()}". Enter a domain manually or upload a PNG.`);
        return false;
      }
      const result = await updateCrmLender(slug, { icon_domain: domain });
      setFindingSlug(null);
      if (result.error) {
        setError(result.error);
        return false;
      }
      await reload();
      return true;
    },
    [reload]
  );

  const uploadIcon = useCallback(
    async (slug: CrmLenderSlug, file: File) => {
      setUploadingSlug(slug);
      setError(null);
      const result = await uploadCrmLenderIcon(slug, file);
      setUploadingSlug(null);
      if (result.error) {
        setError(result.error);
        return false;
      }
      await reload();
      return true;
    },
    [reload]
  );

  const clearIcon = useCallback(
    async (slug: CrmLenderSlug) => {
      setClearingSlug(slug);
      setError(null);
      const result = await clearCrmLenderIcon(slug);
      setClearingSlug(null);
      if (result.error) {
        setError(result.error);
        return false;
      }
      await reload();
      return true;
    },
    [reload]
  );

  const createLender = useCallback(
    async (tier: CrmLenderTier, label: string, iconDomain?: string) => {
      setSaving(true);
      setError(null);

      let resolvedDomain = iconDomain?.trim() ?? "";
      if (!resolvedDomain) {
        const lookedUp = await lookupLenderDomainFromName(label);
        resolvedDomain = lookedUp ?? "";
      }
      if (!resolvedDomain) {
        setSaving(false);
        setError(`Enter a website domain for "${label.trim()}" or use a name that can be matched online.`);
        return false;
      }

      const result = await createCrmLender({
        tier,
        label,
        iconDomain: resolvedDomain,
        existingLenders: lenders
      });
      setSaving(false);
      if (result.error) {
        setError(result.error);
        return false;
      }
      await reload();
      return true;
    },
    [lenders, reload]
  );

  const removeLender = useCallback(
    async (slug: CrmLenderSlug) => {
      setDeletingSlug(slug);
      setError(null);
      const result = await deleteCrmLender(slug);
      setDeletingSlug(null);
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
    lenders,
    loading,
    saving,
    uploadingSlug,
    clearingSlug,
    findingSlug,
    deletingSlug,
    error,
    setError,
    reload,
    updateLabel,
    updateIconDomain,
    findWebLogo,
    uploadIcon,
    clearIcon,
    createLender,
    removeLender
  };
}
