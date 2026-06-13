import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import type { CrmNotification } from "../../types/crm";
import {
  deleteNotification,
  fetchRecentNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead
} from "../../lib/crmApi";
import { supabase } from "../../lib/supabase";

type CrmNotificationBellProps = {
  userId: string;
  onOpenSystemLeads: () => void;
  onOpenCustomer: (customerId: string) => void;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

export function CrmNotificationBell({ userId, onOpenSystemLeads, onOpenCustomer }: CrmNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<CrmNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const [countResult, listResult] = await Promise.all([
      fetchUnreadNotificationCount(),
      fetchRecentNotifications(15)
    ]);
    if (!countResult.error) {
      setUnread(countResult.count);
    }
    if (!listResult.error) {
      setItems(listResult.data);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel(`crm-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crm_notifications",
          filter: `user_id=eq.${userId}`
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

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

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setBanner(null);
      setLoading(true);
      await refresh();
      setLoading(false);
    }
  };

  const onItemClick = async (item: CrmNotification) => {
    if (!item.read_at) {
      await markNotificationRead(item.id);
      void refresh();
    }
    setOpen(false);
    if (item.type === "stale_lead" && item.customer_id) {
      onOpenCustomer(item.customer_id);
      return;
    }
    if (item.type === "system_lead") {
      onOpenSystemLeads();
    }
  };

  const onMarkAllRead = async () => {
    await markAllNotificationsRead();
    void refresh();
  };

  const onDismiss = async (notificationId: string, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDismissingId(notificationId);
    setBanner(null);
    const { error } = await deleteNotification(notificationId);
    setDismissingId(null);
    if (error) {
      setBanner(error);
      return;
    }
    setItems((prev) => prev.filter((row) => row.id !== notificationId));
    void refresh();
  };

  return (
    <div className="crmNotifyWrap" ref={panelRef}>
      <button
        type="button"
        className="crmNotifyButton"
        onClick={() => void toggleOpen()}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
      >
        Alerts
        {unread > 0 ? <span className="crmNotifyBadge">{unread > 99 ? "99+" : unread}</span> : null}
      </button>
      {open ? (
        <div className="crmNotifyPanel" role="dialog" aria-label="Notifications">
          <div className="crmNotifyPanelHead">
            <span className="crmNotifyPanelTitle">Notifications</span>
            {unread > 0 ? (
              <button type="button" className="crmNotifyMarkAll" onClick={() => void onMarkAllRead()}>
                Mark all read
              </button>
            ) : null}
          </div>
          {banner ? (
            <p className="crmBanner crmNotifyBanner" role="alert">
              {banner}
            </p>
          ) : null}
          {loading ? (
            <p className="crmMuted crmNotifyEmpty">Loading…</p>
          ) : items.length === 0 ? (
            <p className="crmMuted crmNotifyEmpty">No notifications yet.</p>
          ) : (
            <ul className="crmNotifyList">
              {items.map((item) => (
                <li key={item.id} className="crmNotifyRow">
                  <button
                    type="button"
                    className={`crmNotifyItem${item.read_at ? "" : " crmNotifyItemUnread"}`}
                    onClick={() => void onItemClick(item)}
                  >
                    <span className="crmNotifyItemTitle">{item.title}</span>
                    <span className="crmNotifyItemBody">{item.body}</span>
                    <time className="crmNotifyItemTime" dateTime={item.created_at}>
                      {formatWhen(item.created_at)}
                    </time>
                  </button>
                  <button
                    type="button"
                    className="crmNotifyDismiss"
                    aria-label={`Dismiss ${item.title}`}
                    disabled={dismissingId === item.id}
                    onClick={(e) => void onDismiss(item.id, e)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
