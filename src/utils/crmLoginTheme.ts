import {
  applyCrmColorMode,
  CRM_DEFAULT_COLOR_MODE,
  normalizeCrmColorMode,
  readCachedCrmColorMode,
  type CrmColorMode
} from "./crmColorMode";
import {
  applyCrmControlStyle,
  DEFAULT_CRM_CONTROL_STYLE,
  readCachedCrmControlStyle,
  type CrmControlStyleConfig
} from "./crmControlStyle";
import {
  applyCrmAccentTheme,
  CRM_DEFAULT_ACCENT,
  normalizeHexColor,
  readCachedCrmAccent
} from "./crmThemeColor";
import { readCachedCrmBranding, writeCachedCrmBranding } from "./crmBrandingAssets";
import {
  CRM_DEFAULT_HEADER_SUBTITLE,
  CRM_DEFAULT_HEADER_TITLE,
  parseCrmHeaderSubtitle,
  parseCrmHeaderTitle
} from "./crmHeaderCopy";

export type CrmLoginBrandingCopy = {
  headerTitle: string;
  headerSubtitle: string;
};

export function readCachedCrmLoginBrandingCopy(): CrmLoginBrandingCopy {
  const cached = readCachedCrmBranding();
  return {
    headerTitle: cached?.headerTitle?.trim() || CRM_DEFAULT_HEADER_TITLE,
    headerSubtitle: cached?.headerSubtitle?.trim() ?? CRM_DEFAULT_HEADER_SUBTITLE
  };
}

export function applyCrmLoginTheme(input: {
  accentColor: string;
  colorMode: CrmColorMode;
  controlStyle?: CrmControlStyleConfig;
  persistCache?: boolean;
}) {
  const persistCache = input.persistCache ?? false;
  applyCrmColorMode(input.colorMode, { persistCache });
  applyCrmControlStyle(input.controlStyle ?? readCachedCrmControlStyle() ?? DEFAULT_CRM_CONTROL_STYLE, {
    persistCache
  });
  applyCrmAccentTheme(input.accentColor, { persistCache });
}

/** Apply cached tenant branding immediately (used before auth on the login screen). */
export function applyCachedCrmLoginTheme() {
  applyCrmLoginTheme({
    accentColor: readCachedCrmAccent() ?? CRM_DEFAULT_ACCENT,
    colorMode: readCachedCrmColorMode() ?? CRM_DEFAULT_COLOR_MODE,
    controlStyle: readCachedCrmControlStyle() ?? DEFAULT_CRM_CONTROL_STYLE,
    persistCache: false
  });
}

export function persistCrmLoginBrandingCopy(copy: CrmLoginBrandingCopy) {
  const existing = readCachedCrmBranding();
  writeCachedCrmBranding({
    backgroundSrc: existing?.backgroundSrc,
    headerIconSrc: existing?.headerIconSrc,
    headerTitle: copy.headerTitle,
    headerSubtitle: copy.headerSubtitle,
    footerText: existing?.footerText,
    appVersion: existing?.appVersion
  });
}

export function parseCrmPublicLoginBranding(data: unknown): {
  accentColor: string;
  colorMode: CrmColorMode;
  headerTitle: string;
  headerSubtitle: string;
} | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const row = data as Record<string, unknown>;
  const accentColor = normalizeHexColor(String(row.accent_color ?? row.accentColor ?? ""));
  if (!accentColor) {
    return null;
  }
  return {
    accentColor,
    colorMode: normalizeCrmColorMode(row.color_mode ?? row.colorMode),
    headerTitle: parseCrmHeaderTitle(
      row.header_title != null ? String(row.header_title) : row.headerTitle != null ? String(row.headerTitle) : null
    ),
    headerSubtitle: parseCrmHeaderSubtitle(
      row.header_subtitle != null
        ? String(row.header_subtitle)
        : row.headerSubtitle != null
          ? String(row.headerSubtitle)
          : null
    )
  };
}
