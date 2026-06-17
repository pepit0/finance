import type { CrmCustomerTask } from "../../types/crm";
import { isCustomerTaskComplete } from "../../lib/crmApi";
import { getCustomerTaskUrgency, type CustomerTaskUrgency } from "../../utils/customerTaskUrgency";
import { CustomerTaskUrgencyIcon } from "./CustomerTaskUrgencyIcon";

export function customerTaskUrgencyFor(
  task: CrmCustomerTask,
  now: Date
): CustomerTaskUrgency | null {
  if (isCustomerTaskComplete(task.completed_at)) {
    return null;
  }
  return getCustomerTaskUrgency(task, now);
}

export function customerTaskUrgencyRowClass(
  baseClass: string,
  urgency: CustomerTaskUrgency | null,
  options?: { done?: boolean; statePrefix?: string }
): string {
  const prefix = options?.statePrefix ?? baseClass.trim().split(/\s+/).pop() ?? baseClass;
  return [
    baseClass,
    options?.done ? `${prefix}Done` : "",
    urgency === "upcoming" ? `${prefix}Upcoming` : "",
    urgency === "missed" ? `${prefix}Missed` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

type CustomerTaskUrgencyMarkerProps = {
  urgency: CustomerTaskUrgency;
};

export function CustomerTaskUrgencyMarker({ urgency }: CustomerTaskUrgencyMarkerProps) {
  return <CustomerTaskUrgencyIcon urgency={urgency} />;
}
