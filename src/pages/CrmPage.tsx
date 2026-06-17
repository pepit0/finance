import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { CrmCustomersTab } from "../components/crm/CrmCustomersTab";
import { CrmDirectoryTab } from "../components/crm/CrmDirectoryTab";
import { CrmSettingsTab } from "../components/crm/CrmSettingsTab";
import { CrmNotificationBell } from "../components/crm/CrmNotificationBell";
import { CrmSystemLeadsTab } from "../components/crm/CrmSystemLeadsTab";
import { CrmTodoRemindersBell } from "../components/crm/CrmTodoRemindersBell";
import { CrmTodoTab } from "../components/crm/CrmTodoTab";
import { useCrmPresence } from "../hooks/useCrmPresence";
import { useCrmCustomerTaskAlerts } from "../hooks/useCrmCustomerTaskAlerts";
import { useCrmBranding } from "../hooks/useCrmBranding";
import { useCrmTodoReminders } from "../hooks/useCrmTodoReminders";
import { CrmPipelineStagesProvider } from "../context/CrmPipelineStagesContext";
import { CrmLendersProvider } from "../context/CrmLendersContext";
import { CrmPermissionsProvider, useCrmPermissionsContext } from "../context/CrmPermissionsContext";
import { CrmDirectoryGroupsProvider } from "../context/CrmDirectoryGroupsContext";
import { supabase } from "../lib/supabase";

type CrmTab = "customers" | "systemLeads" | "team" | "todo" | "settings";

const marketingSiteUrl = import.meta.env.VITE_MARKETING_SITE_URL as string | undefined;
const CRM_MOBILE_MAX_WIDTH = 767;

export function CrmPage() {
  return (
    <CrmDirectoryGroupsProvider>
      <CrmPipelineStagesProvider>
        <CrmLendersProvider>
          <CrmPermissionsProvider>
            <CrmPageInner />
          </CrmPermissionsProvider>
        </CrmLendersProvider>
      </CrmPipelineStagesProvider>
    </CrmDirectoryGroupsProvider>
  );
}

function CrmPageInner() {
  const permissions = useCrmPermissionsContext();
  const [activeTab, setActiveTab] = useState<CrmTab>("customers");
  const [userId, setUserId] = useState<string | null>(null);
  const [systemLeadsRefresh, setSystemLeadsRefresh] = useState(0);
  const [focusCustomerId, setFocusCustomerId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(
    () => typeof window !== "undefined" && window.matchMedia(`(max-width: ${CRM_MOBILE_MAX_WIDTH}px)`).matches
  );
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${CRM_MOBILE_MAX_WIDTH}px)`);
    const sync = () => setIsMobileLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const canAccessSettings = permissions.clientMaster || permissions.canManagePermissions;

  const crmBranding = useCrmBranding();

  const brandingEditor = {
    accentColor: crmBranding.accentColor,
    savedAccentColor: crmBranding.savedAccentColor,
    colorMode: crmBranding.colorMode,
    controlStyle: crmBranding.controlStyle,
    backgroundSrc: crmBranding.backgroundSrc,
    headerIconSrc: crmBranding.headerIconSrc,
    headerTitle: crmBranding.headerTitle,
    headerSubtitle: crmBranding.headerSubtitle,
    savedHeaderTitle: crmBranding.savedHeaderTitle,
    savedHeaderSubtitle: crmBranding.savedHeaderSubtitle,
    hasCustomBackground: crmBranding.hasCustomBackground,
    hasCustomHeaderIcon: crmBranding.hasCustomHeaderIcon,
    loading: crmBranding.loading,
    saving: crmBranding.saving,
    uploadingKind: crmBranding.uploadingKind,
    clearingKind: crmBranding.clearingKind,
    error: crmBranding.error,
    isDirty: crmBranding.isDirty,
    isHeaderCopyDirty: crmBranding.isHeaderCopyDirty,
    onAccentChange: crmBranding.previewAccentColor,
    onSave: crmBranding.saveAccentColor,
    onReset: crmBranding.resetAccentColor,
    onColorModeChange: crmBranding.saveColorMode,
    onControlStyleChange: crmBranding.patchControlStyle,
    onHeaderTitleChange: crmBranding.previewHeaderTitle,
    onHeaderSubtitleChange: crmBranding.previewHeaderSubtitle,
    onSaveHeaderCopy: crmBranding.saveHeaderCopy,
    onResetHeaderCopy: crmBranding.resetHeaderCopy,
    onUploadBackground: crmBranding.uploadBackground,
    onUploadHeaderIcon: crmBranding.uploadHeaderIcon,
    onClearBackground: crmBranding.clearBackground,
    onClearHeaderIcon: crmBranding.clearHeaderIcon,
    onClearError: () => crmBranding.setError(null)
  };

  useEffect(() => {
    if (!canAccessSettings && activeTab === "settings") {
      setActiveTab("customers");
    }
  }, [activeTab, canAccessSettings]);

  const openTodo = useCallback(() => {
    setActiveTab("todo");
  }, []);

  const openCustomer = useCallback((customerId: string) => {
    setActiveTab("customers");
    setFocusCustomerId(customerId);
  }, []);

  const {
    refreshItems: refreshTodoItems,
    incompleteCount: todoIncompleteCount,
    remindersEnabled,
    setRemindersEnabled,
    notificationPermission,
    requestNotifications
  } = useCrmTodoReminders({
    enabled: Boolean(userId),
    onOpenTodo: openTodo
  });

  useCrmCustomerTaskAlerts({
    enabled: Boolean(userId),
    userId,
    onOpenCustomer: openCustomer
  });

  const presenceByUser = useCrmPresence(userId);

  const openSystemLeads = useCallback(() => {
    setActiveTab("systemLeads");
    setSystemLeadsRefresh((n) => n + 1);
  }, []);

  const handleSignOut = useCallback(async () => {
    setMobileNavOpen(false);
    await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }
    const onDocClick = (event: MouseEvent) => {
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target as Node)) {
        setMobileNavOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [mobileNavOpen]);

  const todoRemindersBell = userId ? (
    <CrmTodoRemindersBell
      incompleteCount={todoIncompleteCount}
      remindersEnabled={remindersEnabled}
      onRemindersEnabledChange={setRemindersEnabled}
      notificationPermission={notificationPermission}
      onRequestNotifications={requestNotifications}
      onOpenTodo={() => {
        setMobileNavOpen(false);
        openTodo();
      }}
    />
  ) : null;

  const notificationBell = userId ? (
    <CrmNotificationBell
      userId={userId}
      onOpenSystemLeads={() => {
        setMobileNavOpen(false);
        openSystemLeads();
      }}
      onOpenCustomer={(customerId) => {
        setMobileNavOpen(false);
        openCustomer(customerId);
      }}
    />
  ) : null;

  return (
    <main className="crmShell">
      <div className="crmHeaderChrome">
      <header className="crmTopBar">
        <div className="crmTopBarLead">
          <div className="crmTitleBlock crmTitleBlockWithBrand">
            <img src={crmBranding.headerIconSrc} alt="" className="crmTitleMark" decoding="async" />
            <div>
              <h1>{crmBranding.headerTitle}</h1>
              {crmBranding.headerSubtitle ? (
                <p className="crmSubtitle">{crmBranding.headerSubtitle}</p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="crmTopBarTrail" ref={mobileNavRef}>
          <div className="crmTopBarActionCluster">
            {isMobileLayout && notificationBell ? (
              <div className="crmTopBarAlerts crmTopBarAlertsMobileVisible">{notificationBell}</div>
            ) : null}
            <button
              type="button"
              className={`crmTopBarMenuBtn${mobileNavOpen ? " crmTopBarMenuBtnActive" : ""}`}
              aria-expanded={mobileNavOpen}
              aria-haspopup="true"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                setMobileNavOpen((open) => !open);
              }}
            >
              <svg className="crmTopBarMenuIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                {mobileNavOpen ? (
                  <path
                    fill="currentColor"
                    d="M6.4 5.3a1 1 0 0 1 1.4 0L12 9.5l4.2-4.2a1 1 0 1 1 1.4 1.4L13.4 11l4.2 4.2a1 1 0 0 1-1.4 1.4L12 12.4l-4.2 4.2a1 1 0 0 1-1.4-1.4L10.6 11 6.4 6.8a1 1 0 0 1 0-1.4z"
                  />
                ) : (
                  <path
                    fill="currentColor"
                    d="M4 7a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zm1 4a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H5z"
                  />
                )}
              </svg>
            </button>
          </div>
          <div className={`crmTopBarTrailMenu${mobileNavOpen ? " crmTopBarTrailMenuOpen" : ""}`}>
            {!isMobileLayout && (todoRemindersBell || notificationBell) ? (
              <div className="crmTopBarAlerts">
                {todoRemindersBell}
                {notificationBell}
              </div>
            ) : null}
            {isMobileLayout && todoRemindersBell ? (
              <div className="crmTopBarMenuBellSlot">{todoRemindersBell}</div>
            ) : null}
            {marketingSiteUrl ? (
              <a className="crmFinanceLink crmTopBarMenuLink" href={marketingSiteUrl} rel="noreferrer">
                Marketing site
              </a>
            ) : null}
            <button type="button" className="topBarSheetButton crmTopBarMenuSignOut" onClick={() => void handleSignOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="crmTabBarRow">
        <nav className="crmTabBar appTabs" aria-label="CRM sections">
          <button
            type="button"
            className={`appTab crmTabBtn ${activeTab === "todo" ? "appTabActive" : ""}`}
            onClick={() => setActiveTab("todo")}
            aria-current={activeTab === "todo" ? "page" : undefined}
          >
            {userId ? `To-do (${todoIncompleteCount})` : "To-do"}
          </button>
          <button
            type="button"
            className={`appTab crmTabBtn ${activeTab === "customers" ? "appTabActive" : ""}`}
            onClick={() => setActiveTab("customers")}
            aria-current={activeTab === "customers" ? "page" : undefined}
          >
            Customers
          </button>
          <button
            type="button"
            className={`appTab crmTabBtn ${activeTab === "systemLeads" ? "appTabActive" : ""}`}
            onClick={() => setActiveTab("systemLeads")}
            aria-current={activeTab === "systemLeads" ? "page" : undefined}
          >
            <span className="crmTabLabelWide">System leads</span>
            <span className="crmTabLabelNarrow">Leads</span>
          </button>
          <button
            type="button"
            className={`appTab crmTabBtn ${activeTab === "team" ? "appTabActive" : ""}`}
            onClick={() => setActiveTab("team")}
            aria-current={activeTab === "team" ? "page" : undefined}
          >
            Team
          </button>
          {canAccessSettings ? (
            <button
              type="button"
              className={`appTab crmTabBtn ${activeTab === "settings" ? "appTabActive" : ""}`}
              onClick={() => setActiveTab("settings")}
              aria-current={activeTab === "settings" ? "page" : undefined}
            >
              Settings
            </button>
          ) : null}
        </nav>
      </div>
      </div>

      <div className="crmShellBody">
        <section className="crmPanel crmPanelFlush" hidden={activeTab !== "customers"} aria-labelledby="crm-customers-heading">
          <CrmCustomersTab
            focusCustomerId={focusCustomerId}
            onFocusCustomerHandled={() => setFocusCustomerId(null)}
          />
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

        <section className="crmPanel crmPanelFlush" hidden={activeTab !== "team"} aria-labelledby="crm-team-heading">
          <h2 id="crm-team-heading" className="crmPanelHeading">
            Team
          </h2>
          <CrmDirectoryTab visible={activeTab === "team"} presenceByUser={presenceByUser} />
        </section>

        <section className="crmPanel crmPanelFlush" hidden={activeTab !== "settings"} aria-labelledby="crm-settings-heading">
          <h2 id="crm-settings-heading" className="crmPanelHeading">
            Settings
          </h2>
          <CrmSettingsTab
            visible={activeTab === "settings"}
            isMaster={permissions.clientMaster}
            canManagePermissions={permissions.canManagePermissions}
            themeEditor={brandingEditor}
          />
        </section>

        <section className="crmPanel crmPanelFlush" hidden={activeTab !== "todo"} aria-labelledby="crm-todo-heading">
          <CrmTodoTab
            visible={activeTab === "todo"}
            userId={userId}
            canAdminOthersTodo={permissions.hasPermission("todo.admin_others")}
            onItemsChanged={refreshTodoItems}
            onOpenCustomer={openCustomer}
          />
        </section>
      </div>
    </main>
  );
}
