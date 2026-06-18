import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { CrmBrandingAssetKind } from "../../utils/crmBrandingAssets";
import type { CrmColorMode } from "../../utils/crmColorMode";
import type {
  CrmControlFillStyle,
  CrmHeaderLayout,
  CrmHeaderLogoAlign,
  CrmHeaderTitleAlign,
  CrmControlShape,
  CrmControlStyleConfig,
  CrmPageOutlineShape,
  CrmScrollbarStyle,
  CrmScrollbarShape,
  CrmScrollbarWidth,
  CrmSidebarPanelStyle,
  CrmTabIdleStyle
} from "../../utils/crmControlStyle";
import { CRM_DEFAULT_ACCENT, normalizeHexColor } from "../../utils/crmThemeColor";
import {
  CRM_LABEL_COLOR_GROUPS,
  type CrmLabelColorKey,
  type CrmLabelColorsConfig
} from "../../utils/crmLabelColors";
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

const HEADER_LAYOUT_OPTIONS: { value: CrmHeaderLayout; label: string }[] = [
  { value: "top", label: "Top bar" },
  { value: "left", label: "Left sidebar" }
];

const HEADER_LOGO_ALIGN_OPTIONS: { value: CrmHeaderLogoAlign; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" }
];

const HEADER_TITLE_ALIGN_OPTIONS: { value: CrmHeaderTitleAlign; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" }
];

const SIDEBAR_PANEL_OPTIONS: { value: CrmSidebarPanelStyle; label: string }[] = [
  { value: "clear", label: "Clear" },
  { value: "outline", label: "Outlined" },
  { value: "filled", label: "Filled" }
];

const SCROLLBAR_STYLE_OPTIONS: { value: CrmScrollbarStyle; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "filled", label: "Filled" }
];

const SCROLLBAR_SHAPE_OPTIONS: { value: CrmScrollbarShape; label: string }[] = [
  { value: "rounded", label: "Rounded" },
  { value: "square", label: "Square" }
];

const SCROLLBAR_WIDTH_OPTIONS: { value: CrmScrollbarWidth; label: string }[] = [
  { value: "thin", label: "Thin" },
  { value: "thick", label: "Thick" }
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
  labelColors: CrmLabelColorsConfig;
  hasCustomLabelColors: boolean;
  isLabelColorsDirty: boolean;
  onPreviewLabelColor: (key: CrmLabelColorKey, patch: { bg?: string; text?: string }) => void;
  onSaveLabelColors: () => Promise<boolean>;
  onResetLabelColors: () => Promise<boolean>;
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
  options: { value: T; label: string; disabled?: boolean }[];
  value: T;
  disabled: boolean;
  onChange: (next: T) => void;
}) {
  return (
    <fieldset className="crmThemeControlStyleField">
      <legend className="loginLabel">{legend}</legend>
      <div className="crmSegmented crmThemeControlStyleToggle" role="group" aria-label={ariaLabel}>
        {options.map((option) => {
          const optionDisabled = disabled || option.disabled;
          return (
            <button
              key={option.value}
              type="button"
              className={`crmSegment${value === option.value ? " crmSegmentActive" : ""}`}
              disabled={optionDisabled}
              aria-pressed={value === option.value}
              aria-disabled={optionDisabled || undefined}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function LabelColorRow({
  label,
  pair,
  disabled,
  onChange
}: {
  label: string;
  pair: { bg: string; text: string };
  disabled: boolean;
  onChange: (patch: { bg?: string; text?: string }) => void;
}) {
  const bgHex = normalizeHexColor(pair.bg) ?? "#e5e7eb";
  const textHex = normalizeHexColor(pair.text) ?? "#374151";

  return (
    <div className="crmThemeLabelColorRow">
      <div className="crmThemeLabelColorRowHead">
        <span className="crmThemeLabelColorName">{label}</span>
        <span
          className="crmThemeLabelColorPreview crmBadge"
          style={{ background: pair.bg, color: pair.text, border: `1px solid ${pair.text}33` }}
        >
          {label}
        </span>
      </div>
      <div className="crmThemeLabelColorInputs">
        <label className="crmThemeLabelColorField">
          <span className="crmThemeLabelColorFieldLabel">Background</span>
          <div className="crmThemeSettingsPickerInputs">
            <input
              type="color"
              className="crmThemeColorInput"
              value={bgHex}
              disabled={disabled}
              aria-label={`${label} background color`}
              onChange={(event) => onChange({ bg: event.target.value })}
            />
            <input
              type="text"
              className="loginInput crmThemeHexInput"
              value={pair.bg}
              disabled={disabled}
              spellCheck={false}
              aria-label={`${label} background hex`}
              onChange={(event) => onChange({ bg: event.target.value })}
              onBlur={() => {
                const normalized = normalizeHexColor(pair.bg);
                if (normalized) {
                  onChange({ bg: normalized });
                }
              }}
            />
          </div>
        </label>
        <label className="crmThemeLabelColorField">
          <span className="crmThemeLabelColorFieldLabel">Text</span>
          <div className="crmThemeSettingsPickerInputs">
            <input
              type="color"
              className="crmThemeColorInput"
              value={textHex}
              disabled={disabled}
              aria-label={`${label} text color`}
              onChange={(event) => onChange({ text: event.target.value })}
            />
            <input
              type="text"
              className="loginInput crmThemeHexInput"
              value={pair.text}
              disabled={disabled}
              spellCheck={false}
              aria-label={`${label} text hex`}
              onChange={(event) => onChange({ text: event.target.value })}
              onBlur={() => {
                const normalized = normalizeHexColor(pair.text);
                if (normalized) {
                  onChange({ text: normalized });
                }
              }}
            />
          </div>
        </label>
      </div>
    </div>
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
  onClearError,
  labelColors,
  hasCustomLabelColors,
  isLabelColorsDirty,
  onPreviewLabelColor,
  onSaveLabelColors,
  onResetLabelColors
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

  const headerLogoAlignOptions = useMemo(
    () =>
      HEADER_LOGO_ALIGN_OPTIONS.map((option) => ({
        ...option,
        disabled:
          controlStyle.headerLayout === "top" && (option.value === "center" || option.value === "default")
      })),
    [controlStyle.headerLayout]
  );

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
            Customize color mode, button and tab styling, header text, accent color, label and badge colors, the faint
            background watermark, and the header icon for everyone on the team.
          </p>

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
          <ControlStyleToggle
            legend="Textbox & dropdown shape"
            ariaLabel="CRM textbox and dropdown shape"
            options={SHAPE_OPTIONS}
            value={controlStyle.fieldShape}
            disabled={controlsDisabled}
            onChange={(fieldShape) => void onControlStyleChange({ fieldShape })}
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
        <div className="crmThemeControlStyleRow">
          <ControlStyleToggle
            legend="Desktop header layout"
            ariaLabel="CRM desktop header layout"
            options={HEADER_LAYOUT_OPTIONS}
            value={controlStyle.headerLayout}
            disabled={controlsDisabled}
            onChange={(headerLayout) => {
              const patch: Partial<CrmControlStyleConfig> = { headerLayout };
              if (
                headerLayout === "top" &&
                (controlStyle.headerLogoAlign === "center" || controlStyle.headerLogoAlign === "default")
              ) {
                patch.headerLogoAlign = "left";
              }
              void onControlStyleChange(patch);
            }}
          />
          {controlStyle.headerLayout === "left" ? (
            <ControlStyleToggle
              legend="Sidebar panel style"
              ariaLabel="CRM left sidebar panel appearance"
              options={SIDEBAR_PANEL_OPTIONS}
              value={controlStyle.sidebarPanelStyle}
              disabled={controlsDisabled}
              onChange={(sidebarPanelStyle) => void onControlStyleChange({ sidebarPanelStyle })}
            />
          ) : null}
        </div>
        <div className="crmThemeControlStyleRow">
          <ControlStyleToggle
            legend="Page scrollbars"
            ariaLabel="CRM page scrollbar appearance"
            options={SCROLLBAR_STYLE_OPTIONS}
            value={controlStyle.scrollbarStyle}
            disabled={controlsDisabled}
            onChange={(scrollbarStyle) => void onControlStyleChange({ scrollbarStyle })}
          />
          <ControlStyleToggle
            legend="Scrollbar shape"
            ariaLabel="CRM scrollbar thumb shape"
            options={SCROLLBAR_SHAPE_OPTIONS}
            value={controlStyle.scrollbarShape}
            disabled={controlsDisabled}
            onChange={(scrollbarShape) => void onControlStyleChange({ scrollbarShape })}
          />
          <ControlStyleToggle
            legend="Scrollbar width"
            ariaLabel="CRM scrollbar width"
            options={SCROLLBAR_WIDTH_OPTIONS}
            value={controlStyle.scrollbarWidth}
            disabled={controlsDisabled}
            onChange={(scrollbarWidth) => void onControlStyleChange({ scrollbarWidth })}
          />
        </div>
      </div>
        </div>

        <CrmBrandingMiniPreview
          headerTitle={headerTitle}
          headerSubtitle={headerSubtitle}
          headerIconSrc={headerIconSrc}
          headerLogoAlign={controlStyle.headerLogoAlign}
          headerTitleAlign={controlStyle.headerTitleAlign}
        />
      </div>

      <div className="crmThemeSettingsSections">
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

        <div className="crmThemeControlStyleRow crmThemeHeaderAlignRow">
          <ControlStyleToggle
            legend="Header logo alignment"
            ariaLabel="CRM header logo alignment"
            options={headerLogoAlignOptions}
            value={controlStyle.headerLogoAlign}
            disabled={controlsDisabled}
            onChange={(headerLogoAlign) => void onControlStyleChange({ headerLogoAlign })}
          />

          <ControlStyleToggle
            legend="Header title alignment"
            ariaLabel="CRM header title alignment"
            options={HEADER_TITLE_ALIGN_OPTIONS}
            value={controlStyle.headerTitleAlign}
            disabled={controlsDisabled}
            onChange={(headerTitleAlign) => void onControlStyleChange({ headerTitleAlign })}
          />
        </div>

        <details className="crmThemeCollapsiblePanel crmThemeLabelColorsPanel">
          <summary className="crmThemeCollapsiblePanelSummary">
            <span className="crmThemeCollapsiblePanelSummaryLabel">Label & badge colors</span>
            <span className="crmThemeCollapsiblePanelChevron" aria-hidden="true" />
          </summary>
          <div className="crmThemeLabelColorsSection">
            <p className="crmMuted crmThemeLabelColorsIntro">
              Activity type labels, lender approval tags, and call recording badges on the customer page.
            </p>
            {CRM_LABEL_COLOR_GROUPS.map((group) => (
              <div key={group.title} className="crmThemeLabelColorGroup">
                <h4 className="crmThemeLabelColorGroupTitle">{group.title}</h4>
                {group.description ? <p className="crmMuted crmThemeLabelColorGroupDesc">{group.description}</p> : null}
                <div className="crmThemeLabelColorGroupRows">
                  {group.items.map((item) => (
                    <LabelColorRow
                      key={item.key}
                      label={item.label}
                      pair={labelColors[item.key]}
                      disabled={controlsDisabled}
                      onChange={(patch) => {
                        onClearError();
                        onPreviewLabelColor(item.key, patch);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="crmThemeSettingsActions">
              <button
                type="button"
                className="topBarSheetButton"
                disabled={controlsDisabled || !isLabelColorsDirty}
                onClick={() => void onSaveLabelColors()}
              >
                {saving ? "Saving…" : "Save label colors"}
              </button>
              <button
                type="button"
                className="crmModalButtonSecondary"
                disabled={controlsDisabled || !hasCustomLabelColors}
                onClick={() => void onResetLabelColors()}
              >
                Reset labels to default
              </button>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
