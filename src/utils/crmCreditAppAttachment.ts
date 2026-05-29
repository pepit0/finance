import type { CrmCreditAppAttachment, CrmCreditAppAttachmentField } from "../types/crm";

export type CrmCreditAppDocumentKind = "drivers_license" | "paystubs" | "trade_registration";

export const CREDIT_APP_ATTACHMENT_FIELD_BY_KIND: Record<CrmCreditAppDocumentKind, CrmCreditAppAttachmentField> = {
  drivers_license: "drivers_license_file",
  paystubs: "paystubs_file",
  trade_registration: "trade_registration_file"
};

export function normalizeCreditAppAttachment(value: unknown): CrmCreditAppAttachment | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const storage_path = typeof row.storage_path === "string" ? row.storage_path.trim() : "";
  if (!storage_path) {
    return null;
  }
  return {
    storage_path,
    file_name: typeof row.file_name === "string" && row.file_name.trim() ? row.file_name.trim() : "document",
    content_type:
      typeof row.content_type === "string" && row.content_type.trim()
        ? row.content_type.trim()
        : "application/octet-stream",
    uploaded_at:
      typeof row.uploaded_at === "string" && row.uploaded_at.trim()
        ? row.uploaded_at.trim()
        : new Date().toISOString()
  };
}

export function creditAppAttachmentsFromForm(form: {
  drivers_license_file: CrmCreditAppAttachment | null;
  paystubs_file: CrmCreditAppAttachment | null;
  trade_registration_file: CrmCreditAppAttachment | null;
}): { label: string; attachment: CrmCreditAppAttachment }[] {
  const rows: { label: string; attachment: CrmCreditAppAttachment }[] = [];
  if (form.drivers_license_file) {
    rows.push({ label: "Driver's licence", attachment: form.drivers_license_file });
  }
  if (form.paystubs_file) {
    rows.push({ label: "Paystubs", attachment: form.paystubs_file });
  }
  if (form.trade_registration_file) {
    rows.push({ label: "Trade registration", attachment: form.trade_registration_file });
  }
  return rows;
}
