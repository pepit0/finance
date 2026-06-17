import { useEffect, useMemo, useState } from "react";
import { CrmThemeSettingsPanel } from "./CrmThemeSettingsPanel";
import { CrmPipelineSettingsPanel } from "./CrmPipelineSettingsPanel";
import { CrmPermissionsSettingsPanel } from "./CrmPermissionsSettingsPanel";
import { CrmFinanceSettingsPanel } from "./CrmFinanceSettingsPanel";
import type { CrmBrandingAssetKind } from "../../utils/crmBrandingAssets";
import type { CrmColorMode } from "../../utils/crmColorMode";
import type { CrmControlStyleConfig } from "../../utils/crmControlStyle";

export type CrmBrandingEditorProps = {
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

type CrmSettingsSection = "branding" | "pipeline" | "finance" | "permissions";

type CrmSettingsTabProps = {
  visible: boolean;
  isMaster: boolean;
  canManagePermissions: boolean;
  themeEditor: CrmBrandingEditorProps;
};

export function CrmSettingsTab({ visible, isMaster, canManagePermissions, themeEditor }: CrmSettingsTabProps) {
  const sections = useMemo(() => {
    const list: { id: CrmSettingsSection; label: string }[] = [];
    if (isMaster) {
      list.push({ id: "branding", label: "CRM branding" });
      list.push({ id: "pipeline", label: "Pipeline stages" });
      list.push({ id: "finance", label: "Finance" });
    }
    if (canManagePermissions) {
      list.push({ id: "permissions", label: "Groups & Permissions" });
    }
    return list;
  }, [canManagePermissions, isMaster]);

  const [activeSection, setActiveSection] = useState<CrmSettingsSection>("branding");

  useEffect(() => {
    if (sections.length === 0) {
      return;
    }
    if (!sections.some((section) => section.id === activeSection)) {
      setActiveSection(sections[0].id);
    }
  }, [activeSection, sections]);

  if (!visible) {
    return null;
  }

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="crmSettingsTab">
      <nav className="crmSettingsTabNav appTabs" aria-label="Settings sections">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`appTab crmTabBtn crmSettingsTabBtn${activeSection === section.id ? " appTabActive" : ""}`}
            aria-current={activeSection === section.id ? "page" : undefined}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <div className="crmSettingsTabPanel" hidden={activeSection !== "branding"}>
        {isMaster ? (
          <CrmThemeSettingsPanel
            accentColor={themeEditor.accentColor}
            savedAccentColor={themeEditor.savedAccentColor}
            colorMode={themeEditor.colorMode}
            controlStyle={themeEditor.controlStyle}
            backgroundSrc={themeEditor.backgroundSrc}
            headerIconSrc={themeEditor.headerIconSrc}
            headerTitle={themeEditor.headerTitle}
            headerSubtitle={themeEditor.headerSubtitle}
            savedHeaderTitle={themeEditor.savedHeaderTitle}
            savedHeaderSubtitle={themeEditor.savedHeaderSubtitle}
            hasCustomBackground={themeEditor.hasCustomBackground}
            hasCustomHeaderIcon={themeEditor.hasCustomHeaderIcon}
            loading={themeEditor.loading}
            saving={themeEditor.saving}
            uploadingKind={themeEditor.uploadingKind}
            clearingKind={themeEditor.clearingKind}
            error={themeEditor.error}
            isDirty={themeEditor.isDirty}
            isHeaderCopyDirty={themeEditor.isHeaderCopyDirty}
            onAccentChange={themeEditor.onAccentChange}
            onSave={themeEditor.onSave}
            onReset={themeEditor.onReset}
            onColorModeChange={themeEditor.onColorModeChange}
            onControlStyleChange={themeEditor.onControlStyleChange}
            onHeaderTitleChange={themeEditor.onHeaderTitleChange}
            onHeaderSubtitleChange={themeEditor.onHeaderSubtitleChange}
            onSaveHeaderCopy={themeEditor.onSaveHeaderCopy}
            onResetHeaderCopy={themeEditor.onResetHeaderCopy}
            onUploadBackground={themeEditor.onUploadBackground}
            onUploadHeaderIcon={themeEditor.onUploadHeaderIcon}
            onClearBackground={themeEditor.onClearBackground}
            onClearHeaderIcon={themeEditor.onClearHeaderIcon}
            onClearError={themeEditor.onClearError}
          />
        ) : null}
      </div>

      <div className="crmSettingsTabPanel" hidden={activeSection !== "pipeline"}>
        {isMaster ? <CrmPipelineSettingsPanel /> : null}
      </div>

      <div className="crmSettingsTabPanel" hidden={activeSection !== "finance"}>
        {isMaster ? <CrmFinanceSettingsPanel /> : null}
      </div>

      <div className="crmSettingsTabPanel" hidden={activeSection !== "permissions"}>
        {canManagePermissions ? <CrmPermissionsSettingsPanel isMaster={isMaster} /> : null}
      </div>
    </div>
  );
}
