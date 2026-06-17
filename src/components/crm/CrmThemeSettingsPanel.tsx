import { FormEvent, useEffect, useRef, useState } from "react";
import type { CrmBrandingAssetKind } from "../../utils/crmBrandingAssets";
import type { CrmColorMode } from "../../utils/crmColorMode";
import type {
  CrmControlFillStyle,
  CrmControlShape,
  CrmControlStyleConfig,
  CrmPageOutlineShape,
  CrmTabIdleStyle
} from "../../utils/crmControlStyle";
import { CRM_DEFAULT_ACCENT, normalizeHexColor } from "../../utils/crmThemeColor";
import {
  CRM_DEFAULT_HEADER_SUBTITLE,
  CRM_DEFAULT_HEADER_TITLE,
  CRM_HEADER_SUBTITLE_MAX,
  CRM_HEADER_TITLE_MAX
} from "../../utils/crmHeaderCopy";
import { CrmBrandingMiniPreview } from "./CrmBrandingMiniPreview";

const SHAPE_OPTIONS: { value: CrmControlShape; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "square_rounded", label: "Square rounded" },
  { value: "rounded", label: "Rounded" }
];

const TAB_IDLE_OPTIONS: { value: CrmTabIdleStyle; label: string }[] = [
  { value: "empty", label: "Empty" },
  { value: "outline", label: "Outlined" }
];

const FILL_OPTIONS: { value: CrmControlFillStyle; label: string }[] = [
  { value: "filled", label: "Filled" },
  { value: "outline", label: "Outline" }
];

const PAGE_OUTLINE_OPTIONS: { value: CrmPageOutlineShape; label: string }[] = [
  { value: "square_rounded", label: "Square rounded" },
  { value: "square", label: "Square" }
];

type CrmThemeSettingsPanelProps = {
  accentColor: string;
  savedAccentColor: string;
  colorMode: CrmColorMode;
  controlStyle: CrmControlStyleConfig;
  backgroundSrc: string;
  headerIconSrc: string;
  headerTitle: string;
  headerSubtitle: string;
  savedHeaderTitle: string;
  savedHeaderSubtitle: string;
  hasCustomBackground: boolean;
  hasCustomHeaderIcon: boolean;
  loading: boolean;
  saving: boolean;
  uploadingKind: CrmBrandingAssetKind | null;
  clearingKind: CrmBrandingAssetKind | null;
  error: string | null;
  isDirty: boolean;
  isHeaderCopyDirty: boolean;
  onAccentChange: (value: string) => void;
  onSave: (value: string) => Promise<boolean>;
  onReset: () => Promise<boolean>;
  onColorModeChange: (mode: CrmColorMode) => Promise<boolean>;
  onControlStyleChange: (patch: Partial<CrmControlStyleConfig>) => Promise<boolean>;
  onHeaderTitleChange: (value: string) => void;
  onHeaderSubtitleChange: (value: string) => void;
  onSaveHeaderCopy: (title: string, subtitle: string) => Promise<boolean>;
  onResetHeaderCopy: () => Promise<boolean>;
  onUploadBackground: (file: File) => Promise<boolean>;
  onUploadHeaderIcon: (file: File) => Promise<boolean>;
  onClearBackground: () => Promise<boolean>;
  onClearHeaderIcon: () => Promise<boolean>;
  onClearError: () => void;
};

function BrandingUploadField({
  label,
  description,
  previewSrc,
  inputId,
  hasCustom,
  disabled,
  uploading,
  clearing,
  onUpload,
  onClear
}: {
  label: string;
  description: string;
  previewSrc: string;
  inputId: string;
  hasCustom: boolean;
  disabled: boolean;
  uploading: boolean;
  clearing: boolean;
  onUpload: (file: File) => Promise<boolean>;
  onClear: () => Promise<boolean>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileChange = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    await onUpload(file);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="crmThemeAssetField">
      <div className="crmThemeAssetCopy">
        <span className="loginLabel">{label}</span>
        <p className="crmMuted crmThemeAssetDescription">{description}</p>
      </div>
      <div className="crmThemeAssetPreviewWrap">
        <div className={`crmThemeAssetPreview${label.includes("Background") ? " crmThemeAssetPreviewBackground" : ""}`}>
          <img src={previewSrc} alt="" className="crmThemeAssetPreviewImage" decoding="async" />
        </div>
        <div className="crmThemeAssetActions">
          <label className="topBarSheetButton crmThemeAssetUploadBtn" htmlFor={inputId}>
            {uploading ? "Uploading…" : hasCustom ? "Replace PNG" : "Upload PNG"}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/png"
            className="crmVisuallyHidden"
            disabled={disabled || uploading || clearing}
            onChange={(event) => void onFileChange(event.target.files?.[0])}
          />
          <button
            type="button"
            className="crmModalButtonSecondary"
            disabled={disabled || uploading || clearing || !hasCustom}
            onClick={() => void onClear()}
          >
            {clearing ? "Removing…" : "Use default"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ControlStyleToggle<T extends string>({
  legend,
  ariaLabel,
  options,
  value,
  disabled,
  onChange
}: {
  legend: string;
  ariaLabel: string;
  options: { value: T; label: string }[];
  value: T;
  disabled: boolean;
  onChange: (next: T) => void;
}) {
  return (
    <fieldset className="crmThemeControlStyleField">
      <legend className="loginLabel">{legend}</legend>
      <div className="crmSegmented crmThemeControlStyleToggle" role="group" aria-label={ariaLabel}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`crmSegment${value === option.value ? " crmSegmentActive" : ""}`}
            disabled={disabled}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function CrmThemeSettingsPanel({
  accentColor,
  savedAccentColor,
  colorMode,
  controlStyle,
  backgroundSrc,
  headerIconSrc,
  headerTitle,
  headerSubtitle,
  savedHeaderTitle,
  savedHeaderSubtitle,
  hasCustomBackground,
  hasCustomHeaderIcon,
  loading,
  saving,
  uploadingKind,
  clearingKind,
  error,
  isDirty,
  isHeaderCopyDirty,
  onAccentChange,
  onSave,
  onReset,
  onColorModeChange,
  onControlStyleChange,
  onHeaderTitleChange,
  onHeaderSubtitleChange,
  onSaveHeaderCopy,
  onResetHeaderCopy,
  onUploadBackground,
  onUploadHeaderIcon,
  onClearBackground,
  onClearHeaderIcon,
  onClearError
}: CrmThemeSettingsPanelProps) {
  const [hexDraft, setHexDraft] = useState(accentColor);
  const [titleDraft, setTitleDraft] = useState(headerTitle);
  const [subtitleDraft, setSubtitleDraft] = useState(headerSubtitle);

  useEffect(() => {
    setHexDraft(accentColor);
  }, [accentColor]);

  useEffect(() => {
    setTitleDraft(headerTitle);
  }, [headerTitle]);

  useEffect(() => {
    setSubtitleDraft(headerSubtitle);
  }, [headerSubtitle]);

  const applyDraft = (raw: string) => {
    const normalized = normalizeHexColor(raw);
    if (!normalized) {
      setHexDraft(raw);
      return;
    }
    onClearError();
    setHexDraft(normalized);
    onAccentChange(normalized);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSave(hexDraft);
  };

  const onHeaderCopySubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSaveHeaderCopy(titleDraft, subtitleDraft);
  };

  const controlsDisabled = loading || saving || uploadingKind !== null || clearingKind !== null;
  const headerCopyAtDefault =
    savedHeaderTitle === CRM_DEFAULT_HEADER_TITLE && savedHeaderSubtitle === CRM_DEFAULT_HEADER_SUBTITLE;

  return (
    <section className="crmCard crmThemeSettingsCard" aria-labelledby="crm-theme-settings-heading">
      <h2 id="crm-theme-settings-heading" className="crmCardTitle">
        CRM branding
      </h2>

      {error ? (
        <p className="crmBanner" role="alert">
          {error}
        </p>
      ) : null}

      <div className="crmThemeSettingsLeadRow">
        <div className="crmThemeSettingsControlsColumn">
          <p className="crmMuted crmThemeSettingsIntro">
            Customize color mode, button and tab styling, header text, accent color, the faint background watermark, and
            the header icon for everyone on the team.
          </p>

          <fieldset className="crmThemeColorModeField">
            <legend className="loginLabel">Color mode</legend>
            <div className="crmSegmented crmThemeColorModeToggle" role="group" aria-label="CRM color mode">
          <button
            type="button"
            className={`crmSegment${colorMode === "dark" ? " crmSegmentActive" : ""}`}
            disabled={controlsDisabled}
            aria-pressed={colorMode === "dark"}
            onClick={() => void onColorModeChange("dark")}
          >
            Dark
          </button>
          <button
            type="button"
            className={`crmSegment${colorMode === "light" ? " crmSegmentActive" : ""}`}
            disabled={controlsDisabled}
            aria-pressed={colorMode === "light"}
            onClick={() => void onColorModeChange("light")}
          >
            Light
          </button>
        </div>
      </fieldset>

      <div className="crmThemeControlStyleGrid">
        <div className="crmThemeControlStyleRow crmThemeControlStyleRowTabs">
          <ControlStyleToggle
            legend="Tab shape"
            ariaLabel="CRM tab button shape"
            options={SHAPE_OPTIONS}
            value={controlStyle.tabShape}
            disabled={controlsDisabled}
            onChange={(tabShape) => void onControlStyleChange({ tabShape })}
          />
          <ControlStyleToggle
            legend="Tab default style"
            ariaLabel="CRM tab and alert button default appearance"
            options={TAB_IDLE_OPTIONS}
            value={controlStyle.tabIdleStyle}
            disabled={controlsDisabled}
            onChange={(tabIdleStyle) => void onControlStyleChange({ tabIdleStyle })}
          />
          <ControlStyleToggle
            legend="Tab selected style"
            ariaLabel="CRM tab selected appearance"
            options={FILL_OPTIONS}
            value={controlStyle.tabActiveStyle}
            disabled={controlsDisabled}
            onChange={(tabActiveStyle) => void onControlStyleChange({ tabActiveStyle })}
          />
        </div>
        <div className="crmThemeControlStyleRow crmThemeControlStyleRowButtons">
          <ControlStyleToggle
            legend="Button shape"
            ariaLabel="CRM primary button shape"
            options={SHAPE_OPTIONS}
            value={controlStyle.buttonShape}
            disabled={controlsDisabled}
            onChange={(buttonShape) => void onControlStyleChange({ buttonShape })}
          />
          <ControlStyleToggle
            legend="Primary button style"
            ariaLabel="CRM primary button appearance"
            options={FILL_OPTIONS}
            value={controlStyle.buttonPrimaryStyle}
            disabled={controlsDisabled}
            onChange={(buttonPrimaryStyle) => void onControlStyleChange({ buttonPrimaryStyle })}
          />
        </div>
        <ControlStyleToggle
          legend="Page outline shape"
          ariaLabel="CRM page and panel corner shape"
          options={PAGE_OUTLINE_OPTIONS}
          value={controlStyle.pageOutlineShape}
          disabled={controlsDisabled}
          onChange={(pageOutlineShape) => void onControlStyleChange({ pageOutlineShape })}
        />
      </div>
        </div>

        <CrmBrandingMiniPreview
          headerTitle={headerTitle}
          headerSubtitle={headerSubtitle}
          headerIconSrc={headerIconSrc}
        />
      </div>

      <div className="crmThemeSettingsSections">
        <form className="crmThemeHeaderCopyForm" onSubmit={(event) => void onHeaderCopySubmit(event)}>
          <label className="crmThemeHeaderCopyField">
            <span className="loginLabel">Header title</span>
            <input
              type="text"
              className="loginInput"
              value={titleDraft}
              disabled={controlsDisabled}
              maxLength={CRM_HEADER_TITLE_MAX}
              autoComplete="off"
              aria-label="CRM header title"
              onChange={(event) => {
                onClearError();
                setTitleDraft(event.target.value);
                onHeaderTitleChange(event.target.value);
              }}
            />
          </label>
          <label className="crmThemeHeaderCopyField">
            <span className="loginLabel">Header subtitle</span>
            <input
              type="text"
              className="loginInput"
              value={subtitleDraft}
              disabled={controlsDisabled}
              maxLength={CRM_HEADER_SUBTITLE_MAX}
              autoComplete="off"
              aria-label="CRM header subtitle"
              onChange={(event) => {
                onClearError();
                setSubtitleDraft(event.target.value);
                onHeaderSubtitleChange(event.target.value);
              }}
            />
          </label>
          <div className="crmThemeSettingsActions">
            <button type="submit" className="topBarSheetButton" disabled={controlsDisabled || !isHeaderCopyDirty}>
              {saving ? "Saving…" : "Save header text"}
            </button>
            <button
              type="button"
              className="crmModalButtonSecondary"
              disabled={controlsDisabled || headerCopyAtDefault}
              onClick={() => void onResetHeaderCopy()}
            >
              Reset header text to default
            </button>
          </div>
        </form>

        <form className="crmThemeSettingsForm" onSubmit={(event) => void onSubmit(event)}>
          <div className="crmThemeSettingsAccentField">
            <span className="loginLabel">Accent color</span>
            <div className="crmThemeSettingsPickerInputs">
              <input
                type="color"
                className="crmThemeColorInput"
                value={normalizeHexColor(accentColor) ?? CRM_DEFAULT_ACCENT}
                disabled={controlsDisabled}
                aria-label="Pick CRM accent color"
                onChange={(event) => applyDraft(event.target.value)}
              />
              <input
                type="text"
                className="loginInput crmThemeHexInput"
                value={hexDraft}
                disabled={controlsDisabled}
                spellCheck={false}
                autoComplete="off"
                aria-label="CRM accent hex color"
                onChange={(event) => setHexDraft(event.target.value)}
                onBlur={() => {
                  const normalized = normalizeHexColor(hexDraft);
                  if (normalized) {
                    applyDraft(normalized);
                  } else {
                    setHexDraft(accentColor);
                  }
                }}
              />
            </div>
          </div>

          <div className="crmThemeSettingsActions">
            <button type="submit" className="topBarSheetButton" disabled={controlsDisabled || !isDirty}>
              {saving ? "Saving…" : "Save accent color"}
            </button>
            <button
              type="button"
              className="crmModalButtonSecondary"
              disabled={controlsDisabled || savedAccentColor === CRM_DEFAULT_ACCENT}
              onClick={() => void onReset()}
            >
              Reset accent to default
            </button>
          </div>
        </form>

        <BrandingUploadField
          label="Background watermark"
          description="Large centered PNG behind the CRM (shown faintly). PNG only, up to 4 MB."
          previewSrc={backgroundSrc}
          inputId="crm-branding-background-upload"
          hasCustom={hasCustomBackground}
          disabled={controlsDisabled}
          uploading={uploadingKind === "background"}
          clearing={clearingKind === "background"}
          onUpload={onUploadBackground}
          onClear={onClearBackground}
        />

        <BrandingUploadField
          label="Header icon"
          description="Small logo beside the CRM title in the top bar. PNG only, up to 4 MB."
          previewSrc={headerIconSrc}
          inputId="crm-branding-header-upload"
          hasCustom={hasCustomHeaderIcon}
          disabled={controlsDisabled}
          uploading={uploadingKind === "header_icon"}
          clearing={clearingKind === "header_icon"}
          onUpload={onUploadHeaderIcon}
          onClear={onClearHeaderIcon}
        />
      </div>
    </section>
  );
}
