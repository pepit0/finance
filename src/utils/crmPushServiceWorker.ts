const SW_PATH = `${import.meta.env.BASE_URL}sw.js`.replace(/\/{2,}/g, "/");
const SW_SCOPE = import.meta.env.BASE_URL || "/";
const READY_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    })
  ]);
}

/**
 * Returns an active service worker registration for Web Push.
 * `navigator.serviceWorker.ready` alone can hang forever if registration failed.
 */
export async function getPushServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser.");
  }

  let registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (!registration) {
    try {
      registration = await navigator.serviceWorker.register(SW_PATH, { scope: SW_SCOPE });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "registration failed";
      throw new Error(
        `Could not register the push service worker at ${SW_PATH}. Open ${SW_PATH} in your browser — it should be JavaScript, not your HTML page. (${detail})`
      );
    }
  }

  if (registration.active) {
    return registration;
  }

  return withTimeout(
    navigator.serviceWorker.ready,
    READY_TIMEOUT_MS,
    `Service worker did not become active in time. Hard-refresh the page, confirm ${SW_PATH} loads, then try again.`
  );
}
