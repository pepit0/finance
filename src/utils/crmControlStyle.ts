export type CrmControlShape = "square" | "square_rounded" | "rounded";
export type CrmControlFillStyle = "filled" | "outline";
export type CrmTabIdleStyle = "empty" | "outline";
export type CrmPageOutlineShape = "square" | "square_rounded";

export type CrmControlStyleConfig = {
  buttonShape: CrmControlShape;
  tabShape: CrmControlShape;
  tabIdleStyle: CrmTabIdleStyle;
  tabActiveStyle: CrmControlFillStyle;
  buttonPrimaryStyle: CrmControlFillStyle;
  pageOutlineShape: CrmPageOutlineShape;
};

export const DEFAULT_CRM_CONTROL_STYLE: CrmControlStyleConfig = {
  buttonShape: "square_rounded",
  tabShape: "rounded",
  tabIdleStyle: "outline",
  tabActiveStyle: "filled",
  buttonPrimaryStyle: "filled",
  pageOutlineShape: "square_rounded"
};

const CONTROL_STYLE_CACHE_KEY = "crm-control-style-cache";

const BUTTON_SHAPE_CLASSES = [
  "crm-btn-shape-square",
  "crm-btn-shape-square-rounded",
  "crm-btn-shape-rounded"
] as const;

const TAB_SHAPE_CLASSES = [
  "crm-tab-shape-square",
  "crm-tab-shape-square-rounded",
  "crm-tab-shape-rounded"
] as const;

const PAGE_SHAPE_CLASSES = ["crm-page-shape-square", "crm-page-shape-square-rounded"] as const;

const TAB_IDLE_CLASSES = ["crm-tab-idle-empty", "crm-tab-idle-outline"] as const;
const TAB_ACTIVE_CLASSES = ["crm-tab-active-filled", "crm-tab-active-outline"] as const;
const BUTTON_PRIMARY_CLASSES = ["crm-btn-primary-filled", "crm-btn-primary-outline"] as const;

const ALL_CONTROL_STYLE_CLASSES = [
  ...BUTTON_SHAPE_CLASSES,
  ...TAB_SHAPE_CLASSES,
  ...PAGE_SHAPE_CLASSES,
  ...TAB_IDLE_CLASSES,
  ...TAB_ACTIVE_CLASSES,
  ...BUTTON_PRIMARY_CLASSES
] as const;

function isControlShape(value: string): value is CrmControlShape {
  return value === "square" || value === "square_rounded" || value === "rounded";
}

function isPageOutlineShape(value: string): value is CrmPageOutlineShape {
  return value === "square" || value === "square_rounded";
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
  return {
    buttonShape: isControlShape(String(input?.buttonShape ?? ""))
      ? input!.buttonShape
      : DEFAULT_CRM_CONTROL_STYLE.buttonShape,
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
      : DEFAULT_CRM_CONTROL_STYLE.pageOutlineShape
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
  root.classList.add(`crm-tab-shape-${config.tabShape.replace(/_/g, "-")}`);
  root.classList.add(`crm-page-shape-${config.pageOutlineShape.replace(/_/g, "-")}`);
  root.classList.add(`crm-tab-idle-${config.tabIdleStyle}`);
  root.classList.add(`crm-tab-active-${config.tabActiveStyle}`);
  root.classList.add(`crm-btn-primary-${config.buttonPrimaryStyle}`);

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
}

export function controlStyleEquals(a: CrmControlStyleConfig, b: CrmControlStyleConfig): boolean {
  return (
    a.buttonShape === b.buttonShape &&
    a.tabShape === b.tabShape &&
    a.tabIdleStyle === b.tabIdleStyle &&
    a.tabActiveStyle === b.tabActiveStyle &&
    a.buttonPrimaryStyle === b.buttonPrimaryStyle &&
    a.pageOutlineShape === b.pageOutlineShape
  );
}
