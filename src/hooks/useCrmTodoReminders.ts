import { useCallback, useEffect, useRef, useState } from "react";
import type { CrmCustomerTask, CrmTodoItem } from "../types/crm";
import { crmTodoLocalDate, ensureCrmTodoDay, fetchCrmCustomerTasksForUser } from "../lib/crmApi";
import { supabase } from "../lib/supabase";

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

function incompletePersonalTasks(items: CrmTodoItem[]): CrmTodoItem[] {
  return items.filter((item) => !item.completed_at);
}

function incompleteCustomerTasks(tasks: CrmCustomerTask[]): CrmCustomerTask[] {
  return tasks.filter((task) => !task.completed_at);
}

/**
 * Page-scoped browser notification (`new Notification` from the open CRM tab).
 * Not Web Push — does not use the service worker or `crm_push_subscriptions`.
 */
function showTodoPageNotification(
  personalItems: CrmTodoItem[],
  customerTasks: CrmCustomerTask[],
  onOpenTodo: () => void
) {
  const pendingPersonal = incompletePersonalTasks(personalItems);
  const pendingCustomer = incompleteCustomerTasks(customerTasks);
  const pendingCount = pendingPersonal.length + pendingCustomer.length;
  if (pendingCount === 0) {
    return;
  }
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }
  if (document.visibilityState === "hidden") {
    return;
  }

  const titles = [...pendingPersonal.map((item) => item.title), ...pendingCustomer.map((task) => task.title)];
  const preview = titles.slice(0, 3).join(", ");
  const suffix = titles.length > 3 ? "…" : "";

  const notification = new Notification("Morning tasks incomplete", {
    body: `${pendingCount} task(s) remaining: ${preview}${suffix}`,
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
  const [customerTasks, setCustomerTasks] = useState<CrmCustomerTask[]>([]);
  const [taskDate, setTaskDate] = useState(() => crmTodoLocalDate());
  const [remindersEnabled, setRemindersEnabledState] = useState(readRemindersEnabled);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const customerTasksRef = useRef(customerTasks);
  customerTasksRef.current = customerTasks;
  const onOpenTodoRef = useRef(onOpenTodo);
  onOpenTodoRef.current = onOpenTodo;

  const refreshItems = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setCustomerTasks([]);
      return;
    }

    const today = crmTodoLocalDate();
    setTaskDate(today);
    const result = await ensureCrmTodoDay(today);
    if (!result.error) {
      setItems(result.data);
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (userId) {
      const tasksResult = await fetchCrmCustomerTasksForUser(userId, { from: today, to: today });
      if (!tasksResult.error) {
        setCustomerTasks(tasksResult.data);
      }
    } else {
      setCustomerTasks([]);
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

  /** Browser notification permission only — never subscribes to Web Push. */
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
      showTodoPageNotification(itemsRef.current, customerTasksRef.current, () => onOpenTodoRef.current());
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
  }, [resetReminderTimer, items, customerTasks]);

  const incompleteCount =
    incompletePersonalTasks(items).length + incompleteCustomerTasks(customerTasks).length;

  return {
    items,
    incompleteCount,
    refreshItems,
    remindersEnabled,
    setRemindersEnabled,
    notificationPermission,
    requestNotifications
  };
}
