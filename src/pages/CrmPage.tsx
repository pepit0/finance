import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CrmCustomersTab } from "../components/crm/CrmCustomersTab";
import { CrmDirectoryTab } from "../components/crm/CrmDirectoryTab";
import { CrmNotificationBell } from "../components/crm/CrmNotificationBell";
import { CrmOverviewTab } from "../components/crm/CrmOverviewTab";
import { CrmSystemLeadsTab } from "../components/crm/CrmSystemLeadsTab";
import { CrmWebLeadsTab } from "../components/crm/CrmWebLeadsTab";
import tLogo from "../assets/Tlogo.png";
import { supabase } from "../lib/supabase";

type CrmTab = "overview" | "customers" | "systemLeads" | "webLeads" | "team";

const marketingSiteUrl = import.meta.env.VITE_MARKETING_SITE_URL as string | undefined;

export function CrmPage() {
  const [activeTab, setActiveTab] = useState<CrmTab>("overview");
  const [userId, setUserId] = useState<string | null>(null);
  const [systemLeadsRefresh, setSystemLeadsRefresh] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const openSystemLeads = useCallback(() => {
    setActiveTab("systemLeads");
    setSystemLeadsRefresh((n) => n + 1);
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <main className="crmShell">
      <header className="crmTopBar">
        <div className="crmTopBarLead">
          <div className="crmTitleBlock crmTitleBlockWithBrand">
            <img src={tLogo} alt="" className="crmTitleMark" decoding="async" />
            <div>
              <h1>Temptation Motorsports CRM</h1>
              <p className="crmSubtitle">Customers, calls, and notes</p>
            </div>
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
            <button
              type="button"
              className={`appTab ${activeTab === "systemLeads" ? "appTabActive" : ""}`}
              onClick={() => setActiveTab("systemLeads")}
              aria-current={activeTab === "systemLeads" ? "page" : undefined}
            >
              System leads
            </button>
            <button
              type="button"
              className={`appTab ${activeTab === "webLeads" ? "appTabActive" : ""}`}
              onClick={() => setActiveTab("webLeads")}
              aria-current={activeTab === "webLeads" ? "page" : undefined}
            >
              Web leads
            </button>
            <button
              type="button"
              className={`appTab ${activeTab === "team" ? "appTabActive" : ""}`}
              onClick={() => setActiveTab("team")}
              aria-current={activeTab === "team" ? "page" : undefined}
            >
              Team
            </button>
          </nav>
        </div>
        <div className="crmTopBarTrail">
          {userId ? <CrmNotificationBell userId={userId} onOpenSystemLeads={openSystemLeads} /> : null}
          {marketingSiteUrl ? (
            <a className="crmFinanceLink" href={marketingSiteUrl} rel="noreferrer">
              Marketing site
            </a>
          ) : null}
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

      <section
        className="crmPanel crmPanelFlush"
        hidden={activeTab !== "systemLeads"}
        aria-labelledby="crm-systemleads-heading"
      >
        <h2 id="crm-systemleads-heading" className="crmPanelHeading">
          System leads
        </h2>
        <CrmSystemLeadsTab visible={activeTab === "systemLeads"} refreshToken={systemLeadsRefresh} />
      </section>

      <section className="crmPanel crmPanelFlush" hidden={activeTab !== "webLeads"} aria-labelledby="crm-webleads-heading">
        <h2 id="crm-webleads-heading" className="crmPanelHeading">
          Web leads
        </h2>
        <CrmWebLeadsTab visible={activeTab === "webLeads"} />
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
