import { CrmAccessDeniedPage } from "../pages/CrmAccessDeniedPage";
import { CrmPage } from "../pages/CrmPage";

type CrmAccessGateProps = {
  resolved: boolean;
  allowed: boolean;
  onNavigateHome: () => void;
};

export function CrmAccessGate({ resolved, allowed, onNavigateHome }: CrmAccessGateProps) {
  if (!resolved) {
    return <div className="loginScreenLoading">Checking CRM access...</div>;
  }
  if (!allowed) {
    return <CrmAccessDeniedPage onNavigateHome={onNavigateHome} />;
  }
  return <CrmPage />;
}
