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
  clearing,
  finding,
  deleting,
  onSaveLabel,
  onSaveIconDomain,
  onFindWebLogo,
  onUploadIcon,
  onClearIcon,
  onDelete,
  onClearError
}: {
  lender: CrmLenderConfig;
  disabled: boolean;
  saving: boolean;
  uploading: boolean;
  clearing: boolean;
  finding: boolean;
  deleting: boolean;
  onSaveLabel: (label: string) => Promise<boolean>;
  onSaveIconDomain: (iconDomain: string) => Promise<boolean>;
  onFindWebLogo: (label: string) => Promise<boolean>;
  onUploadIcon: (file: File) => Promise<boolean>;
  onClearIcon: () => Promise<boolean>;
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

  const rowBusy = disabled || saving || uploading || clearing || finding || deleting;
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
    setDeleteOpen(true);
    const result = await countCustomerLenderOutcomes(lender.slug);
    setOutcomeCount(result.error ? 0 : result.count);
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
              <button
                type="button"
                className="crmModalButtonSecondary"
                disabled={rowBusy}
                onClick={() => {
                  onClearError();
                  void onFindWebLogo(labelDraft);
                }}
              >
                {finding ? "Finding…" : "Find logo from web"}
              </button>
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
              <button
                type="button"
                className="crmModalButtonSecondary"
                disabled={rowBusy || !lender.custom_icon_path}
                onClick={() => void onClearIcon()}
              >
                {clearing ? "Removing…" : "Use web logo"}
              </button>
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
                : outcomeCount > 0
                  ? `Remove this lender and clear ${outcomeCount} saved approval${outcomeCount === 1 ? "" : "s"} on customer profiles?`
                  : "Remove this lender from the team list?"}
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
          placeholder="Auto-detected from name if blank"
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
  clearingSlug,
  findingSlug,
  deletingSlug,
  onSaveLabel,
  onSaveIconDomain,
  onFindWebLogo,
  onUploadIcon,
  onClearIcon,
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
  clearingSlug: CrmLenderSlug | null;
  findingSlug: CrmLenderSlug | null;
  deletingSlug: CrmLenderSlug | null;
  onSaveLabel: (slug: CrmLenderSlug, label: string) => Promise<boolean>;
  onSaveIconDomain: (slug: CrmLenderSlug, iconDomain: string) => Promise<boolean>;
  onFindWebLogo: (slug: CrmLenderSlug, label: string) => Promise<boolean>;
  onUploadIcon: (slug: CrmLenderSlug, file: File) => Promise<boolean>;
  onClearIcon: (slug: CrmLenderSlug) => Promise<boolean>;
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
            clearing={clearingSlug === lender.slug}
            finding={findingSlug === lender.slug}
            deleting={deletingSlug === lender.slug}
            onSaveLabel={(label) => onSaveLabel(lender.slug, label)}
            onSaveIconDomain={(iconDomain) => onSaveIconDomain(lender.slug, iconDomain)}
            onFindWebLogo={(label) => onFindWebLogo(lender.slug, label)}
            onUploadIcon={(file) => onUploadIcon(lender.slug, file)}
            onClearIcon={() => onClearIcon(lender.slug)}
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
    loading,
    saving,
    uploadingSlug,
    clearingSlug,
    findingSlug,
    deletingSlug,
    error,
    updateLabel,
    updateIconDomain,
    findWebLogo,
    uploadIcon,
    clearIcon,
    createLender,
    removeLender,
    clearError
  } = useCrmLendersContext();

  const controlsDisabled =
    loading || saving || uploadingSlug !== null || clearingSlug !== null || findingSlug !== null || deletingSlug !== null;

  return (
    <section className="crmCard crmFinanceSettingsCard" aria-labelledby="crm-finance-settings-heading">
      <h2 id="crm-finance-settings-heading" className="crmCardTitle">
        Finance lenders
      </h2>
      <p className="crmMuted crmFinanceSettingsIntro">
        Add, edit, or remove prime and subprime lenders shown on customer profiles. Logos are fetched from the web when
        possible; upload a PNG to override.
      </p>

      {error ? (
        <p className="crmBanner" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <p className="crmMuted">Loading lenders…</p> : null}

      <div className="crmFinanceTierGrid">
        <LenderTierSection
          title="Prime lenders"
          tier="prime"
          lenders={primeLenders}
          disabled={controlsDisabled}
          saving={saving}
          uploadingSlug={uploadingSlug}
          clearingSlug={clearingSlug}
          findingSlug={findingSlug}
          deletingSlug={deletingSlug}
          onSaveLabel={updateLabel}
          onSaveIconDomain={updateIconDomain}
          onFindWebLogo={findWebLogo}
          onUploadIcon={uploadIcon}
          onClearIcon={clearIcon}
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
          clearingSlug={clearingSlug}
          findingSlug={findingSlug}
          deletingSlug={deletingSlug}
          onSaveLabel={updateLabel}
          onSaveIconDomain={updateIconDomain}
          onFindWebLogo={findWebLogo}
          onUploadIcon={uploadIcon}
          onClearIcon={clearIcon}
          onDelete={removeLender}
          onCreate={(label, iconDomain) => createLender("subprime", label, iconDomain)}
          onClearError={clearError}
        />
      </div>
    </section>
  );
}
