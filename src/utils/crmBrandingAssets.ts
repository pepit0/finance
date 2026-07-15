import tenantDefaultBackground from "../../assets/tenant-default-branding/background.png";
import defaultHeaderIcon from "../assets/Tlogo.png";
import { supabase } from "../lib/supabase";

export const CRM_BRANDING_BUCKET = "crm-branding";

export const CRM_BRANDING_STORAGE_PATHS = {
  background: "default/background.png",
  header_icon: "default/header-icon.png"
} as const;

/** User uploads — kept separate so "Use default" can restore seeded default/ assets. */
export const CRM_BRANDING_CUSTOM_PATHS = {
  background: "custom/background.png",
  header_icon: "custom/header-icon.png"
} as const;

/** Virtual path — renders product-site Feath mark (theme-aware SVG), not a storage file. */
export const CRM_BUILTIN_FEATH_HEADER_ICON_PATH = "builtin/feath-mark";

export function isBuiltinFeathHeaderIconPath(path: string | null | undefined): boolean {
  return path === CRM_BUILTIN_FEATH_HEADER_ICON_PATH;
}

export function isCustomHeaderIconPath(path: string | null | undefined): boolean {
  return path === CRM_BRANDING_CUSTOM_PATHS.header_icon;
}

export function isTenantDefaultBackgroundPath(path: string | null | undefined): boolean {
  return path === CRM_BRANDING_STORAGE_PATHS.background;
}

export function isCustomBackgroundPath(path: string | null | undefined): boolean {
  return path === CRM_BRANDING_CUSTOM_PATHS.background;
}

export function crmBrandingUploadPath(kind: CrmBrandingAssetKind): string {
  return CRM_BRANDING_CUSTOM_PATHS[kind];
}

export type CrmBrandingAssetKind = keyof typeof CRM_BRANDING_STORAGE_PATHS;

export const CRM_DEFAULT_BACKGROUND_SRC = tenantDefaultBackground;
export const CRM_DEFAULT_HEADER_ICON_SRC = defaultHeaderIcon;

export const CRM_BRANDING_MAX_BYTES = 4 * 1024 * 1024;

const BRANDING_CACHE_KEY = "crm-branding-cache";

type BrandingCache = {
  backgroundSrc?: string | null;
  headerIconSrc?: string | null;
  headerTitle?: string;
  headerSubtitle?: string;
  footerText?: string;
  appVersion?: string;
};

export function validateCrmBrandingPng(file: File): string | null {
  if (file.type !== "image/png") {
    return "Upload a PNG image.";
  }
  if (file.size > CRM_BRANDING_MAX_BYTES) {
    return "PNG must be 4 MB or smaller.";
  }
  return null;
}

export function resolveCrmBrandingPublicUrl(path: string, version?: string | null): string {
  const { data } = supabase.storage.from(CRM_BRANDING_BUCKET).getPublicUrl(path);
  if (!version) {
    return data.publicUrl;
  }
  const joiner = data.publicUrl.includes("?") ? "&" : "?";
  return `${data.publicUrl}${joiner}v=${encodeURIComponent(version)}`;
}

export function readCachedCrmBranding(): BrandingCache | null {
  try {
    const raw = localStorage.getItem(BRANDING_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as BrandingCache;
  } catch {
    return null;
  }
}

export function writeCachedCrmBranding(cache: BrandingCache) {
  try {
    localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

export function applyCrmBackgroundImage(customSrc: string | null) {
  const root = document.documentElement;
  if (!customSrc) {
    root.style.removeProperty("--crm-brand-background-image");
    return;
  }
  root.style.setProperty("--crm-brand-background-image", `url("${customSrc.replace(/"/g, '\\"')}")`);
}

export function brandingSrcFromPath(
  path: string | null | undefined,
  kind: CrmBrandingAssetKind,
  version?: string | null
): string {
  if (kind === "header_icon" && isBuiltinFeathHeaderIconPath(path)) {
    return CRM_DEFAULT_HEADER_ICON_SRC;
  }
  if (!path) {
    return kind === "background" ? CRM_DEFAULT_BACKGROUND_SRC : CRM_DEFAULT_HEADER_ICON_SRC;
  }
  return resolveCrmBrandingPublicUrl(path, version);
}
