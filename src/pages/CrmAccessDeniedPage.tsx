type CrmAccessDeniedPageProps = {
  onNavigateHome: () => void;
};

export function CrmAccessDeniedPage({ onNavigateHome }: CrmAccessDeniedPageProps) {
  return (
    <main className="crmGateShell" role="main">
      <div className="crmGateCard">
        <h1 className="crmGateTitle">Access denied</h1>
        <p className="crmGateBody">
          You don&apos;t have permission to use the CRM. Please contact your administrator if you need access.
        </p>
        <button type="button" className="topBarSheetButton" onClick={onNavigateHome}>
          Go to finance dashboard
        </button>
      </div>
    </main>
  );
}
