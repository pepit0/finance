import { createContext, useContext, type ReactNode } from "react";
import type { CrmLenderConfig, CrmLenderSlug, CrmLenderTier } from "../types/crm";
import { useCrmLenders } from "../hooks/useCrmLenders";
import { findCrmLender, lendersByTier } from "../utils/crmLenderDefaults";

export type CrmLendersContextValue = {
  lenders: CrmLenderConfig[];
  primeLenders: CrmLenderConfig[];
  subprimeLenders: CrmLenderConfig[];
  financeEnabled: boolean;
  loading: boolean;
  saving: boolean;
  financeSaving: boolean;
  uploadingSlug: CrmLenderSlug | null;
  clearingSlug: CrmLenderSlug | null;
  findingSlug: CrmLenderSlug | null;
  deletingSlug: CrmLenderSlug | null;
  error: string | null;
  reload: () => Promise<void>;
  getLender: (slug: CrmLenderSlug) => CrmLenderConfig | undefined;
  updateLabel: (slug: CrmLenderSlug, label: string) => Promise<boolean>;
  updateIconDomain: (slug: CrmLenderSlug, iconDomain: string) => Promise<boolean>;
  findWebLogo: (slug: CrmLenderSlug, label: string) => Promise<boolean>;
  uploadIcon: (slug: CrmLenderSlug, file: File) => Promise<boolean>;
  clearIcon: (slug: CrmLenderSlug) => Promise<boolean>;
  createLender: (tier: CrmLenderTier, label: string, iconDomain?: string) => Promise<boolean>;
  removeLender: (slug: CrmLenderSlug) => Promise<boolean>;
  setFinanceEnabledForOrg: (enabled: boolean) => Promise<boolean>;
  clearError: () => void;
};

const CrmLendersContext = createContext<CrmLendersContextValue | null>(null);

export function CrmLendersProvider({ children }: { children: ReactNode }) {
  const lendersState = useCrmLenders();
  const tierGroups = lendersByTier(lendersState.lenders);

  const value: CrmLendersContextValue = {
    lenders: lendersState.lenders,
    primeLenders: tierGroups.prime,
    subprimeLenders: tierGroups.subprime,
    financeEnabled: lendersState.financeEnabled,
    loading: lendersState.loading,
    saving: lendersState.saving,
    financeSaving: lendersState.financeSaving,
    uploadingSlug: lendersState.uploadingSlug,
    clearingSlug: lendersState.clearingSlug,
    findingSlug: lendersState.findingSlug,
    deletingSlug: lendersState.deletingSlug,
    error: lendersState.error,
    reload: lendersState.reload,
    getLender: (slug) => findCrmLender(lendersState.lenders, slug),
    updateLabel: lendersState.updateLabel,
    updateIconDomain: lendersState.updateIconDomain,
    findWebLogo: lendersState.findWebLogo,
    uploadIcon: lendersState.uploadIcon,
    clearIcon: lendersState.clearIcon,
    createLender: lendersState.createLender,
    removeLender: lendersState.removeLender,
    setFinanceEnabledForOrg: lendersState.setFinanceEnabledForOrg,
    clearError: () => lendersState.setError(null)
  };

  return <CrmLendersContext.Provider value={value}>{children}</CrmLendersContext.Provider>;
}

export function useCrmLendersContext(): CrmLendersContextValue {
  const context = useContext(CrmLendersContext);
  if (!context) {
    throw new Error("useCrmLendersContext must be used within CrmLendersProvider");
  }
  return context;
}
