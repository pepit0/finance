import { useRef, useState } from "react";
import type { CrmCreditAppAttachment, CrmCreditAppAttachmentField } from "../../types/crm";
import { removeCreditAppDocument, uploadCreditAppDocument } from "../../lib/crmCreditAppDocuments";
import type { CrmCreditAppDocumentKind } from "../../utils/crmCreditAppAttachment";
import { CREDIT_APP_ATTACHMENT_FIELD_BY_KIND } from "../../utils/crmCreditAppAttachment";

type CrmCreditAppDocumentUploadProps = {
  customerId: string;
  kind: CrmCreditAppDocumentKind;
  label: string;
  files: CrmCreditAppAttachment[];
  multiple?: boolean;
  onFilesChange: (field: CrmCreditAppAttachmentField, files: CrmCreditAppAttachment[]) => void;
};

export function CrmCreditAppDocumentUpload({
  customerId,
  kind,
  label,
  files,
  multiple = false,
  onFilesChange
}: CrmCreditAppDocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = CREDIT_APP_ATTACHMENT_FIELD_BY_KIND[kind];

  const uploadOne = async (file: File, replacePath?: string | null) => {
    const { data, error: uploadError } = await uploadCreditAppDocument(customerId, kind, file, replacePath);
    if (uploadError || !data) {
      return { data: null, error: uploadError ?? "Upload failed." };
    }
    return { data, error: null };
  };

  const onPickFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }
    const picked = Array.from(fileList);
    setBusy(true);
    setError(null);

    if (!multiple) {
      const file = picked[0];
      const replacePath = files[0]?.storage_path ?? null;
      const { data, error: uploadError } = await uploadOne(file, replacePath);
      setBusy(false);
      if (uploadError || !data) {
        setError(uploadError ?? "Upload failed.");
        return;
      }
      onFilesChange(field, [data]);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    const nextFiles = [...files];
    for (const file of picked) {
      const { data, error: uploadError } = await uploadOne(file);
      if (uploadError || !data) {
        setBusy(false);
        setError(uploadError ?? "Upload failed.");
        onFilesChange(field, nextFiles);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        return;
      }
      nextFiles.push(data);
    }

    setBusy(false);
    onFilesChange(field, nextFiles);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const onRemoveAt = async (index: number) => {
    const target = files[index];
    if (!target) {
      return;
    }
    setBusy(true);
    setError(null);
    const { error: removeError } = await removeCreditAppDocument(target.storage_path);
    setBusy(false);
    if (removeError) {
      setError(removeError);
      return;
    }
    onFilesChange(
      field,
      files.filter((_, i) => i !== index)
    );
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const uploadLabel = multiple ? (files.length > 0 ? "Add files" : "Upload files") : files.length > 0 ? "Replace" : "Upload file";

  return (
    <div className="crmCreditAppDocUpload">
      <p className="crmCreditAppDocUploadLabel">{label}</p>
      {files.length > 0 ? (
        <ul className="crmCreditAppDocUploadList">
          {files.map((file, index) => (
            <li key={file.storage_path} className="crmCreditAppDocUploadListItem">
              <span className="crmCreditAppDocUploadFile" title={file.file_name}>
                {file.file_name}
              </span>
              <button
                type="button"
                className="crmTextButton crmCreditAppDocUploadRemove"
                disabled={busy}
                onClick={() => void onRemoveAt(index)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="crmMuted crmCreditAppDocUploadEmpty">No files uploaded</p>
      )}
      <div className="crmCreditAppDocUploadActions">
        <button
          type="button"
          className="crmModalButtonSecondary crmCreditAppDocUploadBtn"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Working…" : uploadLabel}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="crmVisuallyHidden"
        accept="image/*,application/pdf"
        multiple={multiple}
        disabled={busy}
        onChange={(e) => {
          void onPickFiles(e.target.files);
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
