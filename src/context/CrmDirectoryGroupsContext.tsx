import { createContext, useContext, type ReactNode } from "react";
import { useCrmDirectoryGroups } from "../hooks/useCrmDirectoryGroups";
import { directoryGroupLabel, directoryGroupRank } from "../utils/crmDirectoryGroups";

export type CrmDirectoryGroupsContextValue = ReturnType<typeof useCrmDirectoryGroups> & {
  formatLabel: (slug: string | null | undefined) => string;
  rankFor: (slug: string | null | undefined) => number;
};

const CrmDirectoryGroupsContext = createContext<CrmDirectoryGroupsContextValue | null>(null);

export function CrmDirectoryGroupsProvider({ children }: { children: ReactNode }) {
  const directoryGroups = useCrmDirectoryGroups();
  const value: CrmDirectoryGroupsContextValue = {
    ...directoryGroups,
    formatLabel: (slug) => directoryGroupLabel(slug, directoryGroups.groups),
    rankFor: (slug) => directoryGroupRank(slug, directoryGroups.groups)
  };
  return <CrmDirectoryGroupsContext.Provider value={value}>{children}</CrmDirectoryGroupsContext.Provider>;
}

export function useCrmDirectoryGroupsContext(): CrmDirectoryGroupsContextValue {
  const context = useContext(CrmDirectoryGroupsContext);
  if (!context) {
    throw new Error("useCrmDirectoryGroupsContext must be used within CrmDirectoryGroupsProvider");
  }
  return context;
}
