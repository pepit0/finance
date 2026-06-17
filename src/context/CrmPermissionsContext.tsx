import { createContext, useContext, type ReactNode } from "react";
import { useCrmPermissions } from "../hooks/useCrmPermissions";

export type CrmPermissionsContextValue = ReturnType<typeof useCrmPermissions>;

const CrmPermissionsContext = createContext<CrmPermissionsContextValue | null>(null);

export function CrmPermissionsProvider({ children }: { children: ReactNode }) {
  const value = useCrmPermissions();
  return <CrmPermissionsContext.Provider value={value}>{children}</CrmPermissionsContext.Provider>;
}

export function useCrmPermissionsContext(): CrmPermissionsContextValue {
  const context = useContext(CrmPermissionsContext);
  if (!context) {
    throw new Error("useCrmPermissionsContext must be used within CrmPermissionsProvider");
  }
  return context;
}
