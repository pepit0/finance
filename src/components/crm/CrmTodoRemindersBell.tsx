import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useCrmNotifyPanelAnchor } from "../../hooks/useCrmNotifyPanelAnchor";
import type { CrmWebPushSupport } from "../../hooks/useCrmWebPush";

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
  onDisableWebPush
}: CrmTodoRemindersBellProps) {
  const [open, setOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useCrmNotifyPanelAnchor(open, panelRef);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDocClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const showTodoBadge = remindersEnabled && incompleteCount > 0;
  const webPushActive = webPushEnabled && webPushSubscribed && webPushPermission === "granted";

  const onEnableReminders = async () => {
    setBanner(null);
    if (notificationPermission === "granted") {
      onRemindersEnabledChange(true);
      return;
    }
    const granted = await onRequestNotifications();
    if (!granted) {
      setBanner("Notifications are blocked. Enable them in your browser settings for this site.");
    }
  };

  const panelAlert = webPushError ?? banner;

  return (
    <div className="crmNotifyWrap crmTodoRemindWrap" ref={panelRef}>
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
      {open ? (
        <div className="crmNotifyPanel crmTodoRemindPanel" role="dialog" aria-label="Personal settings">
          <div className="crmNotifyPanelHead">
            <span className="crmNotifyPanelTitle">Personal settings</span>
          </div>
          {panelAlert ? (
            <p className="crmBanner crmNotifyBanner" role="alert">
              {panelAlert}
            </p>
          ) : null}
          <div className="crmTodoRemindPanelBody">
            <section className="crmPersonalSettingsSection" aria-labelledby="crm-personal-push-heading">
              <h3 id="crm-personal-push-heading" className="crmPersonalSettingsSectionTitle">
                Push notifications
              </h3>
              <p className="crmWebPushCopy">
                Web push for inbound texts and calls assigned to you, even when CRM is closed.
              </p>
              {webPushSupport === "unsupported" ? (
                <p className="crmWebPushStatus crmWebPushStatusBlocked" role="status">
                  Not supported in this browser.
                </p>
              ) : webPushSupport === "needs_install" ? (
                <p className="crmWebPushStatus crmWebPushStatusHint" role="status">
                  On iPhone, use Safari → Share → Add to Home Screen, open the installed app, then enable push here.
                </p>
              ) : webPushPermission === "denied" ? (
                <p className="crmWebPushStatus crmWebPushStatusBlocked" role="status">
                  Blocked — enable notifications in your browser settings for this site.
                </p>
              ) : webPushActive ? (
                <>
                  <p className="crmWebPushStatus crmWebPushStatusEnabled" role="status">
                    Enabled on this device.
                  </p>
                  <button
                    type="button"
                    className="topBarSheetButton"
                    disabled={webPushBusy}
                    onClick={() => void onDisableWebPush()}
                  >
                    {webPushBusy ? "Saving…" : "Disable push notifications"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="topBarSheetButton"
                  disabled={webPushBusy}
                  onClick={() => void onEnableWebPush()}
                >
                  {webPushBusy ? "Enabling…" : "Enable push notifications"}
                </button>
              )}
            </section>

            <div className="crmPersonalSettingsDivider" role="presentation" />

            <section className="crmPersonalSettingsSection" aria-labelledby="crm-personal-todo-heading">
              <h3 id="crm-personal-todo-heading" className="crmPersonalSettingsSectionTitle">
                To-do reminders
              </h3>
              <p className="crmTodoRemindersCopy">
                Regular browser notifications while this CRM tab is open — not web push, and not sent when CRM is
                closed.
              </p>
              {notificationPermission === "granted" ? (
                <label className="crmTodoRemindersToggle">
                  <input
                    type="checkbox"
                    checked={remindersEnabled}
                    onChange={(event) => onRemindersEnabledChange(event.target.checked)}
                  />
                  <span>30-minute reminders {remindersEnabled ? "on" : "off"}</span>
                </label>
              ) : notificationPermission === "denied" ? (
                <p className="crmTodoRemindersStatus crmTodoRemindersStatusBlocked" role="status">
                  Blocked — enable notifications in your browser settings for this site.
                </p>
              ) : (
                <button type="button" className="topBarSheetButton" onClick={() => void onEnableReminders()}>
                  Allow browser notifications for reminders
                </button>
              )}
              {incompleteCount > 0 ? (
                <p className="crmTodoRemindPending" role="status">
                  {incompleteCount} incomplete task{incompleteCount === 1 ? "" : "s"} today.
                </p>
              ) : (
                <p className="crmTodoRemindPending crmTodoRemindPendingDone" role="status">
                  All of today&apos;s tasks are complete.
                </p>
              )}
              <button
                type="button"
                className="crmTodoRemindOpenTodo"
                onClick={() => {
                  setOpen(false);
                  onOpenTodo();
                }}
              >
                Open to-do tab
              </button>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
