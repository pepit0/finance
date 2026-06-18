import type { CrmWebPushSupport } from "../../hooks/useCrmWebPush";

type CrmPersonalSettingsContentProps = {
  compact?: boolean;
  incompleteCount: number;
  remindersEnabled: boolean;
  onRemindersEnabledChange: (enabled: boolean) => void;
  notificationPermission: NotificationPermission;
  onRequestNotifications: () => Promise<boolean>;
  onOpenTodo: () => void;
  webPushSupport: CrmWebPushSupport;
  webPushActive: boolean;
  webPushPermission: NotificationPermission;
  webPushBusy: boolean;
  onEnableWebPush: () => Promise<boolean>;
  onDisableWebPush: () => Promise<boolean>;
  onEnableReminders: () => Promise<void>;
  panelAlert: string | null;
};

export function CrmPersonalSettingsContent({
  compact = false,
  incompleteCount,
  remindersEnabled,
  onRemindersEnabledChange,
  notificationPermission,
  onOpenTodo,
  webPushSupport,
  webPushActive,
  webPushPermission,
  webPushBusy,
  onEnableWebPush,
  onDisableWebPush,
  onEnableReminders,
  panelAlert
}: CrmPersonalSettingsContentProps) {
  if (!compact) {
    return (
      <div className="crmTodoRemindPanelBody">
        {panelAlert ? (
          <p className="crmBanner crmNotifyBanner" role="alert">
            {panelAlert}
          </p>
        ) : null}

        <section className="crmPersonalSettingsSection" aria-labelledby="crm-personal-push-heading">
          <h3 id="crm-personal-push-heading" className="crmPersonalSettingsSectionTitle">
            Text &amp; call alerts
          </h3>
          <p className="crmWebPushCopy">
            Get notified when a customer texts or calls your Twilio number, even when CRM is closed. Sending a message
            from CRM does not trigger an alert — test by texting your business number from your phone.
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
                On — you&apos;ll get text and call alerts on this device.
              </p>
              <button
                type="button"
                className="topBarSheetButton"
                disabled={webPushBusy}
                onClick={() => void onDisableWebPush()}
              >
                {webPushBusy ? "Saving…" : "Turn off notifications"}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="topBarSheetButton"
              disabled={webPushBusy}
              onClick={() => void onEnableWebPush()}
            >
              {webPushBusy ? "Turning on…" : "Turn on notifications"}
            </button>
          )}
        </section>

        <div className="crmPersonalSettingsDivider" role="presentation" />

        <section className="crmPersonalSettingsSection" aria-labelledby="crm-personal-todo-heading">
          <h3 id="crm-personal-todo-heading" className="crmPersonalSettingsSectionTitle">
            To-do reminders
          </h3>
          <p className="crmTodoRemindersCopy">
            Regular browser notifications while this CRM tab is open — not web push, and not sent when CRM is closed.
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
          <button type="button" className="crmTodoRemindOpenTodo" onClick={onOpenTodo}>
            Open to-do tab
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="crmPersonalSettingsBody crmPersonalSettingsBodyCompact">
      {panelAlert ? (
        <p className="crmBanner crmNotifyBanner" role="alert">
          {panelAlert}
        </p>
      ) : null}

      <section className="crmPersonalSettingsSection">
        <h3 className="crmPersonalSettingsSectionTitle">Push alerts</h3>
        {webPushSupport === "unsupported" ? (
          <p className="crmWebPushStatus crmWebPushStatusBlocked" role="status">
            Not supported in this browser.
          </p>
        ) : webPushSupport === "needs_install" ? (
          <p className="crmWebPushStatus crmWebPushStatusHint" role="status">
            Add to Home Screen first.
          </p>
        ) : webPushPermission === "denied" ? (
          <p className="crmWebPushStatus crmWebPushStatusBlocked" role="status">
            Blocked in browser settings.
          </p>
        ) : webPushActive ? (
          <div className="crmPersonalSettingsRow">
            <span className="crmWebPushStatus crmWebPushStatusEnabled">On</span>
            <button
              type="button"
              className="crmPersonalSettingsAction"
              disabled={webPushBusy}
              onClick={() => void onDisableWebPush()}
            >
              {webPushBusy ? "…" : "Turn off"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="crmPersonalSettingsAction crmPersonalSettingsActionPrimary"
            disabled={webPushBusy}
            onClick={() => void onEnableWebPush()}
          >
            {webPushBusy ? "…" : "Turn on"}
          </button>
        )}
      </section>

      <div className="crmPersonalSettingsDivider" role="presentation" />

      <section className="crmPersonalSettingsSection">
        <h3 className="crmPersonalSettingsSectionTitle">To-do</h3>
        {notificationPermission === "granted" ? (
          <label className="crmTodoRemindersToggle">
            <input
              type="checkbox"
              checked={remindersEnabled}
              onChange={(event) => onRemindersEnabledChange(event.target.checked)}
            />
            <span>30-minute reminders</span>
          </label>
        ) : notificationPermission === "denied" ? (
          <p className="crmTodoRemindersStatus crmTodoRemindersStatusBlocked" role="status">
            Blocked in browser settings.
          </p>
        ) : (
          <button type="button" className="crmPersonalSettingsAction" onClick={() => void onEnableReminders()}>
            Allow reminders
          </button>
        )}
        {incompleteCount > 0 ? (
          <button type="button" className="crmPersonalSettingsLink" onClick={onOpenTodo}>
            {incompleteCount} task{incompleteCount === 1 ? "" : "s"} today →
          </button>
        ) : null}
      </section>
    </div>
  );
}
