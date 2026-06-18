export type CrmControlShape = "square" | "square_rounded" | "rounded";
export type CrmControlFillStyle = "filled" | "outline";
export type CrmTabIdleStyle = "empty" | "outline";
export type CrmPageOutlineShape = "square" | "square_rounded";
export type CrmHeaderLayout = "top" | "left";
export type CrmHeaderLogoAlign = "default" | "left" | "center" | "right";
export type CrmHeaderTitleAlign = "left" | "center" | "right";
export type CrmSidebarPanelStyle = "clear" | "outline" | "filled";
export type CrmScrollbarStyle = "default" | "filled";
export type CrmScrollbarShape = "rounded" | "square";
export type CrmScrollbarWidth = "thin" | "thick";

export type CrmControlStyleConfig = {
  buttonShape: CrmControlShape;
  fieldShape: CrmControlShape;
  tabShape: CrmControlShape;
  tabIdleStyle: CrmTabIdleStyle;
  tabActiveStyle: CrmControlFillStyle;
  buttonPrimaryStyle: CrmControlFillStyle;
  pageOutlineShape: CrmPageOutlineShape;
  headerLayout: CrmHeaderLayout;
  headerLogoAlign: CrmHeaderLogoAlign;
  headerTitleAlign: CrmHeaderTitleAlign;
  sidebarPanelStyle: CrmSidebarPanelStyle;
  scrollbarStyle: CrmScrollbarStyle;
  scrollbarShape: CrmScrollbarShape;
  scrollbarWidth: CrmScrollbarWidth;
};

export const DEFAULT_CRM_CONTROL_STYLE: CrmControlStyleConfig = {
  buttonShape: "square_rounded",
  fieldShape: "square_rounded",
  tabShape: "rounded",
  tabIdleStyle: "outline",
  tabActiveStyle: "filled",
  buttonPrimaryStyle: "filled",
  pageOutlineShape: "square_rounded",
  headerLayout: "top",
  headerLogoAlign: "default",
  headerTitleAlign: "left",
  sidebarPanelStyle: "filled",
  scrollbarStyle: "default",
  scrollbarShape: "rounded",
  scrollbarWidth: "thin"
};

const CONTROL_STYLE_CACHE_KEY = "crm-control-style-cache";

const BUTTON_SHAPE_CLASSES = [
  "crm-btn-shape-square",
  "crm-btn-shape-square-rounded",
  "crm-btn-shape-rounded"
] as const;

const FIELD_SHAPE_CLASSES = [
  "crm-field-shape-square",
  "crm-field-shape-square-rounded",
  "crm-field-shape-rounded"
] as const;

const TAB_SHAPE_CLASSES = [
  "crm-tab-shape-square",
  "crm-tab-shape-square-rounded",
  "crm-tab-shape-rounded"
] as const;

const PAGE_SHAPE_CLASSES = ["crm-page-shape-square", "crm-page-shape-square-rounded"] as const;
const HEADER_LAYOUT_CLASSES = ["crm-header-layout-top", "crm-header-layout-left"] as const;
const HEADER_LOGO_ALIGN_CLASSES = [
  "crm-header-logo-align-default",
  "crm-header-logo-align-left",
  "crm-header-logo-align-center",
  "crm-header-logo-align-right"
] as const;
const HEADER_TITLE_ALIGN_CLASSES = [
  "crm-header-title-align-left",
  "crm-header-title-align-center",
  "crm-header-title-align-right"
] as const;
const SIDEBAR_PANEL_CLASSES = [
  "crm-sidebar-panel-clear",
  "crm-sidebar-panel-outline",
  "crm-sidebar-panel-filled"
] as const;

const TAB_IDLE_CLASSES = ["crm-tab-idle-empty", "crm-tab-idle-outline"] as const;
const TAB_ACTIVE_CLASSES = ["crm-tab-active-filled", "crm-tab-active-outline"] as const;
const BUTTON_PRIMARY_CLASSES = ["crm-btn-primary-filled", "crm-btn-primary-outline"] as const;
const SCROLLBAR_STYLE_CLASSES = ["crm-scrollbar-default", "crm-scrollbar-outline", "crm-scrollbar-filled"] as const;
const SCROLLBAR_SHAPE_CLASSES = ["crm-scrollbar-shape-rounded", "crm-scrollbar-shape-square"] as const;
const SCROLLBAR_WIDTH_CLASSES = ["crm-scrollbar-width-thin", "crm-scrollbar-width-thick"] as const;

const ALL_CONTROL_STYLE_CLASSES = [
  ...BUTTON_SHAPE_CLASSES,
  ...FIELD_SHAPE_CLASSES,
  ...TAB_SHAPE_CLASSES,
  ...PAGE_SHAPE_CLASSES,
  ...HEADER_LAYOUT_CLASSES,
  ...HEADER_LOGO_ALIGN_CLASSES,
  ...HEADER_TITLE_ALIGN_CLASSES,
  ...SIDEBAR_PANEL_CLASSES,
  ...TAB_IDLE_CLASSES,
  ...TAB_ACTIVE_CLASSES,
  ...BUTTON_PRIMARY_CLASSES,
  ...SCROLLBAR_STYLE_CLASSES,
  ...SCROLLBAR_SHAPE_CLASSES,
  ...SCROLLBAR_WIDTH_CLASSES
] as const;

function isControlShape(value: string): value is CrmControlShape {
  return value === "square" || value === "square_rounded" || value === "rounded";
}

function isPageOutlineShape(value: string): value is CrmPageOutlineShape {
  return value === "square" || value === "square_rounded";
}

function isHeaderLayout(value: string): value is CrmHeaderLayout {
  return value === "top" || value === "left";
}

function isHeaderLogoAlign(value: string): value is CrmHeaderLogoAlign {
  return value === "default" || value === "left" || value === "center" || value === "right";
}

function isHeaderTitleAlign(value: string): value is CrmHeaderTitleAlign {
  return value === "left" || value === "center" || value === "right";
}

function isSidebarPanelStyle(value: string): value is CrmSidebarPanelStyle {
  return value === "clear" || value === "outline" || value === "filled";
}

function normalizeScrollbarStyle(value: string | null | undefined): CrmScrollbarStyle {
  if (value === "default" || value === "filled") {
    return value;
  }
  // Legacy DB value and old cache entries
  if (value === "outline") {
    return "default";
  }
  return DEFAULT_CRM_CONTROL_STYLE.scrollbarStyle;
}

function isScrollbarShape(value: string): value is CrmScrollbarShape {
  return value === "rounded" || value === "square";
}

function isScrollbarWidth(value: string): value is CrmScrollbarWidth {
  return value === "thin" || value === "thick";
}

function isFillStyle(value: string): value is CrmControlFillStyle {
  return value === "filled" || value === "outline";
}

function normalizeTabIdleStyle(value: string | null | undefined): CrmTabIdleStyle {
  if (value === "empty" || value === "outline") {
    return value;
  }
  // Legacy DB value and old cache entries
  if (value === "filled") {
    return "empty";
  }
  return DEFAULT_CRM_CONTROL_STYLE.tabIdleStyle;
}

export function normalizeCrmControlStyle(input: Partial<CrmControlStyleConfig> | null | undefined): CrmControlStyleConfig {
  const headerLayout = isHeaderLayout(String(input?.headerLayout ?? ""))
    ? input!.headerLayout
    : DEFAULT_CRM_CONTROL_STYLE.headerLayout;
  let headerLogoAlign = isHeaderLogoAlign(String(input?.headerLogoAlign ?? ""))
    ? input!.headerLogoAlign
    : DEFAULT_CRM_CONTROL_STYLE.headerLogoAlign;
  if (headerLayout === "top" && (headerLogoAlign === "center" || headerLogoAlign === "default")) {
    headerLogoAlign = "left";
  }

  return {
    buttonShape: isControlShape(String(input?.buttonShape ?? ""))
      ? input!.buttonShape
      : DEFAULT_CRM_CONTROL_STYLE.buttonShape,
    fieldShape: isControlShape(String(input?.fieldShape ?? ""))
      ? input!.fieldShape
      : DEFAULT_CRM_CONTROL_STYLE.fieldShape,
    tabShape: isControlShape(String(input?.tabShape ?? "")) ? input!.tabShape : DEFAULT_CRM_CONTROL_STYLE.tabShape,
    tabIdleStyle: normalizeTabIdleStyle(input?.tabIdleStyle as string | undefined),
    tabActiveStyle: isFillStyle(String(input?.tabActiveStyle ?? ""))
      ? input!.tabActiveStyle
      : DEFAULT_CRM_CONTROL_STYLE.tabActiveStyle,
    buttonPrimaryStyle: isFillStyle(String(input?.buttonPrimaryStyle ?? ""))
      ? input!.buttonPrimaryStyle
      : DEFAULT_CRM_CONTROL_STYLE.buttonPrimaryStyle,
    pageOutlineShape: isPageOutlineShape(String(input?.pageOutlineShape ?? ""))
      ? input!.pageOutlineShape
      : DEFAULT_CRM_CONTROL_STYLE.pageOutlineShape,
    headerLayout,
    headerLogoAlign,
    headerTitleAlign: isHeaderTitleAlign(String(input?.headerTitleAlign ?? ""))
      ? input!.headerTitleAlign
      : DEFAULT_CRM_CONTROL_STYLE.headerTitleAlign,
    sidebarPanelStyle: isSidebarPanelStyle(String(input?.sidebarPanelStyle ?? ""))
      ? input!.sidebarPanelStyle
      : DEFAULT_CRM_CONTROL_STYLE.sidebarPanelStyle,
    scrollbarStyle: normalizeScrollbarStyle(input?.scrollbarStyle as string | undefined),
    scrollbarShape: isScrollbarShape(String(input?.scrollbarShape ?? ""))
      ? input!.scrollbarShape
      : DEFAULT_CRM_CONTROL_STYLE.scrollbarShape,
    scrollbarWidth: isScrollbarWidth(String(input?.scrollbarWidth ?? ""))
      ? input!.scrollbarWidth
      : DEFAULT_CRM_CONTROL_STYLE.scrollbarWidth
  };
}

export function readCachedCrmControlStyle(): CrmControlStyleConfig | null {
  try {
    const raw = localStorage.getItem(CONTROL_STYLE_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return normalizeCrmControlStyle(JSON.parse(raw) as Partial<CrmControlStyleConfig>);
  } catch {
    return null;
  }
}

export function writeCachedCrmControlStyle(config: CrmControlStyleConfig) {
  try {
    localStorage.setItem(CONTROL_STYLE_CACHE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

export function applyCrmControlStyle(
  input: Partial<CrmControlStyleConfig> | null | undefined,
  options?: { persistCache?: boolean }
) {
  const config = normalizeCrmControlStyle(input);
  const root = document.documentElement;

  for (const className of ALL_CONTROL_STYLE_CLASSES) {
    root.classList.remove(className);
  }

  root.classList.add(`crm-btn-shape-${config.buttonShape.replace(/_/g, "-")}`);
  root.classList.add(`crm-field-shape-${config.fieldShape.replace(/_/g, "-")}`);
  root.classList.add(`crm-tab-shape-${config.tabShape.replace(/_/g, "-")}`);
  root.classList.add(`crm-page-shape-${config.pageOutlineShape.replace(/_/g, "-")}`);
  root.classList.add(`crm-header-layout-${config.headerLayout}`);
  root.classList.add(`crm-header-logo-align-${config.headerLogoAlign}`);
  root.classList.add(`crm-header-title-align-${config.headerTitleAlign}`);
  root.classList.add(`crm-sidebar-panel-${config.sidebarPanelStyle}`);
  root.classList.add(`crm-tab-idle-${config.tabIdleStyle}`);
  root.classList.add(`crm-tab-active-${config.tabActiveStyle}`);
  root.classList.add(`crm-btn-primary-${config.buttonPrimaryStyle}`);
  root.classList.add(`crm-scrollbar-${config.scrollbarStyle}`);
  root.classList.add(`crm-scrollbar-shape-${config.scrollbarShape}`);
  root.classList.add(`crm-scrollbar-width-${config.scrollbarWidth}`);
  root.dataset.crmScrollbarShape = config.scrollbarShape;
  root.dataset.crmScrollbarWidth = config.scrollbarWidth;

  if (options?.persistCache !== false) {
    writeCachedCrmControlStyle(config);
  }

  return config;
}

export function clearCrmControlStyleClasses() {
  const root = document.documentElement;
  for (const className of ALL_CONTROL_STYLE_CLASSES) {
    root.classList.remove(className);
  }
  delete root.dataset.crmScrollbarShape;
  delete root.dataset.crmScrollbarWidth;
}

export function controlStyleEquals(a: CrmControlStyleConfig, b: CrmControlStyleConfig): boolean {
  return (
    a.buttonShape === b.buttonShape &&
    a.fieldShape === b.fieldShape &&
    a.tabShape === b.tabShape &&
    a.tabIdleStyle === b.tabIdleStyle &&
    a.tabActiveStyle === b.tabActiveStyle &&
    a.buttonPrimaryStyle === b.buttonPrimaryStyle &&
    a.pageOutlineShape === b.pageOutlineShape &&
    a.headerLayout === b.headerLayout &&
    a.headerLogoAlign === b.headerLogoAlign &&
    a.headerTitleAlign === b.headerTitleAlign &&
    a.sidebarPanelStyle === b.sidebarPanelStyle &&
    a.scrollbarStyle === b.scrollbarStyle &&
    a.scrollbarShape === b.scrollbarShape &&
    a.scrollbarWidth === b.scrollbarWidth
  );
}
