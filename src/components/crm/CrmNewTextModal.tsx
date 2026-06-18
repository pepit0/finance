import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmCustomer } from "../../types/crm";
import { fetchCustomers } from "../../lib/crmApi";
import { filterCustomersBySearch } from "../../utils/crmSearch";
import { formatPhoneDisplay } from "../../utils/phoneFormat";

type CrmNewTextModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (customerId: string) => void;
};

function customerPhoneLabel(customer: CrmCustomer): string | null {
  const phone = customer.phone?.trim() || customer.secondary_phone?.trim() || null;
  return phone ? formatPhoneDisplay(phone) : null;
}

export function CrmNewTextModal({ open, onClose, onSelect }: CrmNewTextModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open) {
      setSearch("");
      setError(null);
      dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    const onDialogClose = () => {
      setSearch("");
      setError(null);
      onClose();
    };
    dialog.addEventListener("close", onDialogClose);
    return () => dialog.removeEventListener("close", onDialogClose);
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchCustomers({ status: "active" }).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (result.error) {
        setError(result.error);
        setCustomers([]);
        return;
      }
      setCustomers(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const textableCustomers = useMemo(
    () => customers.filter((customer) => customer.phone?.trim() || customer.secondary_phone?.trim()),
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    const filtered = filterCustomersBySearch(textableCustomers, search);
    return [...filtered].sort((a, b) =>
      a.display_name.localeCompare(b.display_name, undefined, { sensitivity: "base" })
    );
  }, [search, textableCustomers]);

  const handleClose = () => {
    dialogRef.current?.close();
  };

  const handleSelect = (customerId: string) => {
    onSelect(customerId);
    dialogRef.current?.close();
  };

  return (
    <dialog ref={dialogRef} className="crmModal" aria-labelledby="crm-new-text-modal-title">
      <div className="crmModalPanel crmNewTextModalPanel">
        <header className="crmModalHeader">
          <h2 id="crm-new-text-modal-title" className="crmModalTitle">
            New text
          </h2>
          <button type="button" className="crmModalClose" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="crmModalBody">
          {error ? (
            <p className="crmBanner" role="alert">
              {error}
            </p>
          ) : null}
          <label className="loginLabel" htmlFor="crm-new-text-search">
            Search customers
          </label>
          <input
            id="crm-new-text-search"
            type="search"
            className="crmSearchInput loginInput"
            placeholder="Name, email, or phone…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoFocus
            aria-label="Search customers"
          />
          <div className="crmNewTextCustomerListWrap" aria-live="polite">
            {loading ? (
              <p className="crmMuted crmNewTextCustomerEmpty">Loading customers…</p>
            ) : filteredCustomers.length === 0 ? (
              <p className="crmMuted crmNewTextCustomerEmpty">
                {textableCustomers.length === 0
                  ? "No active customers with a phone number on file."
                  : "No customers match your search."}
              </p>
            ) : (
              <ul className="crmNewTextCustomerList">
                {filteredCustomers.map((customer) => {
                  const phoneLabel = customerPhoneLabel(customer);
                  return (
                    <li key={customer.id}>
                      <button
                        type="button"
                        className="crmNewTextCustomerItem"
                        onClick={() => handleSelect(customer.id)}
                      >
                        <span className="crmNewTextCustomerName">{customer.display_name}</span>
                        {phoneLabel ? <span className="crmNewTextCustomerPhone">{phoneLabel}</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        <footer className="crmModalFooter">
          <button type="button" className="crmModalButtonSecondary" onClick={handleClose}>
            Cancel
          </button>
        </footer>
      </div>
    </dialog>
  );
}
