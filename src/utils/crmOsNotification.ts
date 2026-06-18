/** Show a system notification when the CRM tab is open but not visible (e.g. another Chrome tab is focused). */
export function showCrmOsNotificationIfHidden(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  customer_id: string | null;
}): void {
  if (typeof document === "undefined" || !document.hidden) {
    return;
  }
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }
  if (row.type !== "inbound_sms" && row.type !== "inbound_call") {
    return;
  }

  let url = "/crm";
  if (row.type === "inbound_sms" && row.customer_id) {
    url = `/crm?chat=${row.customer_id}`;
  } else if (row.type === "inbound_call" && row.customer_id) {
    url = `/crm?customer=${row.customer_id}`;
  }

  try {
    const notification = new Notification(row.title, {
      body: row.body,
      tag: `crm-${row.id}`,
      icon: "/icons/icon-192.svg",
      silent: false
    });
    notification.onclick = () => {
      window.focus();
      window.location.assign(url);
      notification.close();
    };
  } catch {
    /* ignore */
  }
}
