import { useCallback, useEffect, useRef, useState } from "react";
import type { CrmTodoItem } from "../types/crm";
import { crmTodoLocalDate, ensureCrmTodoDay } from "../lib/crmApi";

const REMINDER_INTERVAL_MS = 30 * 60 * 1000;
const REMINDERS_ENABLED_KEY = "crm-todo-reminders-enabled";
const DATE_CHECK_MS = 60 * 1000;

type UseCrmTodoRemindersOptions = {
  enabled: boolean;
  onOpenTodo: () => void;
};

function readRemindersEnabled(): boolean {
  try {
    return localStorage.getItem(REMINDERS_ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeRemindersEnabled(value: boolean) {
  try {
    localStorage.setItem(REMINDERS_ENABLED_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function incompleteTasks(items: CrmTodoItem[]): CrmTodoItem[] {
  return items.filter((item) => !item.completed_at);
}

function showTodoNotification(items: CrmTodoItem[], onOpenTodo: () => void) {
  const pending = incompleteTasks(items);
  if (pending.length === 0) {
    return;
  }
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }

  const titles = pending.map((item) => item.title);
  const preview = titles.slice(0, 3).join(", ");
  const suffix = titles.length > 3 ? "…" : "";

  const notification = new Notification("Morning tasks incomplete", {
    body: `${pending.length} task(s) remaining: ${preview}${suffix}`,
    tag: "crm-todo-reminder"
  });

  notification.onclick = () => {
    window.focus();
    onOpenTodo();
    notification.close();
  };
}

export function useCrmTodoReminders({ enabled, onOpenTodo }: UseCrmTodoRemindersOptions) {
  const [items, setItems] = useState<CrmTodoItem[]>([]);
  const [taskDate, setTaskDate] = useState(() => crmTodoLocalDate());
  const [remindersEnabled, setRemindersEnabledState] = useState(readRemindersEnabled);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onOpenTodoRef = useRef(onOpenTodo);
  onOpenTodoRef.current = onOpenTodo;

  const refreshItems = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      return;
    }

    const today = crmTodoLocalDate();
    setTaskDate(today);
    const result = await ensureCrmTodoDay(today);
    if (!result.error) {
      setItems(result.data);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void refreshItems();
  }, [enabled, refreshItems]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timer = window.setInterval(() => {
      const today = crmTodoLocalDate();
      if (today !== taskDate) {
        setTaskDate(today);
        void refreshItems();
      }
    }, DATE_CHECK_MS);

    return () => window.clearInterval(timer);
  }, [enabled, refreshItems, taskDate]);

  const setRemindersEnabled = useCallback((value: boolean) => {
    setRemindersEnabledState(value);
    writeRemindersEnabled(value);
  }, []);

  const requestNotifications = useCallback(async () => {
    if (typeof Notification === "undefined") {
      setNotificationPermission("denied");
      return false;
    }

    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    if (result === "granted") {
      setRemindersEnabled(true);
      return true;
    }
    setRemindersEnabled(false);
    return false;
  }, [setRemindersEnabled]);

  const scheduleReminderRef = useRef<number | null>(null);

  const resetReminderTimer = useCallback(() => {
    if (scheduleReminderRef.current != null) {
      window.clearTimeout(scheduleReminderRef.current);
    }

    if (!enabled || !remindersEnabled || notificationPermission !== "granted") {
      scheduleReminderRef.current = null;
      return;
    }

    scheduleReminderRef.current = window.setTimeout(() => {
      showTodoNotification(itemsRef.current, () => onOpenTodoRef.current());
      resetReminderTimer();
    }, REMINDER_INTERVAL_MS);
  }, [enabled, remindersEnabled, notificationPermission]);

  useEffect(() => {
    resetReminderTimer();
    return () => {
      if (scheduleReminderRef.current != null) {
        window.clearTimeout(scheduleReminderRef.current);
      }
    };
  }, [resetReminderTimer, items]);

  return {
    items,
    incompleteCount: incompleteTasks(items).length,
    refreshItems,
    remindersEnabled,
    setRemindersEnabled,
    notificationPermission,
    requestNotifications
  };
}
