import { currentCrmColorMode, type CrmColorMode } from "./crmColorMode";
import { mixHex, normalizeHexColor, rgbaFromHex } from "./crmThemeColor";

export type CrmLabelColorKey =
  | "activityCall"
  | "activityComment"
  | "activityText"
  | "lenderApproved"
  | "lenderConditional"
  | "lenderDeclined"
  | "lenderPending"
  | "recordingRecorded"
  | "recordingPending"
  | "recordingFailed";

export type CrmLabelColorPair = {
  bg: string;
  text: string;
  border?: string;
};

export type CrmLabelColorsConfig = Record<CrmLabelColorKey, CrmLabelColorPair>;

const LABEL_COLOR_CACHE_KEY = "crm-label-colors";

const CSS_KEY: Record<CrmLabelColorKey, string> = {
  activityCall: "call",
  activityComment: "comment",
  activityText: "text",
  lenderApproved: "approved",
  lenderConditional: "conditional",
  lenderDeclined: "declined",
  lenderPending: "pending",
  recordingRecorded: "recorded",
  recordingPending: "recording-pending",
  recordingFailed: "failed"
};

export const CRM_LABEL_COLOR_KEYS = Object.keys(CSS_KEY) as CrmLabelColorKey[];

export const CRM_DEFAULT_LABEL_COLORS_LIGHT: CrmLabelColorsConfig = {
  activityCall: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
  activityComment: { bg: "#f3e8ff", text: "#6b21a8", border: "#d8b4fe" },
  activityText: { bg: "#ecfdf5", text: "#047857", border: "#6ee7b7" },
  lenderApproved: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  lenderConditional: { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },
  lenderDeclined: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  lenderPending: { bg: "#e2e8f0", text: "#475569", border: "#94a3b8" },
  recordingRecorded: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  recordingPending: { bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db" },
  recordingFailed: { bg: "#fef2f2", text: "#b91c1c", border: "#fca5a5" }
};

import { CRM_TENANT_DEFAULT_LABEL_COLORS } from "./crmTenantDefaults";

export const CRM_DEFAULT_LABEL_COLORS_DARK: CrmLabelColorsConfig = CRM_TENANT_DEFAULT_LABEL_COLORS;

export function defaultCrmLabelColors(mode: CrmColorMode = currentCrmColorMode()): CrmLabelColorsConfig {
  return mode === "light" ? CRM_DEFAULT_LABEL_COLORS_LIGHT : CRM_DEFAULT_LABEL_COLORS_DARK;
}

function normalizePair(raw: unknown, fallback: CrmLabelColorPair): CrmLabelColorPair {
  if (!raw || typeof raw !== "object") {
    return fallback;
  }
  const row = raw as Record<string, unknown>;
  const bgRaw = typeof row.bg === "string" ? row.bg.trim() : "";
  const textRaw = typeof row.text === "string" ? row.text.trim() : "";
  const borderRaw = typeof row.border === "string" ? row.border.trim() : "";

  const bg = normalizeHexColor(bgRaw) ?? (bgRaw.startsWith("rgba(") ? bgRaw : null) ?? fallback.bg;
  const text = normalizeHexColor(textRaw) ?? fallback.text;
  const border =
    normalizeHexColor(borderRaw) ?? (borderRaw.startsWith("rgba(") ? borderRaw : null) ?? fallback.border;

  return { bg, text, border };
}

export function normalizeCrmLabelColors(
  input: unknown,
  mode: CrmColorMode = currentCrmColorMode()
): CrmLabelColorsConfig {
  const defaults = defaultCrmLabelColors(mode);
  if (!input || typeof input !== "object") {
    return defaults;
  }
  const raw = input as Record<string, unknown>;
  const next = { ...defaults };
  for (const key of CRM_LABEL_COLOR_KEYS) {
    next[key] = normalizePair(raw[key], defaults[key]);
  }
  return next;
}

export function labelColorsEqual(a: CrmLabelColorsConfig, b: CrmLabelColorsConfig): boolean {
  return CRM_LABEL_COLOR_KEYS.every((key) => {
    const left = a[key];
    const right = b[key];
    return left.bg === right.bg && left.text === right.text && (left.border ?? "") === (right.border ?? "");
  });
}

export function readCachedCrmLabelColors(): CrmLabelColorsConfig | null {
  try {
    const raw = localStorage.getItem(LABEL_COLOR_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return normalizeCrmLabelColors(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeCachedCrmLabelColors(colors: CrmLabelColorsConfig) {
  try {
    localStorage.setItem(LABEL_COLOR_CACHE_KEY, JSON.stringify(colors));
  } catch {
    /* ignore */
  }
}

function resolvedBorder(pair: CrmLabelColorPair): string {
  if (pair.border) {
    return pair.border;
  }
  const textHex = normalizeHexColor(pair.text);
  if (textHex) {
    return mixHex(textHex, pair.bg.startsWith("#") ? pair.bg : "#ffffff", 0.55);
  }
  return pair.text;
}

function resolvedGlow(border: string): string {
  const hex = normalizeHexColor(border);
  if (hex) {
    return rgbaFromHex(hex, 0.35);
  }
  return "rgba(148, 163, 184, 0.35)";
}

export function applyCrmLabelColors(
  colorsInput: CrmLabelColorsConfig,
  options?: { persistCache?: boolean }
) {
  const colors = normalizeCrmLabelColors(colorsInput);
  const root = document.documentElement;

  for (const key of CRM_LABEL_COLOR_KEYS) {
    const cssKey = CSS_KEY[key];
    const pair = colors[key];
    const border = resolvedBorder(pair);
    root.style.setProperty(`--crm-label-${cssKey}-bg`, pair.bg);
    root.style.setProperty(`--crm-label-${cssKey}-text`, pair.text);
    root.style.setProperty(`--crm-label-${cssKey}-border`, border);
    root.style.setProperty(`--crm-label-${cssKey}-glow`, resolvedGlow(border));
  }

  if (options?.persistCache !== false) {
    writeCachedCrmLabelColors(colors);
  }
}

export function clearCrmLabelColorOverrides() {
  const root = document.documentElement;
  for (const key of CRM_LABEL_COLOR_KEYS) {
    const cssKey = CSS_KEY[key];
    root.style.removeProperty(`--crm-label-${cssKey}-bg`);
    root.style.removeProperty(`--crm-label-${cssKey}-text`);
    root.style.removeProperty(`--crm-label-${cssKey}-border`);
    root.style.removeProperty(`--crm-label-${cssKey}-glow`);
  }
}

export function parseCrmLabelColorsFromDb(value: unknown): CrmLabelColorsConfig | null {
  if (value == null) {
    return null;
  }
  return normalizeCrmLabelColors(value);
}

export const CRM_LABEL_COLOR_GROUPS: {
  title: string;
  description?: string;
  items: { key: CrmLabelColorKey; label: string }[];
}[] = [
  {
    title: "Calls & comments",
    description: "Call, Comment, and Text labels on the customer activity feed.",
    items: [
      { key: "activityCall", label: "Call" },
      { key: "activityComment", label: "Comment" },
      { key: "activityText", label: "Text" }
    ]
  },
  {
    title: "Approval status",
    description: "Lender decision tags on the customer profile and list.",
    items: [
      { key: "lenderApproved", label: "Approved" },
      { key: "lenderConditional", label: "Conditional" },
      { key: "lenderDeclined", label: "Declined" },
      { key: "lenderPending", label: "Pending" }
    ]
  },
  {
    title: "Call recordings",
    description: "Recorded, loading, and failed badges on call activities.",
    items: [
      { key: "recordingRecorded", label: "Recorded" },
      { key: "recordingPending", label: "Loading recording" },
      { key: "recordingFailed", label: "Call failed" }
    ]
  }
];
