self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() ?? "New CRM alert" };
  }

  const title = (payload.title || "").trim() || "Temptation CRM";
  const body = (payload.body || "").trim() || "You have a new notification.";
  const tag = (payload.tag || "").trim() || "crm-push";
  const url = (payload.url || "").trim() || "/crm";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      data: { url }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = typeof event.notification.data?.url === "string" ? event.notification.data.url : "/crm";

  event.waitUntil(
    (async () => {
      const absoluteUrl = new URL(targetUrl, self.location.origin).href;
      const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

      for (const client of windowClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client && typeof client.navigate === "function") {
            await client.navigate(absoluteUrl);
          }
          return;
        }
      }

      await self.clients.openWindow(absoluteUrl);
    })()
  );
});
