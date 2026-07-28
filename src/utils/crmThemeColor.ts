import { currentCrmColorMode } from "./crmColorMode";
import { CRM_TENANT_DEFAULT_ACCENT } from "./crmTenantDefaults";

export const CRM_DEFAULT_ACCENT = CRM_TENANT_DEFAULT_ACCENT;

const ACCENT_CACHE_KEY = "crm-theme-accent";

type Rgb = { r: number; g: number; b: number };

export function normalizeHexColor(input: string): string | null {
  const trimmed = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }
  return null;
}

export function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHexColor(hex);
  if (!normalized) {
    return null;
  }
  const raw = normalized.slice(1);
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16)
  };
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b]
    .map((channel) => clampByte(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function mixHex(base: string, target: string, ratio: number): string {
  const a = hexToRgb(base);
  const b = hexToRgb(target);
  if (!a || !b) {
    return CRM_DEFAULT_ACCENT;
  }
  const t = Math.max(0, Math.min(1, ratio));
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t
  });
}

export function lightenHex(hex: string, ratio: number): string {
  return mixHex(hex, "#ffffff", ratio);
}

export function rgbaFromHex(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return `rgba(240, 93, 34, ${alpha})`;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function readCachedCrmAccent(): string | null {
  try {
    return normalizeHexColor(localStorage.getItem(ACCENT_CACHE_KEY) ?? "");
  } catch {
    return null;
  }
}

export function writeCachedCrmAccent(accent: string) {
  try {
    localStorage.setItem(ACCENT_CACHE_KEY, accent);
  } catch {
    /* ignore */
  }
}

const CRM_ACCENT_CSS_VARS = [
  "--tempt-accent",
  "--tempt-accent-hover",
  "--tempt-accent-muted",
  "--tempt-accent-warn-bg",
  "--tempt-accent-warn-border",
  "--tempt-accent-warn-text",
  "--tempt-accent-spinner-track",
  "--tempt-accent-glow",
  "--tempt-login-gradient-mid"
] as const;

export function applyCrmAccentTheme(accentInput: string, options?: { persistCache?: boolean }) {
  const accent = normalizeHexColor(accentInput) ?? CRM_DEFAULT_ACCENT;
  const root = document.documentElement;
  const isLight = currentCrmColorMode() === "light";

  root.style.setProperty("--tempt-accent", accent);
  root.style.setProperty("--tempt-accent-hover", lightenHex(accent, 0.18));
  root.style.setProperty("--tempt-accent-muted", rgbaFromHex(accent, isLight ? 0.12 : 0.18));
  root.style.setProperty("--tempt-accent-warn-bg", rgbaFromHex(accent, isLight ? 0.1 : 0.12));
  root.style.setProperty("--tempt-accent-warn-border", rgbaFromHex(accent, isLight ? 0.35 : 0.45));
  root.style.setProperty(
    "--tempt-accent-warn-text",
    isLight ? mixHex(accent, "#7c2d12", 0.55) : lightenHex(accent, 0.52)
  );
  root.style.setProperty("--tempt-accent-spinner-track", rgbaFromHex(accent, isLight ? 0.2 : 0.25));
  root.style.setProperty("--tempt-accent-glow", rgbaFromHex(accent, isLight ? 0.1 : 0.14));
  root.style.setProperty(
    "--tempt-login-gradient-mid",
    isLight ? mixHex(accent, "#ffffff", 0.92) : mixHex(accent, "#0c0d10", 0.88)
  );

  if (options?.persistCache !== false) {
    writeCachedCrmAccent(accent);
  }
}

export function clearCrmAccentThemeOverrides() {
  const root = document.documentElement;
  for (const name of CRM_ACCENT_CSS_VARS) {
    root.style.removeProperty(name);
  }
}
