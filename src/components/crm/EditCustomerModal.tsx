import { FormEvent, useEffect, useRef, useState } from "react";
import type { CrmCustomer, CrmUserDirectoryRow } from "../../types/crm";
import { markCustomerLost, restoreCustomer, getCustomerCreditApplicationInfo, updateCustomer, updateCustomerAssignment } from "../../lib/crmApi";
import { directoryPersonLabel, profileCreatorLabel } from "../../utils/crmDirectoryAdmin";
import { formatPhoneDisplay } from "../../utils/phoneFormat";
import { CustomerNameFields } from "./CustomerNameFields";

type EditCustomerModalProps = {
  open: boolean;
  customer: CrmCustomer | null;
  directory: CrmUserDirectoryRow[];
  meId: string | null;
  meEmail: string | null;
  onClose: () => void;
  onSaved: () => void;
  onMovedToLost: () => void;
  onRestored: () => void;
};

function resolveAssignment(
  value: string,
  meId: string | null,
  meEmail: string | null,
  directory: CrmUserDirectoryRow[],
  customer: CrmCustomer
): { assigned_to: string | null; assigned_to_email: string | null } {
  if (value === "__none") {
    return { assigned_to: null, assigned_to_email: null };
  }
  if (value === "__me") {
    if (!meId) {
      return { assigned_to: null, assigned_to_email: null };
    }
    return { assigned_to: meId, assigned_to_email: meEmail?.trim() || null };
  }
  const row = directory.find((d) => d.user_id === value);
  if (row) {
    return { assigned_to: row.user_id, assigned_to_email: row.email };
  }
  if (customer.assigned_to === value) {
    return {
      assigned_to: value,
      assigned_to_email: customer.assigned_to_email
    };
  }
  return { assigned_to: null, assigned_to_email: null };
}

export function EditCustomerModal({
  open,
  customer,
  directory,
  meId,
  meEmail,
  onClose,
  onSaved,
  onMovedToLost,
  onRestored
}: EditCustomerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [assignSelect, setAssignSelect] = useState("__none");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [movingLost, setMovingLost] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) {
      return;
    }
    if (open && customer) {
      const creditInfo = getCustomerCreditApplicationInfo(customer);
      setFirstName(creditInfo.first_name);
      setMiddleName(creditInfo.middle_name);
      setLastName(creditInfo.last_name);
      setPhone(creditInfo.phone || customer.phone || "");
      setSecondaryPhone(creditInfo.secondary_phone || customer.secondary_phone || "");
      setEmail(creditInfo.email || customer.email || "");
      setDob(creditInfo.date_of_birth || customer.date_of_birth || "");
      setAssignSelect(
        customer.assigned_to && meId && customer.assigned_to === meId
          ? "__me"
          : customer.assigned_to ?? "__none"
      );
      setError(null);
      d.showModal();
    } else if (d.open) {
      d.close();
    }
  }, [open, customer]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) {
      return;
    }
    const onDialogClose = () => {
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
    if (!customer) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error: updateErr } = await updateCustomer(
        customer.id,
        {
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          phone,
          email,
          secondary_phone: secondaryPhone,
          date_of_birth: dob
        },
        { existingCustomer: customer }
      );
      if (updateErr) {
        setError(updateErr);
        return;
      }
      const assignPatch = resolveAssignment(assignSelect, meId, meEmail, directory, customer);
      const { error: assignErr } = await updateCustomerAssignment(customer.id, assignPatch);
      if (assignErr) {
        setError(assignErr);
        return;
      }
      onSaved();
      dialogRef.current?.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save customer. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const onMoveToLost = async () => {
    if (!customer || customer.status !== "active") {
      return;
    }
    const ok = window.confirm(`Move ${customer.display_name} to Lost? You can restore them later from the Lost tab.`);
    if (!ok) {
      return;
    }
    setMovingLost(true);
    setError(null);
    const { error: lostErr } = await markCustomerLost(customer.id);
    setMovingLost(false);
    if (lostErr) {
      setError(lostErr);
      return;
    }
    dialogRef.current?.close();
    onMovedToLost();
  };

  const onRestore = async () => {
    if (!customer || customer.status !== "lost") {
      return;
    }
    setRestoring(true);
    setError(null);
    const { error: restoreErr } = await restoreCustomer(customer.id);
    setRestoring(false);
    if (restoreErr) {
      setError(restoreErr);
      return;
    }
    dialogRef.current?.close();
    onRestored();
  };

  if (!customer) {
    return null;
  }

  return (
    <dialog ref={dialogRef} className="crmModal" aria-labelledby="crm-edit-modal-title">
      <div className="crmModalPanel">
        <header className="crmModalHeader">
          <h2 id="crm-edit-modal-title" className="crmModalTitle">
            Edit customer
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
          <CustomerNameFields
            idPrefix="crm-edit-modal"
            firstName={firstName}
            middleName={middleName}
            lastName={lastName}
            onFirstNameChange={setFirstName}
            onMiddleNameChange={setMiddleName}
            onLastNameChange={setLastName}
          />
          <label className="loginLabel" htmlFor="crm-edit-modal-phone">
            Phone number <span className="crmOptional">(10 digits, US/Canada)</span>
          </label>
          <input
            id="crm-edit-modal-phone"
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
          <label className="loginLabel" htmlFor="crm-edit-modal-secondary">
            Secondary number <span className="crmOptional">(if applicable)</span>
          </label>
          <input
            id="crm-edit-modal-secondary"
            className="loginInput"
            type="tel"
            value={secondaryPhone}
            onChange={(e) => setSecondaryPhone(e.target.value)}
            autoComplete="tel"
          />
          {secondaryPhone.trim() ? (
            <p className="crmModalHint">Preview: {formatPhoneDisplay(secondaryPhone) || "—"}</p>
          ) : null}
          <label className="loginLabel" htmlFor="crm-edit-modal-email">
            Customer email <span className="crmOptional">(if applicable)</span>
          </label>
          <input
            id="crm-edit-modal-email"
            className="loginInput"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <label className="loginLabel" htmlFor="crm-edit-modal-dob">
            Date of birth <span className="crmOptional">(if applicable)</span>
          </label>
          <input id="crm-edit-modal-dob" className="loginInput" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          <label className="loginLabel" htmlFor="crm-edit-modal-assign">
            Assigned to
          </label>
          <select
            id="crm-edit-modal-assign"
            className="loginInput"
            value={assignSelect}
            onChange={(e) => setAssignSelect(e.target.value)}
          >
            <option value="__none">Unassigned</option>
            {meId ? (
              <option value="__me">
                Me (
                {(() => {
                  const selfRow = directory.find((d) => d.user_id === meId);
                  return selfRow ? directoryPersonLabel(selfRow) : meEmail ?? meId;
                })()}
                )
              </option>
            ) : null}
            {customer.assigned_to &&
            customer.assigned_to !== meId &&
            !directory.some((d) => d.user_id === customer.assigned_to) ? (
              <option value={customer.assigned_to}>
                {customer.assigned_to_email ?? `User ${customer.assigned_to.slice(0, 8)}…`}
              </option>
            ) : null}
            {directory
              .filter((row) => row.user_id !== meId)
              .map((row) => (
                <option key={row.user_id} value={row.user_id}>
                  {directoryPersonLabel(row)}
                </option>
              ))}
          </select>
          <p className="crmModalHint">Profile created by {profileCreatorLabel(customer, directory)}.</p>
          <p className="crmModalHint">Teammates appear here after they open CRM at least once.</p>
          <footer className="crmModalFooter">
            <button type="button" className="crmModalButtonSecondary" onClick={handleClose}>
              Cancel
            </button>
            {customer.status === "lost" ? (
              <button
                type="button"
                className="topBarSheetButton"
                disabled={restoring}
                onClick={() => void onRestore()}
              >
                {restoring ? "Restoring…" : "Restore to active"}
              </button>
            ) : (
              <button
                type="button"
                className="crmDangerButton"
                disabled={movingLost}
                onClick={() => void onMoveToLost()}
              >
                {movingLost ? "Updating…" : "Move to Lost"}
              </button>
            )}
            <button type="submit" className="loginButton" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </footer>
        </form>
      </div>
    </dialog>
  );
}
