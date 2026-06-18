type CrmAccessDeniedPageProps = {
  onNavigateHome: () => void;
};

export function CrmAccessDeniedPage({ onNavigateHome }: CrmAccessDeniedPageProps) {
  return (
    <main className="crmGateShell" role="main">
      <div className="crmGateCard">
        <p className="crmGateCode">401</p>
        <h1 className="crmGateTitle">Unauthorized</h1>
        <p className="crmGateBody">CRM under maintenance. Contact your admin for more info.</p>
        <button type="button" className="topBarSheetButton" onClick={onNavigateHome}>
          Go to finance dashboard
        </button>
      </div>
    </main>
  );
}
