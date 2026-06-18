import { isCrmProduct } from "../utils/productMode";
import { shouldUseExternalFinanceLink } from "../utils/productUrls";

type CrmAccessDeniedPageProps = {
  onNavigateHome: () => void;
};

export function CrmAccessDeniedPage({ onNavigateHome }: CrmAccessDeniedPageProps) {
  const homeLabel = isCrmProduct()
    ? shouldUseExternalFinanceLink()
      ? "Go to finance app"
      : "Go to finance dashboard"
    : "Go to finance dashboard";

  return (
    <main className="crmGateShell" role="main">
      <div className="crmGateCard">
        <p className="crmGateCode">401</p>
        <h1 className="crmGateTitle">Unauthorized</h1>
        <p className="crmGateBody">CRM under maintenance. Contact your admin for more info.</p>
        <button type="button" className="topBarSheetButton" onClick={onNavigateHome}>
          {homeLabel}
        </button>
      </div>
    </main>
  );
}
