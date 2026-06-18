import { useCallback, useEffect, useState } from "react";
import { deletePushSubscription, fetchPushSubscriptionStatus, upsertPushSubscription } from "../lib/crmApi";
import { getPushServiceWorkerRegistration } from "../utils/crmPushServiceWorker";

const PUSH_ENABLED_KEY = "crm-web-push-enabled";

export type CrmWebPushSupport = "unsupported" | "needs_install" | "ready";

export function isVapidConfigured(): boolean {
  return Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim());
}

function readPushEnabled(): boolean {
  try {
    return localStorage.getItem(PUSH_ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

function writePushEnabled(value: boolean) {
  try {
    localStorage.setItem(PUSH_ENABLED_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function hasPushApiSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof Notification !== "undefined"
  );
}

function resolveSupport(): CrmWebPushSupport {
  if (!hasPushApiSupport()) {
    return "unsupported";
  }
  if (isIosDevice() && !isStandaloneDisplayMode()) {
    return "needs_install";
  }
  return "ready";
}

function friendlyEnablePushError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Couldn't turn on notifications. Refresh the page and try again.";
  }
  const message = error.message.toLowerCase();
  if (import.meta.env.DEV) {
    return error.message;
  }
  if (message.includes("service worker") || message.includes("sw.js") || message.includes("timed out")) {
    return "Couldn't connect notifications on this device. Refresh the page or try Chrome.";
  }
  if (message.includes("denied") || message.includes("permission")) {
    return "Notifications are blocked. Allow them in your browser settings for this site.";
  }
  return "Couldn't turn on notifications. Refresh the page and try again.";
}

type UseCrmWebPushOptions = {
  enabled: boolean;
};

export function useCrmWebPush({ enabled }: UseCrmWebPushOptions) {
  const [support, setSupport] = useState<CrmWebPushSupport>(() => resolveSupport());
  const [pushEnabled, setPushEnabledState] = useState(readPushEnabled);
  const [subscribed, setSubscribed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = pushEnabled && subscribed && notificationPermission === "granted";
  const isConfigured = isVapidConfigured();

  const refreshStatus = useCallback(async () => {
    setSupport(resolveSupport());
    setNotificationPermission(typeof Notification !== "undefined" ? Notification.permission : "denied");

    if (!enabled || !hasPushApiSupport()) {
      setSubscribed(false);
      return;
    }

    const { subscribed: hasRow, error: statusError } = await fetchPushSubscriptionStatus();
    if (statusError) {
      setError(statusError);
    }
    setSubscribed(hasRow);
  }, [enabled]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!enabled || !isConfigured || !hasPushApiSupport()) {
      return;
    }
    void getPushServiceWorkerRegistration().catch(() => {
      /* enable flow surfaces errors */
    });
  }, [enabled, isConfigured]);

  useEffect(() => {
    const onDisplayModeChange = () => {
      setSupport(resolveSupport());
    };
    window.matchMedia("(display-mode: standalone)").addEventListener("change", onDisplayModeChange);
    return () => {
      window.matchMedia("(display-mode: standalone)").removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const enablePush = useCallback(async (): Promise<boolean> => {
    setError(null);

    const currentSupport = resolveSupport();
    setSupport(currentSupport);
    if (currentSupport === "unsupported") {
      setError("Notifications aren't supported in this browser. Try Chrome on desktop or Android.");
      return false;
    }
    if (currentSupport === "needs_install") {
      setError("On iPhone, add Tempt CRM to your Home Screen first, then turn notifications on.");
      return false;
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim();
    if (!vapidPublicKey) {
      setError(
        import.meta.env.DEV
          ? "Add VITE_VAPID_PUBLIC_KEY to .env.local and restart npm run dev."
          : "Notifications aren't set up on this site yet. Ask your admin."
      );
      return false;
    }

    setBusy(true);
    try {
      const permission =
        Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission !== "granted") {
        setError("Click Allow in the browser prompt, or enable notifications in your browser settings.");
        return false;
      }

      const registration = await getPushServiceWorkerRegistration();
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
        });
      }

      const { error: upsertError } = await upsertPushSubscription(subscription.toJSON());
      if (upsertError) {
        setError(upsertError);
        return false;
      }

      writePushEnabled(true);
      setPushEnabledState(true);
      setSubscribed(true);
      return true;
    } catch (enableError) {
      setError(friendlyEnablePushError(enableError));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const disablePush = useCallback(async (): Promise<boolean> => {
    setError(null);
    setBusy(true);
    try {
      const registration = await getPushServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const { error: deleteError } = await deletePushSubscription(subscription.endpoint);
        if (deleteError) {
          setError(deleteError);
          return false;
        }
        await subscription.unsubscribe();
      }

      writePushEnabled(false);
      setPushEnabledState(false);
      setSubscribed(false);
      return true;
    } catch (disableError) {
      setError(friendlyEnablePushError(disableError));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    support,
    pushEnabled,
    subscribed,
    isActive,
    isConfigured,
    notificationPermission,
    busy,
    error,
    setError,
    enablePush,
    disablePush,
    refreshStatus
  };
}
