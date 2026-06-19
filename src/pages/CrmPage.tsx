import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { CrmChatTab } from "../components/crm/CrmChatTab";
import { CrmCustomersTab } from "../components/crm/CrmCustomersTab";
import { CrmDirectoryTab } from "../components/crm/CrmDirectoryTab";
import { CrmSettingsTab } from "../components/crm/CrmSettingsTab";
import { CrmNotificationBell } from "../components/crm/CrmNotificationBell";
import { CrmSystemLeadsTab } from "../components/crm/CrmSystemLeadsTab";
import { CrmTodoRemindersBell } from "../components/crm/CrmTodoRemindersBell";
import { CrmTodoTab } from "../components/crm/CrmTodoTab";
import { CrmNavTabs, type CrmNavTab } from "../components/crm/CrmNavTabs";
import { CrmOutboundCallProgress } from "../components/crm/CrmOutboundCallProgress";
import { CrmPushOnboardingBanner } from "../components/crm/CrmPushOnboardingBanner";
import { SignOutDoorIcon } from "../components/crm/CrmTodoIcons";
import { useActiveInboundCallSession } from "../hooks/useActiveInboundCallSession";
import { useCrmPresence } from "../hooks/useCrmPresence";
import { useCrmCustomerTaskAlerts } from "../hooks/useCrmCustomerTaskAlerts";
import { useCrmBranding } from "../hooks/useCrmBranding";
import { useCrmTodoReminders } from "../hooks/useCrmTodoReminders";
import { useCrmWebPush } from "../hooks/useCrmWebPush";
import { CRM_DEFAULT_HEADER_TITLE } from "../utils/crmHeaderCopy";
import { CrmPipelineStagesProvider } from "../context/CrmPipelineStagesContext";
import { CrmLendersProvider } from "../context/CrmLendersContext";
import { CrmPermissionsProvider, useCrmPermissionsContext } from "../context/CrmPermissionsContext";
import { CrmDirectoryGroupsProvider } from "../context/CrmDirectoryGroupsContext";
import { supabase } from "../lib/supabase";

const marketingSiteUrl = import.meta.env.VITE_MARKETING_SITE_URL as string | undefined;
const CRM_MOBILE_MAX_WIDTH = 767;
const CRM_LEFT_HEADER_MIN_WIDTH = 1024;

type CrmOutboundCallBannerSession = {
  sessionId: string;
  customerId: string;
  customerName: string;
};

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
  const [activeTab, setActiveTab] = useState<CrmNavTab>("customers");
  const [userId, setUserId] = useState<string | null>(null);
  const [systemLeadsRefresh, setSystemLeadsRefresh] = useState(0);
  const [focusCustomerId, setFocusCustomerId] = useState<string | null>(null);
  const [focusChatCustomerId, setFocusChatCustomerId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobilePersonalSettingsOpen, setMobilePersonalSettingsOpen] = useState(false);
  const [headerCustomerSearch, setHeaderCustomerSearch] = useState("");
  const [isMobileLayout, setIsMobileLayout] = useState(
    () => typeof window !== "undefined" && window.matchMedia(`(max-width: ${CRM_MOBILE_MAX_WIDTH}px)`).matches
  );
  const [isDesktopLayout, setIsDesktopLayout] = useState(
    () => typeof window !== "undefined" && window.matchMedia(`(min-width: ${CRM_LEFT_HEADER_MIN_WIDTH}px)`).matches
  );
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const headerChromeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${CRM_MOBILE_MAX_WIDTH}px)`);
    const sync = () => setIsMobileLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${CRM_LEFT_HEADER_MIN_WIDTH}px)`);
    const sync = () => setIsDesktopLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isMobileLayout) {
      setMobileNavOpen(false);
      setMobilePersonalSettingsOpen(false);
    }
  }, [isMobileLayout]);

  useEffect(() => {
    if (!mobileNavOpen) {
      setMobilePersonalSettingsOpen(false);
    }
  }, [mobileNavOpen]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const canAccessSettings = permissions.clientMaster || permissions.canManagePermissions;
  const canViewChat = permissions.hasPermission("texts.view");

  const openChat = useCallback((customerId: string) => {
    setActiveTab("chat");
    setFocusChatCustomerId(customerId);
  }, []);

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
    onClearError: () => crmBranding.setError(null),
    labelColors: crmBranding.labelColors,
    hasCustomLabelColors: crmBranding.hasCustomLabelColors,
    isLabelColorsDirty: crmBranding.isLabelColorsDirty,
    onPreviewLabelColor: crmBranding.previewLabelColor,
    onSaveLabelColors: crmBranding.saveLabelColors,
    onResetLabelColors: crmBranding.resetLabelColors,
    appVersion: crmBranding.appVersion
  };

  useEffect(() => {
    if (!canAccessSettings && activeTab === "settings") {
      setActiveTab("customers");
    }
  }, [activeTab, canAccessSettings]);

  useEffect(() => {
    if (!canViewChat && activeTab === "chat") {
      setActiveTab("customers");
    }
  }, [activeTab, canViewChat]);

  const openTodo = useCallback(() => {
    setActiveTab("todo");
  }, []);

  const openCustomer = useCallback((customerId: string) => {
    setActiveTab("customers");
    setFocusCustomerId(customerId);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatId = params.get("chat")?.trim();
    const customerId = params.get("customer")?.trim();
    if (!chatId && !customerId) {
      return;
    }

    if (chatId && canViewChat) {
      openChat(chatId);
    } else if (customerId) {
      openCustomer(customerId);
    }

    if (chatId) {
      params.delete("chat");
    }
    if (customerId) {
      params.delete("customer");
    }
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, [canViewChat, openChat, openCustomer]);

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

  const {
    support: webPushSupport,
    pushEnabled,
    subscribed: webPushSubscribed,
    isActive: webPushActive,
    isConfigured: webPushConfigured,
    notificationPermission: webPushPermission,
    busy: webPushBusy,
    error: webPushError,
    setError: setWebPushError,
    enablePush,
    disablePush
  } = useCrmWebPush({ enabled: Boolean(userId) });

  const presenceByUser = useCrmPresence(userId);

  const inboundCall = useActiveInboundCallSession(userId);
  const [outboundCall, setOutboundCall] = useState<CrmOutboundCallBannerSession | null>(null);
  const [outboundCallDoneAt, setOutboundCallDoneAt] = useState(0);

  const handleOutboundCallComplete = useCallback(() => {
    setOutboundCallDoneAt((value) => value + 1);
    window.setTimeout(() => {
      setOutboundCall(null);
    }, 12_000);
  }, []);

  const openSystemLeads = useCallback(() => {
    setActiveTab("systemLeads");
    setSystemLeadsRefresh((n) => n + 1);
  }, []);

  const handleSignOut = useCallback(async () => {
    setMobileNavOpen(false);
    await supabase.auth.signOut();
  }, []);

  const selectTab = useCallback((tab: CrmNavTab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  }, []);

  const navTabsProps = {
    activeTab,
    onSelect: selectTab,
    userId,
    todoIncompleteCount,
    canViewChat,
    canAccessSettings
  };

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

  const todoRemindersBellProps = userId
    ? {
        incompleteCount: todoIncompleteCount,
        remindersEnabled,
        onRemindersEnabledChange: setRemindersEnabled,
        notificationPermission,
        onRequestNotifications: requestNotifications,
        onOpenTodo: () => {
          setMobileNavOpen(false);
          setMobilePersonalSettingsOpen(false);
          openTodo();
        },
        webPushSupport,
        webPushEnabled: pushEnabled,
        webPushSubscribed,
        webPushPermission,
        webPushBusy,
        webPushError,
        onClearWebPushError: () => setWebPushError(null),
        onEnableWebPush: enablePush,
        onDisableWebPush: disablePush
      }
    : null;

  const todoRemindersBell = todoRemindersBellProps ? (
    <CrmTodoRemindersBell {...todoRemindersBellProps} presentation="standalone" />
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
      onOpenChat={(customerId) => {
        setMobileNavOpen(false);
        openChat(customerId);
      }}
    />
  ) : null;

  const useLeftDesktopHeader = crmBranding.controlStyle.headerLayout === "left" && isDesktopLayout;

  useEffect(() => {
    const shell = shellRef.current;
    const header = headerChromeRef.current;
    if (!shell || !header || useLeftDesktopHeader || isMobileLayout) {
      shell?.style.removeProperty("--crm-main-header-height");
      return;
    }

    const syncHeaderHeight = () => {
      shell.style.setProperty("--crm-main-header-height", `${header.offsetHeight}px`);
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [isMobileLayout, useLeftDesktopHeader]);

  const headerChromeContent = useLeftDesktopHeader ? (
    <header className="crmTopBar crmTopBarSidebar">
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
      <div className="crmSidebarHeaderActions">
        {todoRemindersBell}
        {notificationBell}
        <button type="button" className="topBarSheetButton crmSignOutBtn crmSidebarSignOutBtn" onClick={() => void handleSignOut()}>
          <SignOutDoorIcon />
          Sign out
        </button>
      </div>
      <div className="crmSidebarSearchRow">
        <input
          type="search"
          className="crmSearchInput crmSidebarQuickSearch"
          placeholder="Quick customer search..."
          value={headerCustomerSearch}
          onChange={(event) => {
            setHeaderCustomerSearch(event.target.value);
            setActiveTab("customers");
          }}
          aria-label="Quick customer search"
        />
      </div>
      <CrmNavTabs {...navTabsProps} variant="sidebar" />
    </header>
  ) : (
    <>
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
                    d="M6.225 4.811a1 1 0 0 1 1.414 0L12 9.172l4.361-4.361a1 1 0 1 1 1.414 1.414L13.414 10.586l4.361 4.361a1 1 0 0 1-1.414 1.414L12 12l-4.361 4.361a1 1 0 0 1-1.414-1.414l4.361-4.361-4.361-4.361a1 1 0 0 1 0-1.414z"
                  />
                ) : (
                  <>
                    <rect x="4" y="5.5" width="16" height="2" rx="1" fill="currentColor" />
                    <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
                    <rect x="4" y="16.5" width="16" height="2" rx="1" fill="currentColor" />
                  </>
                )}
              </svg>
            </button>
          </div>
          <div
            className={`crmTopBarTrailMenu${mobileNavOpen ? " crmTopBarTrailMenuOpen" : ""}${mobilePersonalSettingsOpen ? " crmTopBarTrailMenuPersonalOpen" : ""}`}
          >
            {isMobileLayout ? (
              <div className="crmTopBarMenuMain" aria-hidden={mobilePersonalSettingsOpen}>
                <p className="crmTopBarMenuSectionLabel">Navigate</p>
                <CrmNavTabs {...navTabsProps} variant="mobile-menu" />
                <div className="crmTopBarMenuDivider" role="presentation" />
                {todoRemindersBellProps ? (
                  <CrmTodoRemindersBell
                    {...todoRemindersBellProps}
                    presentation="mobile-trigger"
                    onMobileOpen={() => setMobilePersonalSettingsOpen(true)}
                  />
                ) : null}
                <div className="crmTopBarMenuDivider" role="presentation" />
                {marketingSiteUrl ? (
                  <a className="crmFinanceLink crmTopBarMenuLink" href={marketingSiteUrl} rel="noreferrer">
                    Marketing site
                  </a>
                ) : null}
                <button
                  type="button"
                  className="topBarSheetButton crmSignOutBtn crmTopBarMenuSignOut"
                  onClick={() => void handleSignOut()}
                >
                  <SignOutDoorIcon />
                  Sign out
                </button>
              </div>
            ) : null}
            {isMobileLayout && mobilePersonalSettingsOpen && todoRemindersBellProps ? (
              <CrmTodoRemindersBell
                {...todoRemindersBellProps}
                presentation="mobile-panel"
                onMobileBack={() => setMobilePersonalSettingsOpen(false)}
              />
            ) : null}
            {!isMobileLayout && (todoRemindersBell || notificationBell) ? (
              <div className="crmTopBarAlerts">
                {todoRemindersBell}
                {notificationBell}
              </div>
            ) : null}
            {!isMobileLayout && marketingSiteUrl ? (
              <a className="crmFinanceLink crmTopBarMenuLink" href={marketingSiteUrl} rel="noreferrer">
                Marketing site
              </a>
            ) : null}
            {!isMobileLayout ? (
              <button type="button" className="topBarSheetButton crmSignOutBtn crmTopBarMenuSignOut" onClick={() => void handleSignOut()}>
                <SignOutDoorIcon />
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {!isMobileLayout ? (
        <div className="crmTabBarRow">
          <CrmNavTabs {...navTabsProps} variant="bar" />
        </div>
      ) : null}
    </>
  );

  return (
    <main
      ref={shellRef}
      className={`crmShell${useLeftDesktopHeader ? " crmShellHeaderLeft" : ""}${isMobileLayout && !useLeftDesktopHeader ? " crmShellMobileNav" : ""}`}
    >
      {isMobileLayout && mobileNavOpen && !useLeftDesktopHeader ? (
        <button
          type="button"
          className="crmMobileNavBackdrop"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <div className="crmShellMain">
        <div
          ref={headerChromeRef}
          className={`crmHeaderChrome${useLeftDesktopHeader ? " crmHeaderChromeSidebar" : ""}`}
        >
          {headerChromeContent}
        </div>

        <div className="crmShellBody">
          {userId && webPushConfigured ? (
            <CrmPushOnboardingBanner
              support={webPushSupport}
              active={webPushActive}
              busy={webPushBusy}
              error={webPushError}
              onEnable={enablePush}
              onDismissError={() => setWebPushError(null)}
            />
          ) : null}
          {inboundCall.visible && inboundCall.session ? (
            <div className="crmInboundCallBanner">
              <CrmOutboundCallProgress
                sessionId={inboundCall.session.id}
                customerName={inboundCall.customerName ?? "Caller"}
                direction="inbound"
                onComplete={() => {
                  if (inboundCall.customerId) {
                    openCustomer(inboundCall.customerId);
                  }
                }}
              />
              {inboundCall.customerId ? (
                <button
                  type="button"
                  className="crmInboundCallOpenCustomer"
                  onClick={() => openCustomer(inboundCall.customerId!)}
                >
                  Open customer
                </button>
              ) : null}
            </div>
          ) : null}
          {outboundCall ? (
            <div className="crmInboundCallBanner">
              <CrmOutboundCallProgress
                sessionId={outboundCall.sessionId}
                customerName={outboundCall.customerName}
                onComplete={handleOutboundCallComplete}
              />
              <button
                type="button"
                className="crmInboundCallOpenCustomer"
                onClick={() => openCustomer(outboundCall.customerId)}
              >
                Open customer
              </button>
            </div>
          ) : null}
          <section className="crmPanel crmPanelFlush" hidden={activeTab !== "customers"} aria-labelledby="crm-customers-heading">
            <CrmCustomersTab
              focusCustomerId={focusCustomerId}
              onFocusCustomerHandled={() => setFocusCustomerId(null)}
              externalSearchQuery={useLeftDesktopHeader ? headerCustomerSearch : undefined}
              onOpenChat={canViewChat ? openChat : undefined}
              outboundCall={outboundCall}
              outboundCallDoneAt={outboundCallDoneAt}
              onOutboundCallSessionChange={setOutboundCall}
            />
          </section>

          <section className="crmPanel crmPanelFlush" hidden={activeTab !== "chat"} aria-labelledby="crm-chat-heading">
            <CrmChatTab
              visible={activeTab === "chat"}
              userId={userId}
              canAdminInboxes={permissions.hasPermission("texts.admin_inboxes")}
              focusCustomerId={focusChatCustomerId}
              onFocusCustomerHandled={() => setFocusChatCustomerId(null)}
              onOpenCustomer={openCustomer}
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
              onOpenCustomer={openCustomer}
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
      </div>

      <footer className="crmShellFooter">
        <p className="crmShellFooterCopy">
          © {new Date().getFullYear()}{" "}
          {crmBranding.footerText.trim() || crmBranding.headerTitle || CRM_DEFAULT_HEADER_TITLE}
        </p>
      </footer>
    </main>
  );
}
