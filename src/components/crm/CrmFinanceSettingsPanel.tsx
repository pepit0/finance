import { FormEvent, useEffect, useRef, useState } from "react";
import { countCustomerLenderOutcomes } from "../../lib/crmApi";
import type { CrmLenderConfig, CrmLenderSlug, CrmLenderTier } from "../../types/crm";
import { useCrmLendersContext } from "../../context/CrmLendersContext";
import { CrmLenderLogo } from "./crmLenderLogos";

function LenderSettingsRow({
  lender,
  disabled,
  saving,
  uploading,
  deleting,
  onSaveLabel,
  onSaveIconDomain,
  onUploadIcon,
  onDelete,
  onClearError
}: {
  lender: CrmLenderConfig;
  disabled: boolean;
  saving: boolean;
  uploading: boolean;
  deleting: boolean;
  onSaveLabel: (label: string) => Promise<boolean>;
  onSaveIconDomain: (iconDomain: string) => Promise<boolean>;
  onUploadIcon: (file: File) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onClearError: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [labelDraft, setLabelDraft] = useState(lender.label);
  const [domainDraft, setDomainDraft] = useState(lender.icon_domain);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [outcomeCount, setOutcomeCount] = useState<number | null>(null);
  const inputId = `crm-lender-icon-${lender.slug}`;

  useEffect(() => {
    setLabelDraft(lender.label);
    setDomainDraft(lender.icon_domain);
  }, [lender.label, lender.icon_domain, lender.slug]);

  const rowBusy = disabled || saving || uploading || deleting;
  const labelDirty = labelDraft.trim() !== lender.label;
  const domainDirty = domainDraft.trim() !== lender.icon_domain;

  const saveLabel = async () => {
    if (!labelDirty) {
      return;
    }
    const ok = await onSaveLabel(labelDraft);
    if (!ok) {
      setLabelDraft(lender.label);
    }
  };

  const saveDomain = async () => {
    if (!domainDirty) {
      return;
    }
    const ok = await onSaveIconDomain(domainDraft);
    if (!ok) {
      setDomainDraft(lender.icon_domain);
    }
  };

  const onFileChange = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    onClearError();
    await onUploadIcon(file);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const openDelete = async () => {
    const result = await countCustomerLenderOutcomes(lender.slug);
    const count = result.error ? 0 : result.count;

    if (count > 0) {
      setOutcomeCount(count);
      setDeleteOpen(true);
      return;
    }

    if (!window.confirm(`Remove ${lender.label} from the team list?`)) {
      return;
    }

    await onDelete();
  };

  const confirmDelete = async () => {
    const ok = await onDelete();
    if (ok) {
      setDeleteOpen(false);
      setOutcomeCount(null);
    }
  };

  return (
    <div className="crmFinanceLenderRow">
      <div className="crmFinanceLenderPreview" aria-hidden>
        <CrmLenderLogo lender={lender} />
      </div>
      <div className="crmFinanceLenderBody">
        <div className="crmFinanceLenderNameBlock">
          <span className="loginLabel" id={`${inputId}-label`}>
            Display name
          </span>
          <div className="crmFinanceLenderNameRow">
            <input
              type="text"
              className="loginInput"
              value={labelDraft}
              disabled={rowBusy}
              maxLength={80}
              autoComplete="off"
              aria-labelledby={`${inputId}-label`}
              onChange={(event) => {
                onClearError();
                setLabelDraft(event.target.value);
              }}
              onBlur={() => void saveLabel()}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void saveLabel();
                }
              }}
            />
            <div className="crmFinanceLenderActions">
              <label className="topBarSheetButton crmThemeAssetUploadBtn" htmlFor={inputId}>
                {uploading ? "Uploading…" : lender.custom_icon_path ? "Replace PNG" : "Upload PNG"}
              </label>
              <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept="image/png"
                className="crmVisuallyHidden"
                disabled={rowBusy}
                onChange={(event) => void onFileChange(event.target.files?.[0])}
              />
              {!deleteOpen ? (
                <button type="button" className="crmDangerButton" disabled={rowBusy} onClick={() => void openDelete()}>
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <label className="crmFinanceLenderField">
          <span className="loginLabel">Website for logo</span>
          <input
            type="text"
            className="loginInput"
            value={domainDraft}
            disabled={rowBusy}
            maxLength={120}
            spellCheck={false}
            autoComplete="off"
            placeholder="example.com"
            onChange={(event) => {
              onClearError();
              setDomainDraft(event.target.value);
            }}
            onBlur={() => void saveDomain()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void saveDomain();
              }
            }}
          />
        </label>
        {deleteOpen ? (
          <div className="crmFinanceLenderDeleteConfirm">
            <p className="crmMuted crmFinanceLenderDeleteCopy">
              {outcomeCount === null
                ? "Checking usage…"
                : `Remove ${lender.label} and clear ${outcomeCount} saved approval${outcomeCount === 1 ? "" : "s"} on customer profiles?`}
            </p>
            <div className="crmFinanceLenderDeleteActions">
              <button
                type="button"
                className="crmDangerButton"
                disabled={rowBusy || outcomeCount === null}
                onClick={() => void confirmDelete()}
              >
                {deleting ? "Deleting…" : "Confirm delete"}
              </button>
              <button
                type="button"
                className="crmModalButtonSecondary"
                disabled={rowBusy}
                onClick={() => {
                  setDeleteOpen(false);
                  setOutcomeCount(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AddLenderForm({
  tier,
  disabled,
  onCreate,
  onClearError
}: {
  tier: CrmLenderTier;
  disabled: boolean;
  onCreate: (label: string, iconDomain?: string) => Promise<boolean>;
  onClearError: () => void;
}) {
  const [labelDraft, setLabelDraft] = useState("");
  const [domainDraft, setDomainDraft] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    onClearError();
    const ok = await onCreate(labelDraft, domainDraft.trim() || undefined);
    if (ok) {
      setLabelDraft("");
      setDomainDraft("");
    }
  };

  return (
    <form className="crmFinanceAddLenderForm" onSubmit={(event) => void onSubmit(event)}>
      <h4 className="crmFinanceAddLenderTitle">Add lender</h4>
      <label className="crmFinanceLenderField">
        <span className="loginLabel">Display name</span>
        <input
          type="text"
          className="loginInput"
          value={labelDraft}
          disabled={disabled}
          maxLength={80}
          autoComplete="off"
          placeholder={tier === "prime" ? "New prime lender" : "New subprime lender"}
          onChange={(event) => setLabelDraft(event.target.value)}
        />
      </label>
      <label className="crmFinanceLenderField">
        <span className="loginLabel">Website for logo (optional)</span>
        <input
          type="text"
          className="loginInput"
          value={domainDraft}
          disabled={disabled}
          maxLength={120}
          spellCheck={false}
          autoComplete="off"
          placeholder="example.com"
          onChange={(event) => setDomainDraft(event.target.value)}
        />
      </label>
      <button type="submit" className="topBarSheetButton" disabled={disabled || !labelDraft.trim()}>
        Add {tier === "prime" ? "prime" : "subprime"} lender
      </button>
    </form>
  );
}

function LenderTierSection({
  title,
  tier,
  lenders,
  disabled,
  saving,
  uploadingSlug,
  deletingSlug,
  onSaveLabel,
  onSaveIconDomain,
  onUploadIcon,
  onDelete,
  onCreate,
  onClearError
}: {
  title: string;
  tier: CrmLenderTier;
  lenders: CrmLenderConfig[];
  disabled: boolean;
  saving: boolean;
  uploadingSlug: CrmLenderSlug | null;
  deletingSlug: CrmLenderSlug | null;
  onSaveLabel: (slug: CrmLenderSlug, label: string) => Promise<boolean>;
  onSaveIconDomain: (slug: CrmLenderSlug, iconDomain: string) => Promise<boolean>;
  onUploadIcon: (slug: CrmLenderSlug, file: File) => Promise<boolean>;
  onDelete: (slug: CrmLenderSlug) => Promise<boolean>;
  onCreate: (label: string, iconDomain?: string) => Promise<boolean>;
  onClearError: () => void;
}) {
  const sectionId = `crm-finance-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section className="crmFinanceTierSection" aria-labelledby={sectionId}>
      <h3 id={sectionId} className="crmFinanceTierTitle">
        {title}
      </h3>
      <div className="crmFinanceLenderList">
        {lenders.length === 0 ? <p className="crmMuted crmFinanceEmptyTier">No lenders yet.</p> : null}
        {lenders.map((lender) => (
          <LenderSettingsRow
            key={lender.slug}
            lender={lender}
            disabled={disabled}
            saving={saving}
            uploading={uploadingSlug === lender.slug}
            deleting={deletingSlug === lender.slug}
            onSaveLabel={(label) => onSaveLabel(lender.slug, label)}
            onSaveIconDomain={(iconDomain) => onSaveIconDomain(lender.slug, iconDomain)}
            onUploadIcon={(file) => onUploadIcon(lender.slug, file)}
            onDelete={() => onDelete(lender.slug)}
            onClearError={onClearError}
          />
        ))}
      </div>
      <AddLenderForm tier={tier} disabled={disabled} onCreate={onCreate} onClearError={onClearError} />
    </section>
  );
}

export function CrmFinanceSettingsPanel() {
  const {
    primeLenders,
    subprimeLenders,
    financeEnabled,
    loading,
    saving,
    financeSaving,
    uploadingSlug,
    deletingSlug,
    error,
    updateLabel,
    updateIconDomain,
    uploadIcon,
    createLender,
    removeLender,
    setFinanceEnabledForOrg,
    clearError
  } = useCrmLendersContext();

  const controlsDisabled = loading || saving || financeSaving || uploadingSlug !== null || deletingSlug !== null;

  const onToggleFinance = async () => {
    clearError();
    await setFinanceEnabledForOrg(!financeEnabled);
  };

  return (
    <section className="crmCard crmFinanceSettingsCard" aria-labelledby="crm-finance-settings-heading">
      <div className="crmFinanceSettingsHead">
        <div>
          <h2 id="crm-finance-settings-heading" className="crmCardTitle">
            Finance lenders
          </h2>
          <p className="crmMuted crmFinanceSettingsIntro">
            Add, edit, or remove prime and subprime lenders shown on customer profiles. Enter a website to pull a logo
            from the web, or upload a PNG to use your own.
          </p>
        </div>
        <button
          type="button"
          className={financeEnabled ? "crmButtonDanger" : "topBarSheetButton"}
          disabled={controlsDisabled}
          onClick={() => void onToggleFinance()}
        >
          {financeSaving ? "Saving…" : financeEnabled ? "Disable finance" : "Enable finance"}
        </button>
      </div>

      {!financeEnabled ? (
        <p className="crmMuted crmFinanceDisabledNote" role="status">
          Finance is disabled for your team. Lender icons and approval tags are hidden from all users until you turn
          finance back on.
        </p>
      ) : null}

      {error ? (
        <p className="crmBanner" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <p className="crmMuted">Loading lenders…</p> : null}

      <div className={`crmFinanceTierGrid${financeEnabled ? "" : " crmFinanceTierGridPaused"}`}>
        <LenderTierSection
          title="Prime lenders"
          tier="prime"
          lenders={primeLenders}
          disabled={controlsDisabled}
          saving={saving}
          uploadingSlug={uploadingSlug}
          deletingSlug={deletingSlug}
          onSaveLabel={updateLabel}
          onSaveIconDomain={updateIconDomain}
          onUploadIcon={uploadIcon}
          onDelete={removeLender}
          onCreate={(label, iconDomain) => createLender("prime", label, iconDomain)}
          onClearError={clearError}
        />

        <LenderTierSection
          title="Subprime lenders"
          tier="subprime"
          lenders={subprimeLenders}
          disabled={controlsDisabled}
          saving={saving}
          uploadingSlug={uploadingSlug}
          deletingSlug={deletingSlug}
          onSaveLabel={updateLabel}
          onSaveIconDomain={updateIconDomain}
          onUploadIcon={uploadIcon}
          onDelete={removeLender}
          onCreate={(label, iconDomain) => createLender("subprime", label, iconDomain)}
          onClearError={clearError}
        />
      </div>
    </section>
  );
}
