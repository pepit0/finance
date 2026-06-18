import { useState } from "react";
import type { CrmWebPushSupport } from "../hooks/useCrmWebPush";

const DISMISS_KEY = "crm-push-onboarding-dismissed";

type CrmPushOnboardingBannerProps = {
  support: CrmWebPushSupport;
  active: boolean;
  busy: boolean;
  error: string | null;
  onEnable: () => Promise<boolean>;
  onDismissError: () => void;
};

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(value: boolean) {
  try {
    localStorage.setItem(DISMISS_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function CrmPushOnboardingBanner({
  support,
  active,
  busy,
  error,
  onEnable,
  onDismissError
}: CrmPushOnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(readDismissed);

  if (active || dismissed || support === "unsupported") {
    return null;
  }

  const onNotNow = () => {
    writeDismissed(true);
    setDismissed(true);
    onDismissError();
  };

  const onTurnOn = async () => {
    onDismissError();
    const ok = await onEnable();
    if (ok) {
      writeDismissed(true);
      setDismissed(true);
    }
  };

  return (
    <div className="crmPushOnboardingBanner" role="region" aria-label="Notification setup">
      <div className="crmPushOnboardingCopy">
        <strong className="crmPushOnboardingTitle">Never miss a text or call</strong>
        {support === "needs_install" ? (
          <p className="crmPushOnboardingBody">
            On iPhone: Safari → Share → <strong>Add to Home Screen</strong>, open the app from your home screen, then
            tap Turn on notifications.
          </p>
        ) : (
          <p className="crmPushOnboardingBody">
            Get alerted when a customer texts or calls you — even when this tab is closed. One tap, then click{" "}
            <strong>Allow</strong> if your browser asks.
          </p>
        )}
        {error ? (
          <p className="crmPushOnboardingError" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="crmPushOnboardingActions">
        {support === "ready" ? (
          <button
            type="button"
            className="topBarSheetButton crmPushOnboardingPrimary"
            disabled={busy}
            onClick={() => void onTurnOn()}
          >
            {busy ? "Turning on…" : "Turn on notifications"}
          </button>
        ) : null}
        <button type="button" className="crmPushOnboardingDismiss" onClick={onNotNow}>
          Not now
        </button>
      </div>
    </div>
  );
}
