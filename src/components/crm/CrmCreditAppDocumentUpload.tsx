import { useRef, useState } from "react";
import type { CrmCreditAppAttachment, CrmCreditAppAttachmentField } from "../../types/crm";
import { removeCreditAppDocument, uploadCreditAppDocument } from "../../lib/crmCreditAppDocuments";
import type { CrmCreditAppDocumentKind } from "../../utils/crmCreditAppAttachment";
import { CREDIT_APP_ATTACHMENT_FIELD_BY_KIND } from "../../utils/crmCreditAppAttachment";

type CrmCreditAppDocumentUploadProps = {
  customerId: string;
  kind: CrmCreditAppDocumentKind;
  label: string;
  attachment: CrmCreditAppAttachment | null;
  onAttachmentChange: (field: CrmCreditAppAttachmentField, attachment: CrmCreditAppAttachment | null) => void;
};

export function CrmCreditAppDocumentUpload({
  customerId,
  kind,
  label,
  attachment,
  onAttachmentChange
}: CrmCreditAppDocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = CREDIT_APP_ATTACHMENT_FIELD_BY_KIND[kind];

  const onPickFile = async (file: File | null) => {
    if (!file) {
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: uploadError } = await uploadCreditAppDocument(
      customerId,
      kind,
      file,
      attachment?.storage_path
    );
    setBusy(false);
    if (uploadError || !data) {
      setError(uploadError ?? "Upload failed.");
      return;
    }
    onAttachmentChange(field, data);
  };

  const onRemove = async () => {
    if (!attachment) {
      return;
    }
    setBusy(true);
    setError(null);
    const { error: removeError } = await removeCreditAppDocument(attachment.storage_path);
    setBusy(false);
    if (removeError) {
      setError(removeError);
      return;
    }
    onAttachmentChange(field, null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="crmCreditAppDocUpload">
      <p className="crmCreditAppDocUploadLabel">{label}</p>
      {attachment ? (
        <p className="crmCreditAppDocUploadFile" title={attachment.file_name}>
          {attachment.file_name}
        </p>
      ) : (
        <p className="crmMuted crmCreditAppDocUploadEmpty">No file uploaded</p>
      )}
      <div className="crmCreditAppDocUploadActions">
        <button
          type="button"
          className="crmModalButtonSecondary crmCreditAppDocUploadBtn"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Working…" : attachment ? "Replace" : "Upload image"}
        </button>
        {attachment ? (
          <button
            type="button"
            className="crmTextButton crmCreditAppDocUploadRemove"
            disabled={busy}
            onClick={() => void onRemove()}
          >
            Remove
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="crmVisuallyHidden"
        accept="image/*,application/pdf"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          void onPickFile(file);
        }}
      />
      {error ? (
        <p className="crmBanner crmCreditAppDocUploadError" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
