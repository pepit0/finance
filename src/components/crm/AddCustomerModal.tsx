import { FormEvent, useEffect, useRef, useState } from "react";
import { insertCustomer } from "../../lib/crmApi";
import type { CreditAppNameParts } from "../../utils/creditAppName";
import { formatPhoneDisplay } from "../../utils/phoneFormat";
import { CrmCustomerNameFields } from "./CrmCustomerNameFields";

const EMPTY_NAME: CreditAppNameParts = { first_name: "", middle_name: "", last_name: "" };

type AddCustomerModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
};

export function AddCustomerModal({ open, onClose, onSaved }: AddCustomerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nameParts, setNameParts] = useState<CreditAppNameParts>(EMPTY_NAME);
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) {
      return;
    }
    if (open) {
      setNameParts(EMPTY_NAME);
      setPhone("");
      setSecondaryPhone("");
      setEmail("");
      setDob("");
      setError(null);
      d.showModal();
    } else if (d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) {
      return;
    }
    const onDialogClose = () => {
      setNameParts(EMPTY_NAME);
      setPhone("");
      setSecondaryPhone("");
      setEmail("");
      setDob("");
      setError(null);
      onClose();
    };
    d.addEventListener("close", onDialogClose);
    return () => d.removeEventListener("close", onDialogClose);
  }, [onClose]);

  const handleClose = () => {
    dialogRef.current?.close();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { id, error: insertError } = await insertCustomer({
        first_name: nameParts.first_name,
        middle_name: nameParts.middle_name,
        last_name: nameParts.last_name,
        phone,
        email,
        secondary_phone: secondaryPhone,
        date_of_birth: dob
      });
      if (insertError) {
        setError(insertError);
        return;
      }
      if (id) {
        onSaved(id);
        dialogRef.current?.close();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="crmModal" aria-labelledby="crm-add-modal-title">
      <div className="crmModalPanel">
        <header className="crmModalHeader">
          <h2 id="crm-add-modal-title" className="crmModalTitle">
            Add customer
          </h2>
          <button type="button" className="crmModalClose" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </header>
        <form className="crmModalBody crmForm" onSubmit={onSubmit}>
          {error ? (
            <p className="crmBanner" role="alert">
              {error}
            </p>
          ) : null}
          <CrmCustomerNameFields
            idPrefix="crm-modal"
            value={nameParts}
            onChange={(patch) => setNameParts((prev) => ({ ...prev, ...patch }))}
          />
          <label className="loginLabel" htmlFor="crm-modal-phone">
            Phone number <span className="crmOptional">(10 digits, US/Canada)</span>
          </label>
          <input
            id="crm-modal-phone"
            className="loginInput"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
          />
          {phone.trim() ? (
            <p className="crmModalHint">Preview: {formatPhoneDisplay(phone) || "—"}</p>
          ) : null}
          <label className="loginLabel" htmlFor="crm-modal-secondary">
            Secondary number <span className="crmOptional">(if applicable)</span>
          </label>
          <input
            id="crm-modal-secondary"
            className="loginInput"
            type="tel"
            value={secondaryPhone}
            onChange={(e) => setSecondaryPhone(e.target.value)}
            autoComplete="tel"
          />
          {secondaryPhone.trim() ? (
            <p className="crmModalHint">Preview: {formatPhoneDisplay(secondaryPhone) || "—"}</p>
          ) : null}
          <label className="loginLabel" htmlFor="crm-modal-email">
            Customer email <span className="crmOptional">(if applicable)</span>
          </label>
          <input
            id="crm-modal-email"
            className="loginInput"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <label className="loginLabel" htmlFor="crm-modal-dob">
            Date of birth <span className="crmOptional">(if applicable)</span>
          </label>
          <input id="crm-modal-dob" className="loginInput" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          <footer className="crmModalFooter">
            <button type="button" className="crmModalButtonSecondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="loginButton" disabled={saving}>
              {saving ? "Saving…" : "Save customer"}
            </button>
          </footer>
        </form>
      </div>
    </dialog>
  );
}
