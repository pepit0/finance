import { supabase } from "../lib/supabase";
import { isCrmProduct, isFullProduct } from "../utils/productMode";
import { financeAppUrl, shouldUseExternalFinanceLink } from "../utils/productUrls";

type CrmAccessDeniedPageProps = {
  onNavigateHome: () => void;
};

export function CrmAccessDeniedPage({ onNavigateHome }: CrmAccessDeniedPageProps) {
  const showFinanceHome =
    isFullProduct() || (isCrmProduct() && shouldUseExternalFinanceLink()) || Boolean(financeAppUrl());
  const homeLabel = shouldUseExternalFinanceLink() ? "Go to finance app" : "Go to finance dashboard";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  return (
    <main className="crmGateShell" role="main">
      <div className="crmGateCard">
        <p className="crmGateCode">401</p>
        <h1 className="crmGateTitle">Unauthorized</h1>
        <p className="crmGateBody">CRM under maintenance. Contact your admin for more info.</p>
        {showFinanceHome ? (
          <button type="button" className="topBarSheetButton" onClick={onNavigateHome}>
            {homeLabel}
          </button>
        ) : (
          <button type="button" className="topBarSheetButton" onClick={handleSignOut}>
            Sign out
          </button>
        )}
      </div>
    </main>
  );
}
