type CrmAccessDeniedPageProps = {
  onNavigateHome: () => void;
  rpcError: string | null;
};

export function CrmAccessDeniedPage({ onNavigateHome, rpcError }: CrmAccessDeniedPageProps) {
  return (
    <main className="crmGateShell" role="main">
      <div className="crmGateCard">
        <h1 className="crmGateTitle">Access denied</h1>
        <p className="crmGateBody">Your account does not have permission to use this area.</p>
        {rpcError ? (
          <p className="crmGateTechnical" role="status">
            <strong>Technical detail:</strong> {rpcError}
            {/function|does not exist|schema cache/i.test(rpcError) ? (
              <>
                {" "}
                Run <code className="crmInlineCode">sql/crm_install_rpc_and_reload.sql</code> in the Supabase SQL Editor
                for this project (creates the RPC + reloads the API cache). For the full CRM tables too, run{" "}
                <code className="crmInlineCode">sql/crm_security.sql</code> once.
              </>
            ) : null}
          </p>
        ) : (
          <ul className="crmGateHints">
            <li>
              Use <strong>App metadata</strong> (not User metadata): <code className="crmInlineCode">crm_access</code>{" "}
              = true and/or <code className="crmInlineCode">roles</code> includes <code className="crmInlineCode">crm</code>
              , or add your email to <code className="crmInlineCode">crm_access_allowlist</code> (see{" "}
              <code className="crmInlineCode">sql/crm_security.sql</code>).
            </li>
            <li>After changing permissions in Supabase, use <strong>Sign out</strong> then sign in again (the app also refreshes your session when you open CRM).</li>
            <li>Confirm <code className="crmInlineCode">.env.local</code> points at the <strong>same</strong> Supabase project where you added permission.</li>
          </ul>
        )}
        <button type="button" className="topBarSheetButton" onClick={onNavigateHome}>
          Go to finance dashboard
        </button>
      </div>
    </main>
  );
}