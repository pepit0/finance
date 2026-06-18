import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useCrmNotifyPanelAnchor } from "../../hooks/useCrmNotifyPanelAnchor";
import { useCrmNotifyPortalMode } from "../../hooks/useCrmNotifyPortalMode";
import type { CrmWebPushSupport } from "../../hooks/useCrmWebPush";
import { CrmPersonalSettingsContent } from "./CrmPersonalSettingsContent";
import { CrmNotifyPanelPortal } from "./CrmNotifyPanelPortal";

export type CrmTodoRemindersPresentation = "standalone" | "mobile-trigger" | "mobile-panel";

type CrmTodoRemindersBellProps = {
  incompleteCount: number;
  remindersEnabled: boolean;
  onRemindersEnabledChange: (enabled: boolean) => void;
  notificationPermission: NotificationPermission;
  onRequestNotifications: () => Promise<boolean>;
  onOpenTodo: () => void;
  webPushSupport: CrmWebPushSupport;
  webPushEnabled: boolean;
  webPushSubscribed: boolean;
  webPushPermission: NotificationPermission;
  webPushBusy: boolean;
  webPushError: string | null;
  onClearWebPushError: () => void;
  onEnableWebPush: () => Promise<boolean>;
  onDisableWebPush: () => Promise<boolean>;
  presentation?: CrmTodoRemindersPresentation;
  onMobileOpen?: () => void;
  onMobileBack?: () => void;
};

function GearIcon() {
  return (
    <svg className="crmNotifyIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
      />
    </svg>
  );
}

export function CrmTodoRemindersBell({
  incompleteCount,
  remindersEnabled,
  onRemindersEnabledChange,
  notificationPermission,
  onRequestNotifications,
  onOpenTodo,
  webPushSupport,
  webPushEnabled,
  webPushSubscribed,
  webPushPermission,
  webPushBusy,
  webPushError,
  onClearWebPushError,
  onEnableWebPush,
  onDisableWebPush,
  presentation = "standalone",
  onMobileOpen,
  onMobileBack
}: CrmTodoRemindersBellProps) {
  const [open, setOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { mobileSheet } = useCrmNotifyPortalMode();
  const isStandalone = presentation === "standalone";

  useCrmNotifyPanelAnchor(open && isStandalone, wrapRef, {
    mobileSheet: isStandalone && mobileSheet,
    usePortal: isStandalone
  });

  useEffect(() => {
    if (!open || !isStandalone) {
      return;
    }
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) {
        return;
      }
      if (panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, isStandalone]);

  const showTodoBadge = remindersEnabled && incompleteCount > 0;
  const webPushActive = webPushEnabled && webPushSubscribed && webPushPermission === "granted";
  const panelAlert = webPushError ?? banner;

  const onEnableReminders = async () => {
    setBanner(null);
    if (notificationPermission === "granted") {
      onRemindersEnabledChange(true);
      return;
    }
    const granted = await onRequestNotifications();
    if (!granted) {
      setBanner("Notifications are blocked in browser settings.");
    }
  };

  const settingsContent = (
    <CrmPersonalSettingsContent
      compact={presentation !== "standalone"}
      incompleteCount={incompleteCount}
      remindersEnabled={remindersEnabled}
      onRemindersEnabledChange={onRemindersEnabledChange}
      notificationPermission={notificationPermission}
      onRequestNotifications={onRequestNotifications}
      onOpenTodo={onOpenTodo}
      webPushSupport={webPushSupport}
      webPushActive={webPushActive}
      webPushPermission={webPushPermission}
      webPushBusy={webPushBusy}
      onEnableWebPush={onEnableWebPush}
      onDisableWebPush={onDisableWebPush}
      onEnableReminders={onEnableReminders}
      panelAlert={panelAlert}
    />
  );

  if (presentation === "mobile-trigger") {
    return (
      <button
        type="button"
        className="crmMobileNavTab crmTopBarMenuPersonalTrigger"
        onClick={() => {
          onClearWebPushError();
          onMobileOpen?.();
        }}
      >
        <span className="crmMobileNavTabIcon">
          <GearIcon />
        </span>
        <span className="crmMobileNavTabLabel">Personal settings</span>
        {showTodoBadge ? (
          <span className="crmNotifyBadge crmTodoRemindBadge">{incompleteCount > 99 ? "99+" : incompleteCount}</span>
        ) : null}
      </button>
    );
  }

  if (presentation === "mobile-panel") {
    return (
      <div className="crmTopBarMenuPersonalOverlay">
        <div className="crmTopBarMenuPersonalOverlayHead">
          <button type="button" className="crmTopBarMenuPersonalBack" onClick={onMobileBack}>
            ← Menu
          </button>
          <span className="crmTopBarMenuPersonalTitle">Personal settings</span>
        </div>
        {settingsContent}
      </div>
    );
  }

  return (
    <div className="crmNotifyWrap crmTodoRemindWrap" ref={wrapRef}>
      <button
        type="button"
        className="crmNotifyButton crmNotifyButtonIconOnly crmTodoRemindButton"
        onClick={() => {
          setOpen((value) => !value);
          setBanner(null);
          onClearWebPushError();
        }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={
          showTodoBadge
            ? `Personal settings, ${incompleteCount} incomplete task${incompleteCount === 1 ? "" : "s"}`
            : "Personal settings"
        }
        title="Personal settings"
      >
        <GearIcon />
        {showTodoBadge ? (
          <span className="crmNotifyBadge crmTodoRemindBadge">
            {incompleteCount > 99 ? "99+" : incompleteCount}
          </span>
        ) : webPushActive ? (
          <span className="crmWebPushDot" aria-hidden="true" />
        ) : null}
      </button>
      <CrmNotifyPanelPortal
        open={open}
        mobileSheet={mobileSheet}
        onBackdropClick={() => {
          setOpen(false);
          setBanner(null);
          onClearWebPushError();
        }}
      >
        <div
          ref={panelRef}
          className={`crmNotifyPanel crmTodoRemindPanel${mobileSheet ? " crmNotifyPanelSheet" : ""}`}
          role="dialog"
          aria-label="Personal settings"
        >
          <div className="crmNotifyPanelHead">
            <span className="crmNotifyPanelTitle">Personal settings</span>
          </div>
          {settingsContent}
        </div>
      </CrmNotifyPanelPortal>
    </div>
  );
}
