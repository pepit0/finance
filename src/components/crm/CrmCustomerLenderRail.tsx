import { useCallback, useEffect, useRef, useState } from "react";
import type { CrmLenderOutcome, CrmLenderOutcomeEntry, CrmLenderSlug } from "../../types/crm";
import { deleteCustomerLenderOutcome, upsertCustomerLenderOutcome } from "../../lib/crmApi";
import { CrmLenderLogo } from "./crmLenderLogos";

const PRIME: { slug: CrmLenderSlug; label: string }[] = [
  { slug: "national_bank", label: "National Bank" },
  { slug: "desjardins", label: "Desjardins" },
  { slug: "td", label: "TD" },
  { slug: "santander_prime", label: "Santander" }
];

const SUBPRIME: { slug: CrmLenderSlug; label: string }[] = [
  { slug: "lendcare", label: "Lendcare" },
  { slug: "prefera", label: "Prefera" },
  { slug: "santander_subprime", label: "Santander" }
];

function outcomeLabel(o: CrmLenderOutcome): string {
  if (o === "conditional") {
    return "Conditionally approved";
  }
  if (o === "approved") {
    return "Approved";
  }
  return "Declined";
}

function iconHoverTitle(label: string, entry: CrmLenderOutcomeEntry | undefined): string {
  if (!entry) {
    return `${label}. No status. Click to set.`;
  }
  const status = outcomeLabel(entry.outcome);
  const note = entry.reason?.trim();
  return note ? `${label}: ${status}. ${note}` : `${label}: ${status}.`;
}

function iconAriaLabel(label: string, entry: CrmLenderOutcomeEntry | undefined): string {
  if (!entry) {
    return `${label}. No status. Open menu to set approval and reason.`;
  }
  const status = outcomeLabel(entry.outcome);
  const note = entry.reason?.trim();
  return note ? `${label}. ${status}. Reason: ${note}. Open menu to edit.` : `${label}. ${status}. Open menu to edit.`;
}

type CrmCustomerLenderRailProps = {
  customerId: string;
  outcomes: Partial<Record<CrmLenderSlug, CrmLenderOutcomeEntry>>;
  onOutcomesPatch: (patch: Partial<Record<CrmLenderSlug, CrmLenderOutcomeEntry | undefined>>) => void;
  onBanner: (message: string | null) => void;
};

export function CrmCustomerLenderRail({
  customerId,
  outcomes,
  onOutcomesPatch,
  onBanner
}: CrmCustomerLenderRailProps) {
  const [openSlug, setOpenSlug] = useState<CrmLenderSlug | null>(null);
  const [draftOutcome, setDraftOutcome] = useState<CrmLenderOutcome | null>(null);
  const [draftReason, setDraftReason] = useState("");
  const [savingSlug, setSavingSlug] = useState<CrmLenderSlug | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpenSlug(null);
  }, [customerId]);

  useEffect(() => {
    if (!openSlug) {
      return;
    }
    const onDocDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpenSlug(null);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [openSlug]);

  const openForSlug = useCallback(
    (slug: CrmLenderSlug) => {
      const row = outcomes[slug];
      setDraftOutcome(row?.outcome ?? null);
      setDraftReason(row?.reason?.trim() ?? "");
      setOpenSlug(slug);
    },
    [outcomes]
  );

  const toggleSlug = useCallback(
    (slug: CrmLenderSlug) => {
      if (openSlug === slug) {
        setOpenSlug(null);
        return;
      }
      openForSlug(slug);
    },
    [openSlug, openForSlug]
  );

  const saveDraft = useCallback(
    async (slug: CrmLenderSlug) => {
      if (!draftOutcome) {
        onBanner("Choose Approved, Conditional, or Declined before saving.");
        return;
      }
      setSavingSlug(slug);
      onBanner(null);
      const { error } = await upsertCustomerLenderOutcome(customerId, slug, draftOutcome, draftReason);
      setSavingSlug(null);
      if (error) {
        onBanner(error);
        return;
      }
      const trimmed = draftReason.trim();
      onOutcomesPatch({
        [slug]: { outcome: draftOutcome, reason: trimmed.length > 0 ? trimmed : null }
      });
      setOpenSlug(null);
    },
    [customerId, draftOutcome, draftReason, onBanner, onOutcomesPatch]
  );

  const clearOutcome = useCallback(
    async (slug: CrmLenderSlug) => {
      setSavingSlug(slug);
      onBanner(null);
      const { error } = await deleteCustomerLenderOutcome(customerId, slug);
      setSavingSlug(null);
      if (error) {
        onBanner(error);
        return;
      }
      onOutcomesPatch({ [slug]: undefined });
      setOpenSlug(null);
    },
    [customerId, onBanner, onOutcomesPatch]
  );

  const renderGroup = (title: string, items: { slug: CrmLenderSlug; label: string }[]) => (
    <div className="crmLenderTier" key={title}>
      <div className="crmLenderIconRow">
        {items.map(({ slug, label }) => {
          const entry = outcomes[slug];
          const open = openSlug === slug;
          const busy = savingSlug === slug;
          const btnClass = [
            "crmLenderIconBtn",
            entry?.outcome === "approved" ? "crmLenderIconBtnApproved" : "",
            entry?.outcome === "conditional" ? "crmLenderIconBtnConditional" : "",
            entry?.outcome === "declined" ? "crmLenderIconBtnDeclined" : ""
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div className="crmLenderIconWrap" key={slug}>
              <button
                type="button"
                className={btnClass}
                disabled={busy}
                aria-haspopup="dialog"
                aria-expanded={open}
                title={iconHoverTitle(label, entry)}
                aria-label={iconAriaLabel(label, entry)}
                onClick={() => toggleSlug(slug)}
              >
                <CrmLenderLogo slug={slug} label={label} />
              </button>
              {open ? (
                <div className="crmLenderOutcomeMenu" role="group" aria-label={`${label} approval`}>
                  <p className="crmLenderOutcomeMenuHint">Status</p>
                  <div className="crmLenderOutcomePickRow">
                    {(
                      [
                        ["approved", "Approved"],
                        ["conditional", "Conditional"],
                        ["declined", "Declined"]
                      ] as const
                    ).map(([value, text]) => (
                      <button
                        key={value}
                        type="button"
                        className={
                          draftOutcome === value
                            ? "crmLenderOutcomePick crmLenderOutcomePickActive"
                            : "crmLenderOutcomePick"
                        }
                        aria-pressed={draftOutcome === value}
                        onClick={() => setDraftOutcome(value)}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                  <label className="crmLenderReasonLabel" htmlFor={`crm-lender-reason-${slug}`}>
                    Reason
                  </label>
                  <textarea
                    id={`crm-lender-reason-${slug}`}
                    className="crmLenderReasonInput loginInput"
                    rows={3}
                    maxLength={2000}
                    placeholder="Notes for this lender…"
                    value={draftReason}
                    onChange={(e) => setDraftReason(e.target.value)}
                    disabled={busy}
                  />
                  <div className="crmLenderOutcomeActions">
                    <button
                      type="button"
                      className="topBarSheetButton"
                      disabled={busy || !draftOutcome}
                      onClick={() => void saveDraft(slug)}
                    >
                      {busy ? "Saving…" : "Save"}
                    </button>
                  </div>
                  {entry ? (
                    <button
                      type="button"
                      className="crmLenderOutcomeItem crmLenderOutcomeClear"
                      disabled={busy}
                      onClick={() => void clearOutcome(slug)}
                    >
                      Clear status
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="crmLenderTierLabel">{title}</p>
    </div>
  );

  return (
    <aside className="crmCustomerLenderRail" aria-label="Lender outcomes" ref={wrapRef}>
      {renderGroup("Prime", PRIME)}
      {renderGroup("Subprime", SUBPRIME)}
    </aside>
  );
}
