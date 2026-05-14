import { CrmAccessDeniedPage } from "../pages/CrmAccessDeniedPage";
import { CrmPage } from "../pages/CrmPage";

type CrmAccessGateProps = {
  resolved: boolean;
  allowed: boolean;
  rpcError: string | null;
  onNavigateHome: () => void;
};

export function CrmAccessGate({ resolved, allowed, rpcError, onNavigateHome }: CrmAccessGateProps) {
  if (!resolved) {
    return <div className="loginScreenLoading">Checking CRM access...</div>;
  }
  if (!allowed) {
    return <CrmAccessDeniedPage rpcError={rpcError} onNavigateHome={onNavigateHome} />;
  }
  return <CrmPage />;
}
