import { useMemo } from "react";
import type { CrmCreditAppAttachment, CrmCreditAppAttachmentField, CrmCreditApplicationInfo } from "../../types/crm";
import { CrmCreditAppDocumentUpload } from "./CrmCreditAppDocumentUpload";
import {
  CANADIAN_PROVINCE_CODES,
  CANADIAN_PROVINCE_NAMES,
  normalizeCanadianProvinceCode
} from "../../utils/canadianProvince";
import {
  CREDIT_SCORE_BAND_OPTIONS,
  normalizeCreditScoreBandCode
} from "../../utils/creditScoreBand";
import { EMPLOYMENT_TYPE_OPTIONS, normalizeEmploymentTypeCode } from "../../utils/employmentType";
import {
  HOME_STATUS_OPTIONS,
  isHomeMonthlyPaymentOptional,
  normalizeHomeStatusCode,
  showHomeMonthlyPayment
} from "../../utils/homeStatus";
import {
  formatTenure,
  isTenureComplete,
  isTenureUnderTwoYears,
  parseTenure,
  TENURE_MONTH_OPTIONS,
  TENURE_YEAR_OPTIONS
} from "../../utils/tenure";

type CrmCreditAppEditFormProps = {
  form: CrmCreditApplicationInfo;
  customerId: string;
  customerName: string;
  onFieldChange: (field: keyof CrmCreditApplicationInfo, value: string | boolean) => void;
  onAttachmentChange: (field: CrmCreditAppAttachmentField, attachment: CrmCreditAppAttachment | null) => void;
};

type StringFieldKey = {
  [K in keyof CrmCreditApplicationInfo]: CrmCreditApplicationInfo[K] extends string ? K : never;
}[keyof CrmCreditApplicationInfo];

type TextFieldConfig = {
  kind: "text";
  key: StringFieldKey;
  label: string;
  optional?: boolean;
  fullWidth?: boolean;
  type?: "text" | "date" | "tel" | "email";
  placeholder?: string;
  provinceSelect?: boolean;
};

type TenureFieldConfig = {
  kind: "tenure";
  key: StringFieldKey;
  label: string;
  optional?: boolean;
  fullWidth?: boolean;
};

type CreditScoreFieldConfig = {
  kind: "creditScore";
  key: "credit_score_band";
  label: string;
  optional?: boolean;
  fullWidth?: boolean;
};

type HomeStatusFieldConfig = {
  kind: "homeStatus";
  key: "home_status";
  label: string;
  fullWidth?: boolean;
};

type EmploymentTypeFieldConfig = {
  kind: "employmentType";
  key: "employment_type";
  label: string;
  optional?: boolean;
  fullWidth?: boolean;
};

type FieldConfig =
  | TextFieldConfig
  | TenureFieldConfig
  | CreditScoreFieldConfig
  | HomeStatusFieldConfig
  | EmploymentTypeFieldConfig;

/** Fields for Home / mortgage — depends on `home_status`. */
export function buildHomeMortgageFieldConfigs(form: CrmCreditApplicationInfo): FieldConfig[] {
  const status = normalizeHomeStatusCode(form.home_status);
  const fields: FieldConfig[] = [{ kind: "homeStatus", key: "home_status", label: "Home", fullWidth: true }];
  if (!status) {
    return fields;
  }
  if (showHomeMonthlyPayment(status)) {
    fields.push({
      kind: "text",
      key: "home_monthly_payment_cad",
      label: "Monthly payment (CAD)",
      optional: isHomeMonthlyPaymentOptional(status),
      placeholder: "0.00"
    });
  }
  if (status === "own_mortgage") {
    fields.push(
      { kind: "text", key: "mortgage_amount_cad", label: "Mortgage amount (CAD)", placeholder: "0.00" },
      { kind: "text", key: "mortgage_holder", label: "Mortgage holder", fullWidth: true },
      { kind: "text", key: "home_market_value_cad", label: "Market value (CAD)", placeholder: "0.00" }
    );
  } else if (status === "own_clear") {
    fields.push(
      { kind: "text", key: "mortgage_amount_cad", label: "Mortgage amount (CAD)", placeholder: "0.00" },
      { kind: "text", key: "home_market_value_cad", label: "Market value (CAD)", placeholder: "0.00" }
    );
  }
  return fields;
}

type SectionConfig = {
  id: string;
  title: string;
  hint: string;
  fields: FieldConfig[];
};

const CONTACT_FIELDS: FieldConfig[] = [
  { kind: "text", key: "display_name", label: "Legal name", placeholder: "As on driver's licence" },
  { kind: "text", key: "date_of_birth", label: "Date of birth", type: "date" },
  { kind: "text", key: "phone", label: "Primary phone", type: "tel", placeholder: "10 digits" },
  { kind: "text", key: "secondary_phone", label: "Secondary phone", type: "tel", optional: true },
  { kind: "text", key: "email", label: "Email", type: "email", optional: true },
  { kind: "text", key: "sin", label: "SIN number", optional: true, placeholder: "XXX-XXX-XXX" },
  { kind: "creditScore", key: "credit_score_band", label: "Credit score", optional: true, fullWidth: true }
];

const ADDRESS_FIELDS: FieldConfig[] = [
  { kind: "text", key: "street", label: "Street address", fullWidth: true, placeholder: "Street number and name" },
  { kind: "text", key: "line2", label: "Unit / suite", optional: true, placeholder: "Apt, unit, etc." },
  { kind: "text", key: "city", label: "City" },
  { kind: "text", key: "province", label: "Province", provinceSelect: true },
  { kind: "text", key: "postal_code", label: "Postal code", placeholder: "A1A 1A1" },
  { kind: "tenure", key: "address_tenure", label: "Time at address", fullWidth: true }
];

const PREVIOUS_ADDRESS_FIELDS: FieldConfig[] = [
  { kind: "text", key: "previous_street", label: "Previous street", fullWidth: true },
  { kind: "text", key: "previous_city", label: "Previous city" },
  { kind: "text", key: "previous_province", label: "Previous province", provinceSelect: true },
  { kind: "text", key: "previous_postal_code", label: "Previous postal code", placeholder: "A1A 1A1" },
  { kind: "tenure", key: "previous_address_tenure", label: "Time at previous address", fullWidth: true }
];

const EMPLOYMENT_FIELDS: FieldConfig[] = [
  { kind: "text", key: "employment_status", label: "Employment status", placeholder: "Employed, self-employed…" },
  { kind: "employmentType", key: "employment_type", label: "Full-time / part-time", optional: true },
  { kind: "text", key: "employer", label: "Employer", placeholder: "Company name" },
  { kind: "text", key: "job_title", label: "Job title", optional: true },
  {
    kind: "text",
    key: "work_street",
    label: "Work address",
    fullWidth: true,
    placeholder: "Street number and name"
  },
  { kind: "text", key: "work_city", label: "Work city" },
  { kind: "text", key: "work_province", label: "Work province", provinceSelect: true },
  { kind: "tenure", key: "job_tenure", label: "Time at job", fullWidth: true },
  {
    kind: "text",
    key: "employment_other_description",
    label: "Other employment detail",
    optional: true,
    fullWidth: true,
    placeholder: "If status is other / mixed"
  },
  { kind: "text", key: "gross_monthly_income_cad", label: "Gross monthly income (CAD)", placeholder: "0.00" },
  {
    kind: "text",
    key: "other_monthly_income_cad",
    label: "Other monthly income (CAD)",
    optional: true,
    placeholder: "0.00"
  },
  {
    kind: "text",
    key: "other_income_description",
    label: "Other income description",
    optional: true,
    fullWidth: true,
    placeholder: "Child tax, disability, etc."
  }
];

const PREVIOUS_JOB_FIELDS: FieldConfig[] = [
  { kind: "text", key: "previous_employer", label: "Previous employer", fullWidth: true },
  { kind: "text", key: "previous_job_title", label: "Previous job title", optional: true },
  {
    kind: "text",
    key: "previous_work_street",
    label: "Previous work address",
    fullWidth: true,
    placeholder: "Street number and name"
  },
  { kind: "text", key: "previous_work_city", label: "Previous work city" },
  { kind: "text", key: "previous_work_province", label: "Previous work province", provinceSelect: true },
  { kind: "tenure", key: "previous_job_tenure", label: "Time at previous job", fullWidth: true }
];

const VEHICLE_FIELDS: FieldConfig[] = [
  {
    kind: "text",
    key: "vehicle_interest",
    label: "Vehicle / unit interest",
    fullWidth: true,
    placeholder: "Year, make, model, or general type"
  },
  { kind: "text", key: "monthly_budget_cad", label: "Monthly payment budget (CAD)", optional: true }
];

const BOAT_FIELDS: FieldConfig[] = [
  {
    kind: "text",
    key: "boat_motor_vin_serial",
    label: "Motor VIN / serial #",
    fullWidth: true,
    placeholder: "Motor identification"
  },
  {
    kind: "text",
    key: "boat_trailer_vin_serial",
    label: "Trailer VIN / serial #",
    fullWidth: true,
    placeholder: "Trailer identification"
  }
];

const TRADE_FIELDS: FieldConfig[] = [
  { kind: "text", key: "trade_year", label: "Trade year", placeholder: "2020" },
  { kind: "text", key: "trade_make", label: "Trade make" },
  { kind: "text", key: "trade_model", label: "Trade model" },
  { kind: "text", key: "trade_kms", label: "Trade kms", placeholder: "120000" },
  { kind: "text", key: "trade_vin", label: "VIN", optional: true, fullWidth: true }
];

function isFieldEmpty(form: CrmCreditApplicationInfo, key: StringFieldKey): boolean {
  return !String(form[key] ?? "").trim();
}

function isFieldMissing(form: CrmCreditApplicationInfo, field: FieldConfig): boolean {
  if (field.optional) {
    return false;
  }
  if (field.kind === "tenure") {
    return !isTenureComplete(form[field.key]);
  }
  return isFieldEmpty(form, field.key);
}

function TenureField({
  config,
  value,
  onChange,
  missing
}: {
  config: TenureFieldConfig;
  value: string;
  onChange: (next: string) => void;
  missing: boolean;
}) {
  const parsed = parseTenure(value);
  const fieldClass = `loginLabel crmCreditAppField${config.fullWidth ? " crmCreditAppFieldFull" : ""}${
    missing ? " crmCreditAppFieldMissing" : ""
  }`;

  const setYears = (years: string) => {
    onChange(formatTenure(years, parsed.months || (years ? "0" : "")));
  };

  const setMonths = (months: string) => {
    onChange(formatTenure(parsed.years || (months ? "0" : ""), months));
  };

  return (
    <div className={fieldClass}>
      <span className="crmCreditAppFieldLabel">
        {config.label}
        {config.optional ? <span className="crmOptional"> (optional)</span> : null}
      </span>
      <div className="crmCreditAppTenureRow">
        <label className="crmCreditAppTenurePart">
          <span className="crmCreditAppTenurePartLabel">Years</span>
          <select className="loginInput crmCreditAppSelect" value={parsed.years} onChange={(e) => setYears(e.target.value)}>
            <option value="">Select…</option>
            {TENURE_YEAR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="crmCreditAppTenurePart">
          <span className="crmCreditAppTenurePartLabel">Months</span>
          <select
            className="loginInput crmCreditAppSelect"
            value={parsed.months}
            onChange={(e) => setMonths(e.target.value)}
          >
            <option value="">Select…</option>
            {TENURE_MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function fieldsForSections(sections: SectionConfig[]): FieldConfig[] {
  return sections.flatMap((section) => section.fields);
}

function countMissingInFields(form: CrmCreditApplicationInfo, fields: FieldConfig[]): number {
  return fields.filter((field) => isFieldMissing(form, field)).length;
}

function missingLabelsForFields(form: CrmCreditApplicationInfo, fields: FieldConfig[]): string[] {
  return fields.filter((field) => isFieldMissing(form, field)).map((field) => field.label);
}

/** Required fields still empty — used before save-with-confirmation. */
export function collectMissingCreditAppFieldLabels(form: CrmCreditApplicationInfo): string[] {
  const missing: string[] = [];

  missing.push(...missingLabelsForFields(form, VEHICLE_FIELDS));
  missing.push(...missingLabelsForFields(form, CONTACT_FIELDS));
  missing.push(...missingLabelsForFields(form, ADDRESS_FIELDS));

  if (isTenureUnderTwoYears(form.address_tenure)) {
    missing.push(...missingLabelsForFields(form, PREVIOUS_ADDRESS_FIELDS));
  }

  missing.push(...missingLabelsForFields(form, buildHomeMortgageFieldConfigs(form)));

  missing.push(...missingLabelsForFields(form, EMPLOYMENT_FIELDS));

  if (isTenureUnderTwoYears(form.job_tenure)) {
    missing.push(...missingLabelsForFields(form, PREVIOUS_JOB_FIELDS));
  }

  if (form.has_trade) {
    missing.push(...missingLabelsForFields(form, TRADE_FIELDS));
  }

  if (!form.consent_contact) {
    missing.push("Consent to contact");
  }
  if (!form.consent_credit) {
    missing.push("Consent for credit check");
  }
  if (!form.check_drivers_license) {
    missing.push("Driver's licence");
  }
  if (!form.check_paystubs) {
    missing.push("Paystubs");
  }

  return missing;
}

function CreditAppField({
  config,
  form,
  onFieldChange
}: {
  config: FieldConfig;
  form: CrmCreditApplicationInfo;
  onFieldChange: CrmCreditAppEditFormProps["onFieldChange"];
}) {
  const missing = isFieldMissing(form, config);
  const fieldClass = `loginLabel crmCreditAppField${config.fullWidth ? " crmCreditAppFieldFull" : ""}${
    missing ? " crmCreditAppFieldMissing" : ""
  }`;

  const labelEl = (
    <span className="crmCreditAppFieldLabel">
      {config.label}
      {config.optional ? <span className="crmOptional"> (optional)</span> : null}
    </span>
  );

  if (config.kind === "tenure") {
    return (
      <TenureField
        config={config}
        value={form[config.key]}
        missing={missing}
        onChange={(next) => onFieldChange(config.key, next)}
      />
    );
  }

  if (config.kind === "creditScore") {
    const code = normalizeCreditScoreBandCode(form.credit_score_band);
    return (
      <label className={fieldClass}>
        {labelEl}
        <select
          className="loginInput crmCreditAppSelect"
          value={code}
          onChange={(e) => onFieldChange("credit_score_band", e.target.value)}
        >
          <option value="">Select credit score…</option>
          {CREDIT_SCORE_BAND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (config.kind === "homeStatus") {
    const code = normalizeHomeStatusCode(form.home_status);
    return (
      <label className={fieldClass}>
        {labelEl}
        <select
          className="loginInput crmCreditAppSelect"
          value={code}
          onChange={(e) => onFieldChange("home_status", e.target.value)}
        >
          <option value="">Select home status…</option>
          {HOME_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (config.kind === "employmentType") {
    const code = normalizeEmploymentTypeCode(form.employment_type);
    return (
      <label className={fieldClass}>
        {labelEl}
        <select
          className="loginInput crmCreditAppSelect"
          value={code}
          onChange={(e) => onFieldChange("employment_type", e.target.value)}
        >
          <option value="">Select…</option>
          {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (config.provinceSelect) {
    const code = normalizeCanadianProvinceCode(form[config.key]);
    return (
      <label className={fieldClass}>
        {labelEl}
        <select
          className="loginInput crmCreditAppSelect"
          value={code}
          onChange={(e) => onFieldChange(config.key, e.target.value)}
        >
          <option value="">Select province…</option>
          {CANADIAN_PROVINCE_CODES.map((provCode) => (
            <option key={provCode} value={provCode}>
              {CANADIAN_PROVINCE_NAMES[provCode]}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className={fieldClass}>
      {labelEl}
      <input
        className="loginInput"
        type={config.type ?? "text"}
        value={form[config.key]}
        placeholder={config.placeholder}
        onChange={(e) => onFieldChange(config.key, e.target.value)}
      />
    </label>
  );
}

function SectionBlock({
  section,
  form,
  onFieldChange,
  missingCount
}: {
  section: SectionConfig;
  form: CrmCreditApplicationInfo;
  onFieldChange: CrmCreditAppEditFormProps["onFieldChange"];
  missingCount: number;
}) {
  return (
    <section id={`credit-app-${section.id}`} className="crmCreditAppSectionCard">
      <header className="crmCreditAppSectionCardHead">
        <div>
          <h3 className="crmCreditAppSectionTitle">{section.title}</h3>
          <p className="crmCreditAppSectionHint">{section.hint}</p>
        </div>
        {missingCount > 0 ? (
          <span className="crmCreditAppMissingBadge">{missingCount} missing</span>
        ) : (
          <span className="crmCreditAppCompleteBadge">Complete</span>
        )}
      </header>
      <div className="crmCreditAppGrid">
        {section.fields.map((field) => (
          <CreditAppField key={field.key} config={field} form={form} onFieldChange={onFieldChange} />
        ))}
      </div>
    </section>
  );
}

export function CrmCreditAppEditForm({
  form,
  customerId,
  customerName,
  onFieldChange,
  onAttachmentChange
}: CrmCreditAppEditFormProps) {
  const requirePreviousAddress = isTenureUnderTwoYears(form.address_tenure);
  const requirePreviousJob = isTenureUnderTwoYears(form.job_tenure);
  const homeMortgageFields = useMemo(() => buildHomeMortgageFieldConfigs(form), [form]);

  const sections = useMemo((): SectionConfig[] => {
    const list: SectionConfig[] = [
      {
        id: "vehicle",
        title: "Vehicle",
        hint: "Unit they want to finance and payment budget",
        fields: VEHICLE_FIELDS
      },
      {
        id: "contact",
        title: "Applicant",
        hint: "Contact details for the credit application",
        fields: CONTACT_FIELDS
      },
      {
        id: "address",
        title: "Current address",
        hint: "Where the customer lives now",
        fields: ADDRESS_FIELDS
      },
      {
        id: "home-mortgage",
        title: "Home / mortgage details",
        hint: "Housing status, payment, and property values",
        fields: homeMortgageFields
      }
    ];
    if (requirePreviousAddress) {
      list.push({
        id: "previous-address",
        title: "Previous address",
        hint: "Required when time at current address is under 2 years",
        fields: PREVIOUS_ADDRESS_FIELDS
      });
    }
    list.push({
      id: "employment",
      title: "Employment & income",
      hint: "Confirm income amounts on your call",
      fields: EMPLOYMENT_FIELDS
    });
    if (requirePreviousJob) {
      list.push({
        id: "previous-job",
        title: "Previous employment",
        hint: "Required when time at current job is under 2 years",
        fields: PREVIOUS_JOB_FIELDS
      });
    }
    return list;
  }, [requirePreviousAddress, requirePreviousJob, homeMortgageFields]);

  const tradeMissing = form.has_trade ? countMissingInFields(form, TRADE_FIELDS) : 0;
  const consentsMissing =
    (form.consent_contact ? 0 : 1) +
    (form.consent_credit ? 0 : 1) +
    (form.check_drivers_license ? 0 : 1) +
    (form.check_paystubs ? 0 : 1);
  const requiredTrackableFields = useMemo(() => {
    const fields = fieldsForSections(sections).filter((field) => !field.optional);
    if (form.has_trade) {
      return [...fields, ...TRADE_FIELDS];
    }
    return fields;
  }, [sections, form.has_trade]);

  const totalRequired = requiredTrackableFields.length + 4;
  const totalMissing = useMemo(() => {
    let count = countMissingInFields(form, requiredTrackableFields);
    if (!form.consent_contact) {
      count += 1;
    }
    if (!form.consent_credit) {
      count += 1;
    }
    if (!form.check_drivers_license) {
      count += 1;
    }
    if (!form.check_paystubs) {
      count += 1;
    }
    return count;
  }, [form, requiredTrackableFields]);

  const filledRequired = totalRequired - totalMissing;
  const progressPct = totalRequired > 0 ? Math.round((filledRequired / totalRequired) * 100) : 0;

  const scrollToSection = (sectionId: string) => {
    document.getElementById(`credit-app-${sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="crmCreditAppEdit">
      <div className="crmCreditAppEditHero">
        <p className="crmCreditAppEditLead">
          Completing <strong>{customerName}</strong> — required empty fields are highlighted in yellow. Work top to
          bottom on your call.
        </p>
        <div className="crmCreditAppProgressWrap">
          <div className="crmCreditAppProgressMeta">
            <span className="crmCreditAppProgressLabel">
              {totalMissing === 0
                ? "All required fields complete"
                : `${totalMissing} required field${totalMissing === 1 ? "" : "s"} still needed`}
            </span>
            <span className="crmCreditAppProgressPct">{progressPct}%</span>
          </div>
          <div
            className="crmCreditAppProgressTrack"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="crmCreditAppProgressFill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <nav className="crmCreditAppSectionNav" aria-label="Credit application sections">
          {sections.map((section) => {
            const missing = countMissingInFields(form, section.fields);
            return (
              <button
                key={section.id}
                type="button"
                className={`crmCreditAppSectionNavBtn${missing > 0 ? " crmCreditAppSectionNavBtnAttention" : ""}`}
                onClick={() => scrollToSection(section.id)}
              >
                {section.title}
                {missing > 0 ? <span className="crmCreditAppSectionNavCount">{missing}</span> : null}
              </button>
            );
          })}
          <button
            type="button"
            className={`crmCreditAppSectionNavBtn${tradeMissing > 0 ? " crmCreditAppSectionNavBtnAttention" : ""}`}
            onClick={() => scrollToSection("trade")}
          >
            Trade
          </button>
          <button
            type="button"
            className={`crmCreditAppSectionNavBtn${consentsMissing > 0 ? " crmCreditAppSectionNavBtnAttention" : ""}`}
            onClick={() => scrollToSection("consents-checks")}
          >
            Consents & checks
          </button>
        </nav>
      </div>

      <div className="crmCreditAppEditSections">
        {sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            form={form}
            onFieldChange={onFieldChange}
            missingCount={countMissingInFields(form, section.fields)}
          />
        ))}

        <section id="credit-app-trade" className="crmCreditAppSectionCard">
          <header className="crmCreditAppSectionCardHead">
            <div>
              <h3 className="crmCreditAppSectionTitle">Trade</h3>
              <p className="crmCreditAppSectionHint">Trade-in, boat, and registration details</p>
            </div>
            {tradeMissing > 0 ? (
              <span className="crmCreditAppMissingBadge">{tradeMissing} missing</span>
            ) : (
              <span className="crmCreditAppCompleteBadge">Complete</span>
            )}
          </header>

          <div className="crmCreditAppTradeToggle">
            <label className="crmCheckboxLabel">
              <input
                type="checkbox"
                checked={form.has_trade}
                onChange={(e) => onFieldChange("has_trade", e.target.checked)}
              />
              Customer has a trade-in
            </label>
          </div>

          {form.has_trade ? (
            <>
              <div className="crmCreditAppGrid">
                {TRADE_FIELDS.map((field) => (
                  <CreditAppField key={field.key} config={field} form={form} onFieldChange={onFieldChange} />
                ))}
              </div>
              <fieldset className="crmCreditAppCheckDocRow">
                <label className="crmCheckboxLabel">
                  <input
                    type="checkbox"
                    checked={form.trade_has_registration}
                    onChange={(e) => onFieldChange("trade_has_registration", e.target.checked)}
                  />
                  <span>Registration</span>
                </label>
                {form.trade_has_registration ? (
                  <CrmCreditAppDocumentUpload
                    customerId={customerId}
                    kind="trade_registration"
                    label="Registration document"
                    attachment={form.trade_registration_file}
                    onAttachmentChange={onAttachmentChange}
                  />
                ) : null}
              </fieldset>
            </>
          ) : (
            <p className="crmMuted crmCreditAppTradeOff">No trade-in on this application.</p>
          )}

          <div className="crmCreditAppTradeToggle">
            <label className="crmCheckboxLabel">
              <input
                type="checkbox"
                checked={form.selling_boat}
                onChange={(e) => onFieldChange("selling_boat", e.target.checked)}
              />
              Selling a boat
            </label>
          </div>

          {form.selling_boat ? (
            <div className="crmCreditAppGrid crmCreditAppBoatGrid">
              {BOAT_FIELDS.map((field) => (
                <CreditAppField key={field.key} config={field} form={form} onFieldChange={onFieldChange} />
              ))}
            </div>
          ) : null}
        </section>

        <section id="credit-app-consents-checks" className="crmCreditAppSectionCard">
          <header className="crmCreditAppSectionCardHead">
            <div>
              <h3 className="crmCreditAppSectionTitle">Consents & checks</h3>
              <p className="crmCreditAppSectionHint">Credit consents and supporting documents</p>
            </div>
            {consentsMissing > 0 ? (
              <span className="crmCreditAppMissingBadge">{consentsMissing} missing</span>
            ) : (
              <span className="crmCreditAppCompleteBadge">Complete</span>
            )}
          </header>

          <div className="crmCreditAppConsentGrid">
            <label
              className={`crmCheckboxLabel crmCreditAppConsent${form.consent_contact ? "" : " crmCreditAppFieldMissing"}`}
            >
              <input
                type="checkbox"
                checked={form.consent_contact}
                onChange={(e) => onFieldChange("consent_contact", e.target.checked)}
              />
              <span>Consent to contact</span>
            </label>
            <label
              className={`crmCheckboxLabel crmCreditAppConsent${form.consent_credit ? "" : " crmCreditAppFieldMissing"}`}
            >
              <input
                type="checkbox"
                checked={form.consent_credit}
                onChange={(e) => onFieldChange("consent_credit", e.target.checked)}
              />
              <span>Consent for credit check</span>
            </label>
          </div>

          <div className="crmCreditAppChecksList">
            <fieldset
              className={`crmCreditAppCheckDocRow${form.check_drivers_license ? "" : " crmCreditAppCheckDocRowMissing"}`}
            >
              <label
                className={`crmCheckboxLabel crmCreditAppConsent${form.check_drivers_license ? "" : " crmCreditAppFieldMissing"}`}
              >
                <input
                  type="checkbox"
                  checked={form.check_drivers_license}
                  onChange={(e) => onFieldChange("check_drivers_license", e.target.checked)}
                />
                <span>Driver&apos;s licence</span>
              </label>
              {form.check_drivers_license ? (
                <CrmCreditAppDocumentUpload
                  customerId={customerId}
                  kind="drivers_license"
                  label="Driver's licence image"
                  attachment={form.drivers_license_file}
                  onAttachmentChange={onAttachmentChange}
                />
              ) : null}
            </fieldset>
            <fieldset
              className={`crmCreditAppCheckDocRow${form.check_paystubs ? "" : " crmCreditAppCheckDocRowMissing"}`}
            >
              <label
                className={`crmCheckboxLabel crmCreditAppConsent${form.check_paystubs ? "" : " crmCreditAppFieldMissing"}`}
              >
                <input
                  type="checkbox"
                  checked={form.check_paystubs}
                  onChange={(e) => onFieldChange("check_paystubs", e.target.checked)}
                />
                <span>Paystubs</span>
              </label>
              {form.check_paystubs ? (
                <CrmCreditAppDocumentUpload
                  customerId={customerId}
                  kind="paystubs"
                  label="Paystubs image"
                  attachment={form.paystubs_file}
                  onAttachmentChange={onAttachmentChange}
                />
              ) : null}
            </fieldset>
          </div>
        </section>
      </div>
    </div>
  );
}
