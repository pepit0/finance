const SW_PATH = "/sw.js";
const READY_TIMEOUT_MS = 20_000;

function waitForActivation(registration: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> {
  if (registration.active) {
    return Promise.resolve(registration);
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Service worker timed out while activating."));
    }, READY_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
    };

    const onController = () => {
      if (registration.active) {
        cleanup();
        resolve(registration);
      }
    };

    const worker = registration.installing ?? registration.waiting;
    if (worker) {
      const onStateChange = () => {
        if (worker.state === "activated") {
          worker.removeEventListener("statechange", onStateChange);
          cleanup();
          resolve(registration);
        } else if (worker.state === "redundant") {
          worker.removeEventListener("statechange", onStateChange);
          cleanup();
          reject(new Error("Service worker install failed."));
        }
      };
      worker.addEventListener("statechange", onStateChange);
      onStateChange();
    }

    navigator.serviceWorker.addEventListener("controllerchange", onController);

    void navigator.serviceWorker.ready
      .then(() => {
        cleanup();
        resolve(registration);
      })
      .catch(() => {
        cleanup();
        reject(new Error("Service worker timed out."));
      });
  });
}

/**
 * Returns an active service worker registration for Web Push.
 */
export async function getPushServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser.");
  }

  let registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) {
    try {
      registration = await navigator.serviceWorker.register(SW_PATH, {
        scope: "/",
        updateViaCache: "none"
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "registration failed";
      throw new Error(`Could not register service worker (${detail}).`);
    }
  }

  const active = await waitForActivation(registration);
  if (!active.active) {
    throw new Error("Service worker is not active.");
  }
  return active;
}
