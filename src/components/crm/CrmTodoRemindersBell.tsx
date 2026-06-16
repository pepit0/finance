import { useEffect, useRef, useState, type MouseEvent } from "react";

type CrmTodoRemindersBellProps = {
  incompleteCount: number;
  remindersEnabled: boolean;
  onRemindersEnabledChange: (enabled: boolean) => void;
  notificationPermission: NotificationPermission;
  onRequestNotifications: () => Promise<boolean>;
  onOpenTodo: () => void;
};

function BellIcon() {
  return (
    <svg className="crmTodoRemindIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2a6 6 0 0 0-6 6v2.1c0 .5-.2 1-.5 1.4L4.1 13.8A1 1 0 0 0 5 15.5h14a1 1 0 0 0 .9-1.5l-1.4-2.3c-.3-.4-.5-.9-.5-1.4V8a6 6 0 0 0-6-6zm0 20a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22z"
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
  onOpenTodo
}: CrmTodoRemindersBellProps) {
  const [open, setOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

  const showBadge = remindersEnabled && incompleteCount > 0;

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

  return (
    <div className="crmNotifyWrap crmTodoRemindWrap" ref={panelRef}>
      <button
        type="button"
        className="crmNotifyButton crmTodoRemindButton"
        onClick={() => {
          setOpen((value) => !value);
          setBanner(null);
        }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={
          showBadge
            ? `To-do reminders, ${incompleteCount} incomplete task${incompleteCount === 1 ? "" : "s"}`
            : "To-do reminders"
        }
        title="To-do reminders"
      >
        <BellIcon />
        {showBadge ? (
          <span className="crmNotifyBadge crmTodoRemindBadge">
            {incompleteCount > 99 ? "99+" : incompleteCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="crmNotifyPanel crmTodoRemindPanel" role="dialog" aria-label="To-do reminders">
          <div className="crmNotifyPanelHead">
            <span className="crmNotifyPanelTitle">To-do reminders</span>
          </div>
          {banner ? (
            <p className="crmBanner crmNotifyBanner" role="alert">
              {banner}
            </p>
          ) : null}
          <div className="crmTodoRemindPanelBody">
            <p className="crmTodoRemindersCopy">
              While CRM is open, Chrome can remind you every 30 minutes about your incomplete tasks.
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
                Enable reminders
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
            <button type="button" className="crmTodoRemindOpenTodo" onClick={() => {
              setOpen(false);
              onOpenTodo();
            }}>
              Open to-do tab
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
