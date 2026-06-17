import { useCallback, useEffect, useRef } from "react";
import type { CrmCustomerTask } from "../types/crm";
import {
  crmTodoLocalDate,
  fetchCrmCustomerTasksForAssigneeFilter,
  formatCustomerTaskTime
} from "../lib/crmApi";
import {
  customerTaskAlertKey,
  getCustomerTaskUrgency,
  shiftCrmLocalDate
} from "../utils/customerTaskUrgency";

const ALERT_STORAGE_KEY = "crm-customer-task-upcoming-alerted";
const POLL_MS = 30_000;

type UseCrmCustomerTaskAlertsOptions = {
  enabled: boolean;
  userId: string | null;
  onOpenCustomer: (customerId: string) => void;
};

function readAlertedKeys(): Set<string> {
  try {
    const raw = sessionStorage.getItem(ALERT_STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeAlertedKeys(keys: Set<string>) {
  try {
    sessionStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify([...keys]));
  } catch {
    /* ignore */
  }
}

function showUpcomingTaskNotification(task: CrmCustomerTask, onOpenCustomer: (customerId: string) => void) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }

  const customerName = task.customer_display_name?.trim() || "Customer";
  const notification = new Notification("Task coming up", {
    body: `${task.title} at ${formatCustomerTaskTime(task.task_time)} · ${customerName}`,
    tag: `crm-task-upcoming-${task.id}`
  });

  notification.onclick = () => {
    window.focus();
    onOpenCustomer(task.customer_id);
    notification.close();
  };
}

export function useCrmCustomerTaskAlerts({
  enabled,
  userId,
  onOpenCustomer
}: UseCrmCustomerTaskAlertsOptions) {
  const onOpenCustomerRef = useRef(onOpenCustomer);
  onOpenCustomerRef.current = onOpenCustomer;
  const alertedKeysRef = useRef(readAlertedKeys());

  const checkUpcomingTasks = useCallback(async () => {
    if (!enabled || !userId) {
      return;
    }
    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }

    const today = crmTodoLocalDate();
    const range = {
      from: shiftCrmLocalDate(today, -1),
      to: shiftCrmLocalDate(today, 1)
    };
    const result = await fetchCrmCustomerTasksForAssigneeFilter(range, "me", userId);
    if (result.error) {
      return;
    }

    const now = new Date();
    const activeKeys = new Set<string>();
    const nextAlerted = new Set(alertedKeysRef.current);

    for (const task of result.data) {
      const key = customerTaskAlertKey(task);
      const urgency = getCustomerTaskUrgency(task, now);

      if (urgency === "upcoming") {
        activeKeys.add(key);
        if (!nextAlerted.has(key)) {
          showUpcomingTaskNotification(task, (customerId) => onOpenCustomerRef.current(customerId));
          nextAlerted.add(key);
        }
        continue;
      }

      if (nextAlerted.has(key)) {
        nextAlerted.delete(key);
      }
    }

    for (const key of [...nextAlerted]) {
      if (!activeKeys.has(key) && !result.data.some((task) => customerTaskAlertKey(task) === key)) {
        nextAlerted.delete(key);
      }
    }

    alertedKeysRef.current = nextAlerted;
    writeAlertedKeys(nextAlerted);
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    alertedKeysRef.current = readAlertedKeys();
    void checkUpcomingTasks();
    const timer = window.setInterval(() => {
      void checkUpcomingTasks();
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [checkUpcomingTasks, enabled, userId]);
}
