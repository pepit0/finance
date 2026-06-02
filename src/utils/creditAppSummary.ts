import type { CrmCreditAppAttachment, CrmCreditApplicationInfo } from "../types/crm";
import { formatCanadianProvince } from "./canadianProvince";
import { formatCreditScoreBandDisplay } from "./creditScoreBand";
import { formatEmploymentTypeDisplay } from "./employmentType";
import { formatHomeStatusDisplay, normalizeHomeStatusCode, showHomeMonthlyPayment } from "./homeStatus";
import { formatMonthlyBudgetCadDisplay } from "./monthlyBudgetCad";
import { formatPhoneDisplay } from "./phoneFormat";
import { formatTenureDisplay, isTenureUnderTwoYears } from "./tenure";

export type CreditAppSummaryItem = { label: string; value: string };

export type CreditAppSummarySection = {
  id: string;
  title: string;
  items: CreditAppSummaryItem[];
  attachments?: { label: string; attachment: CrmCreditAppAttachment }[];
};

const EMPTY_VALUE = "—";

function summaryValue(value: string | null | undefined, format?: (v: string) => string): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return EMPTY_VALUE;
  }
  return format ? format(trimmed) : trimmed;
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function collected(value: boolean): string {
  return value ? "Collected" : "Not collected";
}

function uploaded(hasFile: boolean): string {
  return hasFile ? "Uploaded" : "Not uploaded";
}

function buildHomeMortgageSummaryItems(form: CrmCreditApplicationInfo): CreditAppSummaryItem[] {
  const status = normalizeHomeStatusCode(form.home_status);
  const items: CreditAppSummaryItem[] = [
    { label: "Home", value: summaryValue(form.home_status, formatHomeStatusDisplay) }
  ];
  if (!status) {
    return items;
  }
  if (showHomeMonthlyPayment(status)) {
    items.push({ label: "Monthly payment", value: summaryValue(form.home_monthly_payment_cad) });
  }
  if (status === "own_mortgage") {
    items.push(
      { label: "Mortgage amount", value: summaryValue(form.mortgage_amount_cad) },
      { label: "Mortgage holder", value: summaryValue(form.mortgage_holder) },
      { label: "Market value", value: summaryValue(form.home_market_value_cad) }
    );
  } else if (status === "own_clear") {
    items.push(
      { label: "Mortgage amount", value: summaryValue(form.mortgage_amount_cad) },
      { label: "Market value", value: summaryValue(form.home_market_value_cad) }
    );
  }
  return items;
}

export function buildCreditAppSummarySections(form: CrmCreditApplicationInfo): CreditAppSummarySection[] {
  const tradeAttachments: CreditAppSummarySection["attachments"] = [];
  if (form.trade_registration_file) {
    tradeAttachments.push({ label: "Registration document", attachment: form.trade_registration_file });
  }

  const consentAttachments: CreditAppSummarySection["attachments"] = [];
  if (form.drivers_license_file) {
    consentAttachments.push({ label: "Driver's licence", attachment: form.drivers_license_file });
  }
  if (form.paystubs_file) {
    consentAttachments.push({ label: "Paystubs", attachment: form.paystubs_file });
  }

  const sections: CreditAppSummarySection[] = [
    {
      id: "vehicle",
      title: "Vehicle",
      items: [
        { label: "Vehicle interest", value: summaryValue(form.vehicle_interest) },
        { label: "Monthly payment budget", value: summaryValue(form.monthly_budget_cad, formatMonthlyBudgetCadDisplay) },
        { label: "Down payment", value: summaryValue(form.down_payment_cad) }
      ]
    },
    {
      id: "contact",
      title: "Applicant",
      items: [
        { label: "First name", value: summaryValue(form.first_name) },
        { label: "Middle name", value: summaryValue(form.middle_name) },
        { label: "Last name", value: summaryValue(form.last_name) },
        { label: "Date of birth", value: summaryValue(form.date_of_birth) },
        { label: "Primary phone", value: summaryValue(form.phone, formatPhoneDisplay) },
        { label: "Secondary phone", value: summaryValue(form.secondary_phone, formatPhoneDisplay) },
        { label: "Email", value: summaryValue(form.email) },
        { label: "SIN number", value: summaryValue(form.sin) },
        { label: "Credit score", value: summaryValue(form.credit_score_band, formatCreditScoreBandDisplay) }
      ]
    },
    {
      id: "address",
      title: "Current address",
      items: [
        { label: "Street address", value: summaryValue(form.street) },
        { label: "Unit / suite", value: summaryValue(form.line2) },
        { label: "City", value: summaryValue(form.city) },
        { label: "Province", value: summaryValue(form.province, formatCanadianProvince) },
        { label: "Postal code", value: summaryValue(form.postal_code) },
        { label: "Time at address", value: summaryValue(form.address_tenure, formatTenureDisplay) }
      ]
    }
  ];

  if (isTenureUnderTwoYears(form.address_tenure)) {
    sections.push({
      id: "previous-address",
      title: "Previous address",
      items: [
        { label: "Previous street", value: summaryValue(form.previous_street) },
        { label: "Previous city", value: summaryValue(form.previous_city) },
        { label: "Previous province", value: summaryValue(form.previous_province, formatCanadianProvince) },
        { label: "Previous postal code", value: summaryValue(form.previous_postal_code) },
        {
          label: "Time at previous address",
          value: summaryValue(form.previous_address_tenure, formatTenureDisplay)
        }
      ]
    });
  }

  sections.push(
    {
      id: "home-mortgage",
      title: "Home / mortgage details",
      items: buildHomeMortgageSummaryItems(form)
    },
    {
      id: "employment",
      title: "Employment & income",
      items: [
        { label: "Employment status", value: summaryValue(form.employment_status) },
        { label: "Full-time / part-time", value: summaryValue(form.employment_type, formatEmploymentTypeDisplay) },
        { label: "Employer", value: summaryValue(form.employer) },
        { label: "Job title", value: summaryValue(form.job_title) },
        { label: "Work address", value: summaryValue(form.work_street) },
        { label: "Work city", value: summaryValue(form.work_city) },
        { label: "Work province", value: summaryValue(form.work_province, formatCanadianProvince) },
        { label: "Time at job", value: summaryValue(form.job_tenure, formatTenureDisplay) },
        { label: "Other employment detail", value: summaryValue(form.employment_other_description) },
        { label: "Gross monthly income", value: summaryValue(form.gross_monthly_income_cad) },
        { label: "Other monthly income", value: summaryValue(form.other_monthly_income_cad) },
        { label: "Other income description", value: summaryValue(form.other_income_description) }
      ]
    }
  );

  if (isTenureUnderTwoYears(form.job_tenure)) {
    sections.push({
      id: "previous-job",
      title: "Previous employment",
      items: [
        { label: "Previous employer", value: summaryValue(form.previous_employer) },
        { label: "Previous job title", value: summaryValue(form.previous_job_title) },
        { label: "Previous work address", value: summaryValue(form.previous_work_street) },
        { label: "Previous work city", value: summaryValue(form.previous_work_city) },
        {
          label: "Previous work province",
          value: summaryValue(form.previous_work_province, formatCanadianProvince)
        },
        { label: "Time at previous job", value: summaryValue(form.previous_job_tenure, formatTenureDisplay) }
      ]
    });
  }

  sections.push({
    id: "trade",
    title: "Trade",
    items: form.has_trade
      ? [
          { label: "Trade-in", value: yesNo(form.has_trade) },
          { label: "Trade year", value: summaryValue(form.trade_year) },
          { label: "Trade make", value: summaryValue(form.trade_make) },
          { label: "Trade model", value: summaryValue(form.trade_model) },
          { label: "Trade kms", value: summaryValue(form.trade_kms) },
          { label: "VIN", value: summaryValue(form.trade_vin) },
          { label: "Registration", value: yesNo(form.trade_has_registration) },
          { label: "Registration document", value: uploaded(Boolean(form.trade_registration_file)) }
        ]
      : [{ label: "Trade-in", value: "No" }],
    attachments: form.has_trade ? tradeAttachments : undefined
  });

  sections.push(
    {
      id: "consents-checks",
      title: "Consents & checks",
      items: [
        { label: "Consent to contact", value: yesNo(form.consent_contact) },
        { label: "Consent for credit check", value: yesNo(form.consent_credit) },
        { label: "Driver's licence", value: collected(form.check_drivers_license) },
        { label: "Driver's licence document", value: uploaded(Boolean(form.drivers_license_file)) },
        { label: "Paystubs", value: collected(form.check_paystubs) },
        { label: "Paystubs document", value: uploaded(Boolean(form.paystubs_file)) },
        { label: "Co-signer", value: yesNo(form.has_co_signer) },
        { label: "Co-signer details", value: summaryValue(form.co_signer_details) }
      ],
      attachments: consentAttachments
    },
    {
      id: "notes",
      title: "Notes",
      items: [{ label: "Lead sheet notes", value: summaryValue(form.notes) }]
    }
  );

  return sections;
}
