import { useCallback, useEffect, useRef, useState } from "react";
import type { CrmLenderConfig, CrmLenderOutcome, CrmLenderOutcomeEntry, CrmLenderSlug } from "../../types/crm";
import { deleteCustomerLenderOutcome, upsertCustomerLenderOutcome } from "../../lib/crmApi";
import { useCrmLendersContext } from "../../context/CrmLendersContext";
import { CrmLenderLogo } from "./crmLenderLogos";

function outcomeLabel(o: CrmLenderOutcome): string {
  if (o === "conditional") {
    return "Conditionally approved";
  }
  if (o === "approved") {
    return "Approved";
  }
  if (o === "pending") {
    return "Pending";
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
  isMobileLayout?: boolean;
};

export function CrmCustomerLenderRail({
  customerId,
  outcomes,
  onOutcomesPatch,
  onBanner,
  isMobileLayout = false
}: CrmCustomerLenderRailProps) {
  const { primeLenders, subprimeLenders, financeEnabled } = useCrmLendersContext();
  const [openSlug, setOpenSlug] = useState<CrmLenderSlug | null>(null);
  const [draftOutcome, setDraftOutcome] = useState<CrmLenderOutcome | null>(null);
  const [draftReason, setDraftReason] = useState("");
  const [savingSlug, setSavingSlug] = useState<CrmLenderSlug | null>(null);
  const wrapRef = useRef<HTMLElement>(null);

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
        onBanner("Choose Pending, Approved, Conditional, or Declined before saving.");
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

  const renderIconRow = (items: CrmLenderConfig[]) => (
    <div className="crmLenderIconRow">
      {items.map((lender) => {
        const { slug, label } = lender;
        const entry = outcomes[slug];
        const open = openSlug === slug;
        const busy = savingSlug === slug;
        const btnClass = [
          "crmLenderIconBtn",
          entry?.outcome === "approved" ? "crmLenderIconBtnApproved" : "",
          entry?.outcome === "conditional" ? "crmLenderIconBtnConditional" : "",
          entry?.outcome === "declined" ? "crmLenderIconBtnDeclined" : "",
          entry?.outcome === "pending" ? "crmLenderIconBtnPending" : ""
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
              <CrmLenderLogo lender={lender} />
            </button>
            {open ? (
              <div className="crmLenderOutcomeMenu" role="group" aria-label={`${label} approval`}>
                <p className="crmLenderOutcomeMenuHint">Status</p>
                <div className="crmLenderOutcomePickRow">
                  {(
                    [
                      ["pending", "Pending"],
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
  );

  const renderGroup = (title: string, items: CrmLenderConfig[]) => (
    <div className="crmLenderTier" key={title}>
      {renderIconRow(items)}
      <p className="crmLenderTierLabel">{title}</p>
    </div>
  );

  if (!financeEnabled) {
    return null;
  }

  if (isMobileLayout) {
    return (
      <details
        className="crmCustomerLenderRail crmCustomerLenderRailCollapsible"
        aria-label="Lender outcomes"
        ref={wrapRef}
        onToggle={(event) => {
          if (!(event.currentTarget as HTMLDetailsElement).open) {
            setOpenSlug(null);
          }
        }}
      >
        <summary className="crmCustomerLenderRailSummary">
          <span className="crmCustomerLenderRailSummaryTitle">Lenders</span>
          <span className="crmCustomerLenderRailChevron" aria-hidden="true" />
        </summary>
        <div className="crmCustomerLenderRailBody">
          {renderGroup("Prime", primeLenders)}
          {renderGroup("Subprime", subprimeLenders)}
        </div>
      </details>
    );
  }

  return (
    <aside className="crmCustomerLenderRail" aria-label="Lender outcomes" ref={wrapRef}>
      {renderGroup("Prime", primeLenders)}
      {renderGroup("Subprime", subprimeLenders)}
    </aside>
  );
}
