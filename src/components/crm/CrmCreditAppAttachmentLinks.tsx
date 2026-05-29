import { useState } from "react";
import type { CrmCreditAppAttachment } from "../../types/crm";
import { getCreditAppDocumentSignedUrl } from "../../lib/crmCreditAppDocuments";

type CrmCreditAppAttachmentLinksProps = {
  label: string;
  attachment: CrmCreditAppAttachment;
};

export function CrmCreditAppAttachmentLinks({ label, attachment }: CrmCreditAppAttachmentLinksProps) {
  const [busy, setBusy] = useState<"view" | "download" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openSigned = async (download: boolean) => {
    setBusy(download ? "download" : "view");
    setError(null);
    const { url, error: urlError } = await getCreditAppDocumentSignedUrl(attachment, { download });
    setBusy(null);
    if (urlError || !url) {
      setError(urlError ?? "Could not open document.");
      return;
    }
    if (download) {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = attachment.file_name;
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <article className="crmCreditAppAttachmentCard">
      <p className="crmCreditAppAttachmentCardLabel">{label}</p>
      <p className="crmCreditAppAttachmentCardName" title={attachment.file_name}>
        {attachment.file_name}
      </p>
      <div className="crmCreditAppAttachmentCardActions">
        <button
          type="button"
          className="crmTextButton"
          disabled={busy !== null}
          onClick={() => void openSigned(false)}
        >
          {busy === "view" ? "Opening…" : "View"}
        </button>
        <button
          type="button"
          className="crmTextButton"
          disabled={busy !== null}
          onClick={() => void openSigned(true)}
        >
          {busy === "download" ? "Preparing…" : "Download"}
        </button>
      </div>
      {error ? (
        <p className="crmBanner crmCreditAppAttachmentCardError" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}
