const SW_PATH = "/sw.js";
const READY_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    })
  ]);
}

async function waitForWorkerActivation(registration: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> {
  if (registration.active) {
    return registration;
  }

  const worker = registration.installing ?? registration.waiting;
  if (worker) {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error("Service worker timed out while installing."));
      }, READY_TIMEOUT_MS);

      const onStateChange = () => {
        if (worker.state === "activated") {
          window.clearTimeout(timeout);
          worker.removeEventListener("statechange", onStateChange);
          resolve();
        } else if (worker.state === "redundant") {
          window.clearTimeout(timeout);
          worker.removeEventListener("statechange", onStateChange);
          reject(new Error("Service worker install failed."));
        }
      };

      worker.addEventListener("statechange", onStateChange);
      onStateChange();
    });
    return registration;
  }

  return withTimeout(
    navigator.serviceWorker.ready,
    READY_TIMEOUT_MS,
    "Service worker timed out."
  );
}

async function validateServiceWorkerScript(): Promise<void> {
  const response = await fetch(SW_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Service worker missing (${response.status}).`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  const body = (await response.text()).trimStart();
  if (contentType.includes("text/html") || body.startsWith("<!")) {
    throw new Error("Service worker URL returned HTML instead of JavaScript.");
  }
}

/**
 * Returns an active service worker registration for Web Push.
 */
export async function getPushServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser.");
  }

  await validateServiceWorkerScript();

  let registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    try {
      registration = await navigator.serviceWorker.register(SW_PATH, { scope: "/", updateViaCache: "none" });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "registration failed";
      throw new Error(`Could not register notifications worker (${detail}).`);
    }
  } else {
    try {
      await registration.update();
    } catch {
      /* ignore */
    }
  }

  return waitForWorkerActivation(registration);
}
