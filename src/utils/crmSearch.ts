import type { CrmCustomer } from "../types/crm";

/** `all` | `unassigned` | `me` | assignee user id (uuid). */
export function filterCustomersByAssignee(
  customers: CrmCustomer[],
  filter: string,
  meId: string | null
): CrmCustomer[] {
  if (filter === "all") {
    return customers;
  }
  if (filter === "unassigned") {
    return customers.filter((c) => !c.assigned_to);
  }
  if (filter === "me") {
    if (!meId) {
      return [];
    }
    return customers.filter((c) => c.assigned_to === meId);
  }
  return customers.filter((c) => c.assigned_to === filter);
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function haystackForCustomer(c: CrmCustomer): string {
  return [c.display_name, c.email ?? "", c.phone ?? "", c.secondary_phone ?? ""].join("\u0000").toLowerCase();
}

/** Progressive match: name/email/phones (digit-stripped for phone-style queries). */
export function filterCustomersBySearch(customers: CrmCustomer[], rawQuery: string): CrmCustomer[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) {
    return customers;
  }
  const qDigits = digitsOnly(q);
  const useDigitMatch = qDigits.length >= 3;

  return customers.filter((c) => {
    const hay = haystackForCustomer(c);
    if (hay.includes(q)) {
      return true;
    }
    if (useDigitMatch) {
      const phones = digitsOnly([c.phone, c.secondary_phone].filter(Boolean).join(""));
      if (phones.includes(qDigits)) {
        return true;
      }
    }
    return false;
  });
}

export function formatRelativeSince(iso: string | null): string {
  if (!iso) {
    return "No calls logged";
  }
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(0, Math.floor((now - then) / 1000));
  if (sec < 60) {
    return "Last call just now";
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `Last call ${min}m ago`;
  }
  const hr = Math.floor(min / 60);
  if (hr < 48) {
    return `Last call ${hr}h ago`;
  }
  const day = Math.floor(hr / 24);
  if (day < 14) {
    return `Last call ${day}d ago`;
  }
  const wk = Math.floor(day / 7);
  return `Last call ${wk}w ago`;
}
