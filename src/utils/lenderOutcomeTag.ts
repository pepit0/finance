import type { CrmLenderOutcome, CrmLenderOutcomeEntry, CrmLenderSlug } from "../types/crm";

export type CrmLenderDecisionTag = "conditional" | "approved" | "declined";

export function aggregateLenderDecisionTag(
  outcomes: Partial<Record<CrmLenderSlug, CrmLenderOutcomeEntry>> | CrmLenderOutcome[]
): CrmLenderDecisionTag | null {
  const values: CrmLenderOutcome[] = Array.isArray(outcomes)
    ? outcomes.map((row) => row.outcome)
    : Object.values(outcomes)
        .filter((row): row is CrmLenderOutcomeEntry => row != null)
        .map((row) => row.outcome);

  if (values.length === 0) {
    return null;
  }
  if (values.some((outcome) => outcome === "conditional")) {
    return "conditional";
  }
  if (values.some((outcome) => outcome === "approved")) {
    return "approved";
  }
  if (values.some((outcome) => outcome === "declined")) {
    return "declined";
  }
  return null;
}

export function lenderDecisionTagLabel(tag: CrmLenderDecisionTag): string {
  switch (tag) {
    case "conditional":
      return "Conditional";
    case "approved":
      return "Approved";
    case "declined":
      return "Declined";
  }
}

export function lenderDecisionTagClass(tag: CrmLenderDecisionTag): string {
  switch (tag) {
    case "conditional":
      return "crmLenderTagConditional";
    case "approved":
      return "crmLenderTagApproved";
    case "declined":
      return "crmLenderTagDeclined";
  }
}
