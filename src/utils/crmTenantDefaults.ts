import type { CrmColorMode } from "./crmColorMode";
import type { CrmControlStyleConfig } from "./crmControlStyle";
import type { CrmLabelColorsConfig } from "./crmLabelColors";
import { CRM_BRANDING_STORAGE_PATHS } from "./crmBrandingAssets";

/**
 * Master CRM tenant defaults — keep in sync with sql/seed_tenant_defaults.sql.
 * Export from playground: sql/export_tenant_defaults.sql + scripts/Export-TenantDefaultBranding.ps1
 */
export const CRM_TENANT_DEFAULT_ACCENT = "#3db870";
export const CRM_TENANT_DEFAULT_COLOR_MODE: CrmColorMode = "dark";
export const CRM_TENANT_DEFAULT_HEADER_TITLE = "Demo CRM";
export const CRM_TENANT_DEFAULT_HEADER_SUBTITLE = "Customers, calls, and notes";
export const CRM_TENANT_DEFAULT_FOOTER_TEXT = "";
export const CRM_TENANT_DEFAULT_APP_VERSION = "0.1.0";

export const CRM_TENANT_DEFAULT_CONTROL_STYLE: CrmControlStyleConfig = {
  buttonShape: "square_rounded",
  fieldShape: "square_rounded",
  tabShape: "square_rounded",
  tabIdleStyle: "outline",
  tabActiveStyle: "filled",
  buttonPrimaryStyle: "filled",
  pageOutlineShape: "square_rounded",
  headerLayout: "top",
  headerLogoAlign: "left",
  headerTitleAlign: "left",
  sidebarPanelStyle: "filled",
  scrollbarStyle: "default",
  scrollbarShape: "rounded",
  scrollbarWidth: "thin"
};

/** Dark-mode label colors from seed_tenant_defaults.sql (playground master). */
export const CRM_TENANT_DEFAULT_LABEL_COLORS: CrmLabelColorsConfig = {
  activityCall: { bg: "#2b6ec5", text: "#bfdbfe", border: "#60a5fa" },
  activityText: { bg: "#006156", text: "#94ffcd", border: "#34d399" },
  lenderPending: { bg: "#334155", text: "#cbd5e1", border: "#94a3b8" },
  lenderApproved: { bg: "#14532d", text: "#86efac", border: "#22c55e" },
  lenderDeclined: { bg: "#7f1d1d", text: "#fca5a5", border: "#ef4444" },
  activityComment: { bg: "#5d35a7", text: "#e9d5ff", border: "#c084fc" },
  recordingFailed: { bg: "#7f1d1d", text: "#fca5a5", border: "#ef4444" },
  recordingPending: { bg: "#374151", text: "#94a3b8", border: "#64748b" },
  lenderConditional: { bg: "#713f12", text: "#fde68a", border: "#eab308" },
  recordingRecorded: { bg: "#ff4242", text: "#ffffff", border: "#f59e0b" }
};

export const CRM_TENANT_DEFAULT_BRANDING_PATHS = {
  backgroundImagePath: CRM_BRANDING_STORAGE_PATHS.background,
  headerIconPath: CRM_BRANDING_STORAGE_PATHS.header_icon
} as const;

export type CrmTenantDefaultBrandingRecord = {
  accentColor: string;
  colorMode: CrmColorMode;
  headerTitle: string;
  headerSubtitle: string;
  footerText: string;
  appVersion: string;
  backgroundImagePath: string;
  headerIconPath: string;
  controlStyle: CrmControlStyleConfig;
  labelColors: CrmLabelColorsConfig;
};

/** Full branding row written to crm_org_settings on reset / new tenant seed. */
export function crmTenantDefaultBrandingRecord(): CrmTenantDefaultBrandingRecord {
  return {
    accentColor: CRM_TENANT_DEFAULT_ACCENT,
    colorMode: CRM_TENANT_DEFAULT_COLOR_MODE,
    headerTitle: CRM_TENANT_DEFAULT_HEADER_TITLE,
    headerSubtitle: CRM_TENANT_DEFAULT_HEADER_SUBTITLE,
    footerText: CRM_TENANT_DEFAULT_FOOTER_TEXT,
    appVersion: CRM_TENANT_DEFAULT_APP_VERSION,
    backgroundImagePath: CRM_TENANT_DEFAULT_BRANDING_PATHS.backgroundImagePath,
    headerIconPath: CRM_TENANT_DEFAULT_BRANDING_PATHS.headerIconPath,
    controlStyle: CRM_TENANT_DEFAULT_CONTROL_STYLE,
    labelColors: CRM_TENANT_DEFAULT_LABEL_COLORS
  };
}
