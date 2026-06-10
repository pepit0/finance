import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import type {
  CrmCreditAppAttachment,
  CrmCreditAppAttachmentField,
  CrmCreditApplicationInfo,
  CrmCustomer,
  CrmUserDirectoryRow
} from "../../types/crm";
import {
  fetchSystemLeadCreditApplicationSeed,
  getCustomerCreditApplicationInfo,
  logCreditApplicationInfoUpdated,
  saveCustomerCreditApplicationInfo
} from "../../lib/crmApi";
import { CrmCreditAppLeadSheetPrint } from "./CrmCreditAppLeadSheetPrint";
import { CrmCreditAppLeadSheet } from "./CrmCreditAppLeadSheet";
import { collectMissingCreditAppFieldLabels, CrmCreditAppEditForm } from "./CrmCreditAppEditForm";
import { directoryPersonLabel, directoryUsername, isWebsiteLeadCustomer } from "../../utils/crmDirectoryAdmin";
import {
  buildCreditAppSummarySections
} from "../../utils/creditAppSummary";
import { formatCreditAppLegalName, formatCreditAppSaveFilename, sanitizePrintDocumentTitle } from "../../utils/creditAppName";

type CrmCreditAppInfoModalProps = {
  open: boolean;
  customer: CrmCustomer | null;
  directory: CrmUserDirectoryRow[];
  onClose: () => void;
  onSaved: () => void;
};

function formatLeadSheetTimestamp(date: Date): string {
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function leadSheetSourceLabel(customer: CrmCustomer): string {
  return isWebsiteLeadCustomer(customer) ? "Website pre-approval" : "CRM credit application";
}

function leadSheetAssigneeLabel(customer: CrmCustomer, directory: CrmUserDirectoryRow[]): string | null {
  if (!customer.assigned_to) {
    return null;
  }
  const row = directory.find((entry) => entry.user_id === customer.assigned_to);
  if (row) {
    return directoryUsername(row) ?? directoryPersonLabel(row);
  }
  return customer.assigned_to_email?.trim() || null;
}

function mergeSeedIntoInfo(base: CrmCreditApplicationInfo, seed: Partial<CrmCreditApplicationInfo>): CrmCreditApplicationInfo {
  const merged = { ...base };
  for (const [key, value] of Object.entries(seed)) {
    const field = key as keyof CrmCreditApplicationInfo;
    if (typeof value === "boolean") {
      if (!merged[field] && value) {
        (merged[field] as boolean) = value;
      }
      continue;
    }
    if (typeof value === "string" && !String(merged[field] ?? "").trim()) {
      (merged[field] as string) = value;
    }
  }
  return merged;
}

export function CrmCreditAppInfoModal({ open, customer, directory, onClose, onSaved }: CrmCreditAppInfoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<CrmCreditApplicationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [leadSheetPrintedAt, setLeadSheetPrintedAt] = useState(() => formatLeadSheetTimestamp(new Date()));

  useLayoutEffect(() => {
    const d = dialogRef.current;
    if (!d) {
      return;
    }
    if (open && customer) {
      if (!d.open) {
        d.showModal();
      }
    } else if (d.open) {
      d.close();
    }
  }, [open, customer?.id]);

  useEffect(() => {
    if (!open) {
      setForm(null);
      setLoading(false);
      setEditing(false);
      setBanner(null);
      return;
    }
    if (!customer) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setBanner(null);
    setEditing(false);
    const existing = getCustomerCreditApplicationInfo(customer);
    setForm(existing);
    void (async () => {
      const { data: seed, error } = await fetchSystemLeadCreditApplicationSeed(customer.id);
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (error) {
        setBanner(error);
        return;
      }
      if (seed) {
        setForm((prev) => (prev ? mergeSeedIntoInfo(prev, seed) : prev));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, customer?.id]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) {
      return;
    }
    const onDialogClose = () => {
      setBanner(null);
      onClose();
    };
    d.addEventListener("close", onDialogClose);
    return () => d.removeEventListener("close", onDialogClose);
  }, [onClose]);

  const handleClose = () => {
    dialogRef.current?.close();
  };

  const activeForm =
    open && customer ? form ?? getCustomerCreditApplicationInfo(customer) : null;

  const handlePrintLeadSheet = () => {
    if (!activeForm) {
      return;
    }
    flushSync(() => {
      setLeadSheetPrintedAt(formatLeadSheetTimestamp(new Date()));
    });
    const previousTitle = document.title;
    document.title = sanitizePrintDocumentTitle(
      formatCreditAppSaveFilename(activeForm, customer?.display_name ?? "")
    );
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    window.print();
  };

  const summarySections = useMemo(
    () => (activeForm ? buildCreditAppSummarySections(activeForm) : []),
    [activeForm]
  );

  const leadSheetCustomerName =
    (activeForm ? formatCreditAppLegalName(activeForm) : "") || customer?.display_name || "";
  const leadSheetAssignee = customer ? leadSheetAssigneeLabel(customer, directory) : null;
  const leadSheetSource = customer ? leadSheetSourceLabel(customer) : "CRM credit application";
  const leadSheetNotes = activeForm?.notes ?? "";
  const canPrintLeadSheet = Boolean(activeForm);

  const patchForm = (patch: Partial<CrmCreditApplicationInfo>) => {
    if (!customer) {
      return;
    }
    setForm((prev) => ({
      ...(prev ?? getCustomerCreditApplicationInfo(customer)),
      ...patch
    }));
  };

  const setField = (field: keyof CrmCreditApplicationInfo, value: string | boolean) => {
    patchForm({ [field]: value } as Partial<CrmCreditApplicationInfo>);
  };

  const setAttachment = (field: CrmCreditAppAttachmentField, attachment: CrmCreditAppAttachment | null) => {
    patchForm({ [field]: attachment });
  };

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customer || !activeForm) {
      return;
    }
    const missingLabels = collectMissingCreditAppFieldLabels(activeForm);
    if (missingLabels.length > 0) {
      const list = missingLabels.map((label) => `• ${label}`).join("\n");
      const saveAnyway = window.confirm(
        `${missingLabels.length} required field${missingLabels.length === 1 ? " is" : "s are"} still missing:\n\n${list}\n\nSave application anyway?`
      );
      if (!saveAnyway) {
        return;
      }
    }
    setSaving(true);
    setBanner(null);
    const saveRes = await saveCustomerCreditApplicationInfo(customer, activeForm);
    setSaving(false);
    if (saveRes.error) {
      setBanner(saveRes.error);
      return;
    }
    onSaved();
    void logCreditApplicationInfoUpdated(customer.id);
    dialogRef.current?.close();
  };

  if (!open || !customer || !activeForm) {
    return null;
  }

  return (
    <dialog ref={dialogRef} className="crmModal crmModalCreditApp" aria-labelledby="crm-credit-app-title">
      <div className="crmModalPanel crmCreditAppPanel">
        <header className="crmModalHeader">
          <div className="crmModalHeaderMain">
            <h2 id="crm-credit-app-title" className="crmModalTitle">
              {editing ? "Edit application" : "Credit application info"}
            </h2>
            {editing ? (
              <p className="crmModalSubtitle">
                {formatCreditAppLegalName(activeForm) || customer.display_name}
              </p>
            ) : null}
          </div>
          <div className="crmCreditAppHeaderActions">
            {!editing && canPrintLeadSheet ? (
              <button
                type="button"
                className="crmCreditAppPrintBtn"
                onClick={handlePrintLeadSheet}
                aria-label="Print lead sheet"
              >
                <svg className="crmCreditAppPrintIcon" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Zm-1 10h-2v-4H8v4H6v-5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5Zm2-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM18 3H6v4h12V3Z"
                  />
                </svg>
              </button>
            ) : null}
            {!editing ? (
              <button type="button" className="crmCreditAppHeaderEditBtn" onClick={() => setEditing(true)}>
                Edit Application
              </button>
            ) : null}
            <button type="button" className="crmModalClose" onClick={handleClose} aria-label="Close">
              ×
            </button>
          </div>
        </header>
        <form className="crmModalBody crmForm crmCreditAppForm" onSubmit={onSave}>
          <div className="crmCreditAppFormScroll">
            {banner ? (
              <p className={`crmBanner${editing ? " crmCreditAppFormBanner" : ""}`} role="alert">
                {banner}
              </p>
            ) : null}
            {loading ? <p className="crmMuted crmCreditAppFormLoading">Loading seeded data…</p> : null}
            {!editing ? (
              <div className="crmLeadSheetScreenRoot">
                <CrmCreditAppLeadSheet
                  variant="screen"
                  customerName={leadSheetCustomerName}
                  assigneeLabel={leadSheetAssignee}
                  sourceLabel={leadSheetSource}
                  notes={leadSheetNotes}
                  sections={summarySections.filter((section) => section.id !== "notes")}
                />
              </div>
            ) : (
            <CrmCreditAppEditForm
              form={activeForm}
              customerId={customer.id}
              customerName={customer.display_name}
              onFieldChange={setField}
              onAttachmentChange={setAttachment}
            />
            )}
          </div>
          <footer className="crmModalFooter crmModalFooterPinned">
            {editing ? (
              <button type="button" className="crmModalButtonSecondary" onClick={() => setEditing(false)}>
                Back to summary
              </button>
            ) : null}
            <button type="button" className="crmModalButtonSecondary" onClick={handleClose}>
              Close
            </button>
            {editing ? (
              <button type="submit" className="loginButton" disabled={saving}>
                {saving ? "Saving…" : "Save Application"}
              </button>
            ) : null}
          </footer>
        </form>
      </div>
      {canPrintLeadSheet
        ? createPortal(
            <CrmCreditAppLeadSheetPrint
              customerName={leadSheetCustomerName}
              assigneeLabel={leadSheetAssignee}
              sourceLabel={leadSheetSource}
              printedAt={leadSheetPrintedAt}
              notes={leadSheetNotes}
              sections={summarySections.filter((section) => section.id !== "notes")}
            />,
            document.body
          )
        : null}
    </dialog>
  );
}
