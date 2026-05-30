import type { CrmCreditAppAttachment } from "../../types/crm";
import type { CreditAppSummarySection } from "../../utils/creditAppSummary";
import logo from "../../assets/Tlogo.png";
import { CrmCreditAppAttachmentLinks } from "./CrmCreditAppAttachmentLinks";

export type CrmCreditAppLeadSheetProps = {
  customerName: string;
  assigneeLabel: string | null;
  sourceLabel: string;
  printedAt?: string;
  notes: string;
  sections: CreditAppSummarySection[];
  variant?: "print" | "screen";
};

function LeadSheetField({ label, value }: { label: string; value: string }) {
  return (
    <div className="crmLeadSheetField">
      <span className="crmLeadSheetFieldLabel">{label}</span>
      <span className="crmLeadSheetFieldValue">{value}</span>
    </div>
  );
}

function leadSheetUploadedLabel(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("driver")) {
    return "Driver's license uploaded";
  }
  if (normalized.includes("paystub")) {
    return "Paystubs uploaded";
  }
  if (normalized.includes("registration")) {
    return "Registration document uploaded";
  }
  return `${label} uploaded`;
}

function LeadSheetSection({
  title,
  items,
  attachments,
  compact,
  variant
}: {
  title: string;
  items: { label: string; value: string }[];
  attachments?: { label: string; attachment: CrmCreditAppAttachment }[];
  compact?: boolean;
  variant: "print" | "screen";
}) {
  if (items.length === 0 && (!attachments || attachments.length === 0)) {
    return null;
  }
  return (
    <section className={`crmLeadSheetSection${compact ? " crmLeadSheetSectionCompact" : ""}`}>
      <h3 className="crmLeadSheetSectionTitle">{title}</h3>
      {items.length > 0 ? (
        <div className="crmLeadSheetFieldGrid">
          {items.map((item) => (
            <LeadSheetField key={`${title}-${item.label}`} label={item.label} value={item.value} />
          ))}
        </div>
      ) : null}
      {attachments && attachments.length > 0 ? (
        variant === "screen" ? (
          <div className="crmLeadSheetAttachmentLinks">
            {attachments.map((item) => (
              <CrmCreditAppAttachmentLinks
                key={item.attachment.storage_path}
                label={item.label}
                attachment={item.attachment}
              />
            ))}
          </div>
        ) : (
          <ul className="crmLeadSheetAttachments">
            {attachments.map((item) => (
              <li key={`${item.label}-${item.attachment.file_name}`}>{leadSheetUploadedLabel(item.label)}</li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}

function sectionById(sections: CreditAppSummarySection[], id: string): CreditAppSummarySection | undefined {
  return sections.find((section) => section.id === id);
}

export function CrmCreditAppLeadSheet({
  customerName,
  assigneeLabel,
  sourceLabel,
  printedAt,
  notes,
  sections,
  variant = "print"
}: CrmCreditAppLeadSheetProps) {
  const vehicle = sectionById(sections, "vehicle");
  const applicant = sectionById(sections, "contact");
  const address = sectionById(sections, "address");
  const previousAddress = sectionById(sections, "previous-address");
  const homeMortgage = sectionById(sections, "home-mortgage");
  const employment = sectionById(sections, "employment");
  const previousJob = sectionById(sections, "previous-job");
  const trade = sectionById(sections, "trade");
  const consents = sectionById(sections, "consents-checks");
  const trimmedNotes = notes.trim();
  const sheetTitle = variant === "screen" ? "Credit application" : "Lead Sheet";

  return (
    <article className={`crmLeadSheet${variant === "screen" ? " crmLeadSheetScreen" : ""}`}>
      <header className="crmLeadSheetHeader">
        <div className="crmLeadSheetHeaderBrand">
          <img src={logo} alt="" className="crmLeadSheetLogo" decoding="async" />
          <span className="crmLeadSheetLogoAnchor" aria-hidden="true" />
          <div className="crmLeadSheetHeaderTitles">
            <p className="crmLeadSheetDealer">Temptation Motorsports</p>
            <h1 className="crmLeadSheetTitle">{sheetTitle}</h1>
          </div>
        </div>
        <div className="crmLeadSheetHeaderMeta">
          {printedAt ? (
            <p>
              <strong>Printed:</strong> {printedAt}
            </p>
          ) : null}
          <p>
            <strong>Source:</strong> {sourceLabel}
          </p>
          {assigneeLabel ? (
            <p>
              <strong>Lead assignee:</strong> {assigneeLabel}
            </p>
          ) : null}
        </div>
      </header>

      <section className="crmLeadSheetHero">
        <h2 className="crmLeadSheetApplicantName">{customerName}</h2>
        {applicant ? (
          <div className="crmLeadSheetHeroGrid">
            {applicant.items.map((item) => (
              <LeadSheetField key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        ) : null}
      </section>

      <div className="crmLeadSheetColumns">
        <div className="crmLeadSheetColumn">
          {vehicle ? (
            <LeadSheetSection title={vehicle.title} items={vehicle.items} attachments={vehicle.attachments} compact variant={variant} />
          ) : null}
          {address ? (
            <LeadSheetSection title={address.title} items={address.items} attachments={address.attachments} compact variant={variant} />
          ) : null}
          {!previousAddress && homeMortgage ? (
            <LeadSheetSection
              title={homeMortgage.title}
              items={homeMortgage.items}
              attachments={homeMortgage.attachments}
              compact
              variant={variant}
            />
          ) : null}
          {previousAddress ? (
            <LeadSheetSection
              title={previousAddress.title}
              items={previousAddress.items}
              attachments={previousAddress.attachments}
              compact
              variant={variant}
            />
          ) : null}
          {previousAddress && homeMortgage ? (
            <LeadSheetSection
              title={homeMortgage.title}
              items={homeMortgage.items}
              attachments={homeMortgage.attachments}
              compact
              variant={variant}
            />
          ) : null}
        </div>

        <div className="crmLeadSheetColumn">
          {employment ? (
            <LeadSheetSection
              title={employment.title}
              items={employment.items}
              attachments={employment.attachments}
              compact
              variant={variant}
            />
          ) : null}
          {previousJob ? (
            <LeadSheetSection
              title={previousJob.title}
              items={previousJob.items}
              attachments={previousJob.attachments}
              compact
              variant={variant}
            />
          ) : null}
        </div>

        <div className="crmLeadSheetColumn">
          {trade ? <LeadSheetSection title={trade.title} items={trade.items} compact variant={variant} /> : null}
          {consents ? (
            <LeadSheetSection title={consents.title} items={consents.items} attachments={consents.attachments} compact variant={variant} />
          ) : null}
        </div>
      </div>

      <footer className="crmLeadSheetFooter">
        <div className="crmLeadSheetNotes">
          <span className="crmLeadSheetNotesLabel">Finance manager notes</span>
          {trimmedNotes ? (
            <p className="crmLeadSheetNotesBody">{trimmedNotes}</p>
          ) : (
            <div className="crmLeadSheetNotesLines" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      </footer>
    </article>
  );
}
