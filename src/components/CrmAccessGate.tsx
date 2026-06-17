import { CrmAccessDeniedPage } from "../pages/CrmAccessDeniedPage";
import { CrmPage } from "../pages/CrmPage";
import { AppErrorBoundary } from "./AppErrorBoundary";

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
  return (
    <AppErrorBoundary label="CRM">
      <CrmPage />
    </AppErrorBoundary>
  );
}
