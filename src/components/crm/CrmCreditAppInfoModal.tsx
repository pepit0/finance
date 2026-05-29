import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
  CrmCreditAppAttachment,
  CrmCreditAppAttachmentField,
  CrmCreditApplicationInfo,
  CrmCustomer
} from "../../types/crm";
import {
  fetchSystemLeadCreditApplicationSeed,
  getCustomerCreditApplicationInfo,
  logCreditApplicationInfoUpdated,
  saveCustomerCreditApplicationInfo
} from "../../lib/crmApi";
import { CrmCreditAppAttachmentLinks } from "./CrmCreditAppAttachmentLinks";
import { collectMissingCreditAppFieldLabels, CrmCreditAppEditForm } from "./CrmCreditAppEditForm";
import { formatCanadianProvince } from "../../utils/canadianProvince";
import { formatPhoneDisplay } from "../../utils/phoneFormat";
import { formatCreditScoreBandDisplay } from "../../utils/creditScoreBand";
import { formatEmploymentTypeDisplay } from "../../utils/employmentType";
import { formatHomeStatusDisplay } from "../../utils/homeStatus";
import { formatTenureDisplay, isTenureUnderTwoYears } from "../../utils/tenure";

type CrmCreditAppInfoModalProps = {
  open: boolean;
  customer: CrmCustomer | null;
  onClose: () => void;
  onSaved: () => void;
};

type CreditAppSummaryItem = { label: string; value: string };

type CreditAppSummarySection = {
  id: string;
  title: string;
  items: CreditAppSummaryItem[];
  attachments?: { label: string; attachment: CrmCreditAppAttachment }[];
};

function trimField(value: string | undefined | null): string {
  return String(value ?? "").trim();
}

function addStringField(
  items: CreditAppSummaryItem[],
  label: string,
  value: string | undefined | null,
  format?: (v: string) => string
): void {
  const trimmed = trimField(value);
  if (!trimmed) {
    return;
  }
  items.push({ label, value: format ? format(trimmed) : trimmed });
}

function sectionHasContent(section: CreditAppSummarySection): boolean {
  return section.items.length > 0 || (section.attachments?.length ?? 0) > 0;
}

function buildCreditAppSummarySections(form: CrmCreditApplicationInfo): CreditAppSummarySection[] {
  const sections: CreditAppSummarySection[] = [];

  const vehicle: CreditAppSummaryItem[] = [];
  addStringField(vehicle, "Vehicle interest", form.vehicle_interest);
  addStringField(vehicle, "Monthly payment budget (CAD)", form.monthly_budget_cad);
  if (vehicle.length > 0) {
    sections.push({ id: "vehicle", title: "Vehicle", items: vehicle });
  }

  const applicant: CreditAppSummaryItem[] = [];
  addStringField(applicant, "Legal name", form.display_name);
  addStringField(applicant, "Date of birth", form.date_of_birth);
  addStringField(applicant, "Primary phone", form.phone, formatPhoneDisplay);
  addStringField(applicant, "Secondary phone", form.secondary_phone, formatPhoneDisplay);
  addStringField(applicant, "Email", form.email);
  addStringField(applicant, "SIN number", form.sin);
  addStringField(applicant, "Credit score", form.credit_score_band, formatCreditScoreBandDisplay);
  if (applicant.length > 0) {
    sections.push({ id: "contact", title: "Applicant", items: applicant });
  }

  const address: CreditAppSummaryItem[] = [];
  addStringField(address, "Street address", form.street);
  addStringField(address, "Unit / suite", form.line2);
  addStringField(address, "City", form.city);
  addStringField(address, "Province", form.province, formatCanadianProvince);
  addStringField(address, "Postal code", form.postal_code);
  addStringField(address, "Time at address", form.address_tenure, formatTenureDisplay);
  if (address.length > 0) {
    sections.push({ id: "address", title: "Current address", items: address });
  }

  const homeMortgage: CreditAppSummaryItem[] = [];
  addStringField(homeMortgage, "Home", form.home_status, formatHomeStatusDisplay);
  addStringField(homeMortgage, "Monthly payment (CAD)", form.home_monthly_payment_cad);
  addStringField(homeMortgage, "Mortgage amount (CAD)", form.mortgage_amount_cad);
  addStringField(homeMortgage, "Mortgage holder", form.mortgage_holder);
  addStringField(homeMortgage, "Market value (CAD)", form.home_market_value_cad);
  if (homeMortgage.length > 0) {
    sections.push({ id: "home-mortgage", title: "Home / mortgage details", items: homeMortgage });
  }

  if (isTenureUnderTwoYears(form.address_tenure)) {
    const previousAddress: CreditAppSummaryItem[] = [];
    addStringField(previousAddress, "Previous street", form.previous_street);
    addStringField(previousAddress, "Previous city", form.previous_city);
    addStringField(previousAddress, "Previous province", form.previous_province, formatCanadianProvince);
    addStringField(previousAddress, "Previous postal code", form.previous_postal_code);
    addStringField(previousAddress, "Time at previous address", form.previous_address_tenure, formatTenureDisplay);
    if (previousAddress.length > 0) {
      sections.push({ id: "previous-address", title: "Previous address", items: previousAddress });
    }
  }

  const employment: CreditAppSummaryItem[] = [];
  addStringField(employment, "Employment status", form.employment_status);
  addStringField(employment, "Full-time / part-time", form.employment_type, formatEmploymentTypeDisplay);
  addStringField(employment, "Employer", form.employer);
  addStringField(employment, "Job title", form.job_title);
  addStringField(employment, "Work address", form.work_street);
  addStringField(employment, "Work city", form.work_city);
  addStringField(employment, "Work province", form.work_province, formatCanadianProvince);
  addStringField(employment, "Time at job", form.job_tenure, formatTenureDisplay);
  addStringField(employment, "Other employment detail", form.employment_other_description);
  addStringField(employment, "Gross monthly income (CAD)", form.gross_monthly_income_cad);
  addStringField(employment, "Other monthly income (CAD)", form.other_monthly_income_cad);
  addStringField(employment, "Other income description", form.other_income_description);
  if (employment.length > 0) {
    sections.push({ id: "employment", title: "Employment & income", items: employment });
  }

  if (isTenureUnderTwoYears(form.job_tenure)) {
    const previousJob: CreditAppSummaryItem[] = [];
    addStringField(previousJob, "Previous employer", form.previous_employer);
    addStringField(previousJob, "Previous job title", form.previous_job_title);
    addStringField(previousJob, "Previous work address", form.previous_work_street);
    addStringField(previousJob, "Previous work city", form.previous_work_city);
    addStringField(previousJob, "Previous work province", form.previous_work_province, formatCanadianProvince);
    addStringField(previousJob, "Time at previous job", form.previous_job_tenure, formatTenureDisplay);
    if (previousJob.length > 0) {
      sections.push({ id: "previous-job", title: "Previous employment", items: previousJob });
    }
  }

  const trade: CreditAppSummaryItem[] = [];
  const tradeAttachments: CreditAppSummarySection["attachments"] = [];
  if (form.has_trade) {
    const tradeBefore = trade.length;
    addStringField(trade, "Trade year", form.trade_year);
    addStringField(trade, "Trade make", form.trade_make);
    addStringField(trade, "Trade model", form.trade_model);
    addStringField(trade, "Trade kms", form.trade_kms);
    addStringField(trade, "VIN", form.trade_vin);
    if (form.trade_has_registration) {
      trade.push({ label: "Registration", value: "Yes" });
    }
    if (trade.length === tradeBefore) {
      trade.push({ label: "Trade-in", value: "Yes" });
    }
  }
  if (form.selling_boat) {
    trade.push({ label: "Selling a boat", value: "Yes" });
    addStringField(trade, "Motor VIN / serial #", form.boat_motor_vin_serial);
    addStringField(trade, "Trailer VIN / serial #", form.boat_trailer_vin_serial);
  }
  if (form.trade_registration_file) {
    tradeAttachments.push({ label: "Registration document", attachment: form.trade_registration_file });
  }
  if (trade.length > 0 || tradeAttachments.length > 0) {
    sections.push({ id: "trade", title: "Trade", items: trade, attachments: tradeAttachments });
  }

  const consents: CreditAppSummaryItem[] = [];
  const consentAttachments: CreditAppSummarySection["attachments"] = [];
  if (form.consent_contact) {
    consents.push({ label: "Consent to contact", value: "Yes" });
  }
  if (form.consent_credit) {
    consents.push({ label: "Consent for credit check", value: "Yes" });
  }
  if (form.check_drivers_license) {
    consents.push({ label: "Driver's licence", value: "Collected" });
  }
  if (form.check_paystubs) {
    consents.push({ label: "Paystubs", value: "Collected" });
  }
  if (form.drivers_license_file) {
    consentAttachments.push({ label: "Driver's licence", attachment: form.drivers_license_file });
  }
  if (form.paystubs_file) {
    consentAttachments.push({ label: "Paystubs", attachment: form.paystubs_file });
  }
  if (consents.length > 0 || consentAttachments.length > 0) {
    sections.push({
      id: "consents-checks",
      title: "Consents & checks",
      items: consents,
      attachments: consentAttachments
    });
  }

  return sections.filter(sectionHasContent);
}

function CrmCreditAppReadSummary({ sections }: { sections: CreditAppSummarySection[] }) {
  return (
    <div className="crmCreditAppReadSections">
      {sections.map((section) => (
        <section
          key={section.id}
          className="crmCreditAppSectionCard crmCreditAppReadSection"
          aria-labelledby={`credit-app-read-${section.id}`}
        >
          <header className="crmCreditAppSectionCardHead crmCreditAppReadSectionHead">
            <h3 id={`credit-app-read-${section.id}`} className="crmCreditAppSectionTitle">
              {section.title}
            </h3>
          </header>
          {section.items.length > 0 ? (
            <dl className="crmCreditAppReadFields">
              {section.items.map((item) => (
                <div key={`${section.id}-${item.label}`} className="crmCreditAppReadField">
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {section.attachments && section.attachments.length > 0 ? (
            <div className="crmCreditAppReadAttachments">
              {section.attachments.map((item) => (
                <CrmCreditAppAttachmentLinks
                  key={item.attachment.storage_path}
                  label={item.label}
                  attachment={item.attachment}
                />
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
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

export function CrmCreditAppInfoModal({ open, customer, onClose, onSaved }: CrmCreditAppInfoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<CrmCreditApplicationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

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

  const summarySections = useMemo(
    () => (activeForm ? buildCreditAppSummarySections(activeForm) : []),
    [activeForm]
  );

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
    if (saveRes.error) {
      setSaving(false);
      setBanner(saveRes.error);
      return;
    }
    const logRes = await logCreditApplicationInfoUpdated(customer.id);
    setSaving(false);
    if (logRes.error) {
      setBanner(`Credit app info saved, but history could not be updated: ${logRes.error}`);
      onSaved();
      return;
    }
    onSaved();
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
            {editing ? <p className="crmModalSubtitle">{customer.display_name}</p> : null}
          </div>
          <button type="button" className="crmModalClose" onClick={handleClose} aria-label="Close">
            ×
          </button>
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
              <div className="crmCreditAppRead">
                {summarySections.length === 0 ? (
                  <p className="crmMuted">No credit application details on file yet.</p>
                ) : (
                  <CrmCreditAppReadSummary sections={summarySections} />
                )}
                <button type="button" className="crmTextButton" onClick={() => setEditing(true)}>
                  Edit Application
                </button>
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
    </dialog>
  );
}
