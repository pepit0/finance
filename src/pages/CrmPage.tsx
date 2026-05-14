import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CrmCustomersTab } from "../components/crm/CrmCustomersTab";
import { CrmDirectoryTab } from "../components/crm/CrmDirectoryTab";
import { CrmOverviewTab } from "../components/crm/CrmOverviewTab";
import { supabase } from "../lib/supabase";
import { CRM_DIRECTORY_MASTER_EMAIL } from "../utils/crmDirectoryAdmin";

type CrmTab = "overview" | "customers" | "team";

export function CrmPage() {
  const [activeTab, setActiveTab] = useState<CrmTab>("overview");
  const [showTeamTab, setShowTeamTab] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      const em = user?.email?.trim().toLowerCase();
      if (!em) {
        if (!cancelled) {
          setShowTeamTab(false);
        }
        return;
      }
      if (em === CRM_DIRECTORY_MASTER_EMAIL) {
        if (!cancelled) {
          setShowTeamTab(true);
        }
        return;
      }
      const { data } = await supabase.from("crm_directory_admins").select("email").eq("email", em).maybeSingle();
      if (!cancelled) {
        setShowTeamTab(!!data?.email);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <main className="crmShell">
      <header className="crmTopBar">
        <div className="crmTopBarLead">
          <div className="crmTitleBlock">
            <h1>CRM</h1>
            <p className="crmSubtitle">Customers, calls, and notes</p>
          </div>
          <nav className="appTabs" aria-label="CRM sections">
            <button
              type="button"
              className={`appTab ${activeTab === "overview" ? "appTabActive" : ""}`}
              onClick={() => setActiveTab("overview")}
              aria-current={activeTab === "overview" ? "page" : undefined}
            >
              Overview
            </button>
            <button
              type="button"
              className={`appTab ${activeTab === "customers" ? "appTabActive" : ""}`}
              onClick={() => setActiveTab("customers")}
              aria-current={activeTab === "customers" ? "page" : undefined}
            >
              Customers
            </button>
            {showTeamTab ? (
              <button
                type="button"
                className={`appTab ${activeTab === "team" ? "appTabActive" : ""}`}
                onClick={() => setActiveTab("team")}
                aria-current={activeTab === "team" ? "page" : undefined}
              >
                Team
              </button>
            ) : null}
          </nav>
        </div>
        <div className="crmTopBarTrail">
          <Link className="crmFinanceLink" to="/">
            Finance dashboard
          </Link>
          <button type="button" className="topBarSheetButton" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <section className="crmPanel" hidden={activeTab !== "overview"} aria-labelledby="crm-overview-heading">
        <h2 id="crm-overview-heading" className="crmPanelHeading">
          Overview
        </h2>
        <CrmOverviewTab visible={activeTab === "overview"} />
      </section>

      <section className="crmPanel crmPanelFlush" hidden={activeTab !== "customers"} aria-labelledby="crm-customers-heading">
        <h2 id="crm-customers-heading" className="crmPanelHeading">
          Customers
        </h2>
        <CrmCustomersTab />
      </section>

      <section className="crmPanel crmPanelFlush" hidden={activeTab !== "team"} aria-labelledby="crm-team-heading">
        <h2 id="crm-team-heading" className="crmPanelHeading">
          Team
        </h2>
        <CrmDirectoryTab visible={activeTab === "team"} />
      </section>
    </main>
  );
}
