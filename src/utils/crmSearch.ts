import type { CrmCustomer, CrmPipelineStage } from "../types/crm";
import { normalizePipelineStage, PIPELINE_STAGE_OPTIONS } from "./pipelineStage";

export type CrmCustomerSortKey = "pipeline" | "created" | "last_touch";

export const CUSTOMER_SORT_OPTIONS: { value: CrmCustomerSortKey; label: string }[] = [
  { value: "pipeline", label: "Pipeline status" },
  { value: "created", label: "Date created" },
  { value: "last_touch", label: "Last touch" }
];

const PIPELINE_SORT_RANK = Object.fromEntries(
  [...PIPELINE_STAGE_OPTIONS.map((opt, index) => [opt.value, index]), ["lost", PIPELINE_STAGE_OPTIONS.length] as const]
) as Record<CrmPipelineStage, number>;

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

export function filterCustomersByPipelineStage(
  customers: CrmCustomer[],
  stageFilter: string
): CrmCustomer[] {
  if (stageFilter === "all") {
    return customers;
  }
  const stage = normalizePipelineStage(stageFilter) as CrmPipelineStage;
  return customers.filter((c) => c.pipeline_stage === stage);
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

function compareCustomerNames(a: CrmCustomer, b: CrmCustomer): number {
  return a.display_name.localeCompare(b.display_name, undefined, { sensitivity: "base" });
}

/** Last touch: never-contacted first, then oldest activity first. */
export function sortCustomers(
  customers: CrmCustomer[],
  sortKey: CrmCustomerSortKey,
  pipelineSortRank: Record<string, number> = PIPELINE_SORT_RANK
): CrmCustomer[] {
  const sorted = [...customers];
  switch (sortKey) {
    case "pipeline":
      sorted.sort((a, b) => {
        const rankA = pipelineSortRank[a.pipeline_stage] ?? 99;
        const rankB = pipelineSortRank[b.pipeline_stage] ?? 99;
        if (rankA !== rankB) {
          return rankA - rankB;
        }
        return compareCustomerNames(a, b);
      });
      break;
    case "created":
      sorted.sort((a, b) => {
        const createdDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (createdDiff !== 0) {
          return createdDiff;
        }
        return compareCustomerNames(a, b);
      });
      break;
    case "last_touch":
      sorted.sort((a, b) => {
        const touchA = a.last_call_at ? new Date(a.last_call_at).getTime() : Number.NEGATIVE_INFINITY;
        const touchB = b.last_call_at ? new Date(b.last_call_at).getTime() : Number.NEGATIVE_INFINITY;
        if (touchA !== touchB) {
          return touchA - touchB;
        }
        return compareCustomerNames(a, b);
      });
      break;
  }
  return sorted;
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
