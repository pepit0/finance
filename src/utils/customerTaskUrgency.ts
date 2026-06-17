import { crmTodoLocalDate, isCustomerTaskComplete, normalizeTaskDate, normalizeTaskTime } from "../lib/crmApi";

export type CustomerTaskUrgency = "upcoming" | "missed";

const UPCOMING_WINDOW_MS = 60 * 60 * 1000;

export function shiftCrmLocalDate(dateStr: string, days: number): string {
  const [year, month, day] = normalizeTaskDate(dateStr).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return crmTodoLocalDate(date);
}

export function parseCustomerTaskDateTime(taskDate: string, taskTime: string): Date | null {
  const datePart = normalizeTaskDate(taskDate);
  const timePart = normalizeTaskTime(taskTime);
  const dateMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timePart.match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) {
    return null;
  }

  const scheduled = new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0,
    0
  );
  return Number.isNaN(scheduled.getTime()) ? null : scheduled;
}

export function getCustomerTaskUrgency(
  task: { task_date: string; task_time: string; completed_at: string | null },
  now: Date = new Date()
): CustomerTaskUrgency | null {
  if (isCustomerTaskComplete(task.completed_at)) {
    return null;
  }

  const datePart = normalizeTaskDate(task.task_date);
  const today = crmTodoLocalDate(now);
  const scheduled = parseCustomerTaskDateTime(task.task_date, task.task_time);

  if (!scheduled) {
    if (datePart < today) {
      return "missed";
    }
    return null;
  }

  const nowMs = now.getTime();
  const scheduledMs = scheduled.getTime();

  if (nowMs >= scheduledMs) {
    return "missed";
  }
  if (nowMs >= scheduledMs - UPCOMING_WINDOW_MS) {
    return "upcoming";
  }
  return null;
}

export function customerTaskAlertKey(task: {
  id: string;
  task_date: string;
  task_time: string;
}): string {
  return `${task.id}:${normalizeTaskDate(task.task_date)}:${normalizeTaskTime(task.task_time)}`;
}
