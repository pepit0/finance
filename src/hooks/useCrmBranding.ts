import { useCallback, useEffect, useState } from "react";
import {
  restoreCrmBrandingAsset,
  fetchCrmOrgBranding,
  updateCrmColorMode,
  updateCrmControlStyle,
  updateCrmHeaderCopy,
  updateCrmLabelColors,
  updateCrmThemeAccentColor,
  uploadCrmBrandingPng
} from "../lib/crmApi";
import {
  applyCrmBackgroundImage,
  brandingSrcFromPath,
  CRM_DEFAULT_BACKGROUND_SRC,
  CRM_DEFAULT_HEADER_ICON_SRC,
  readCachedCrmBranding,
  validateCrmBrandingPng,
  writeCachedCrmBranding
} from "../utils/crmBrandingAssets";
import type { CrmBrandingAssetKind } from "../utils/crmBrandingAssets";
import {
  applyCrmColorMode,
  CRM_DEFAULT_COLOR_MODE,
  normalizeCrmColorMode,
  readCachedCrmColorMode,
  type CrmColorMode
} from "../utils/crmColorMode";
import {
  applyCrmAccentTheme,
  CRM_DEFAULT_ACCENT,
  normalizeHexColor,
  readCachedCrmAccent
} from "../utils/crmThemeColor";
import {
  CRM_DEFAULT_APP_VERSION,
  CRM_DEFAULT_FOOTER_TEXT,
  CRM_DEFAULT_HEADER_SUBTITLE,
  CRM_DEFAULT_HEADER_TITLE,
  CRM_HEADER_SUBTITLE_MAX,
  CRM_HEADER_TITLE_MAX,
  normalizeCrmHeaderSubtitle,
  normalizeCrmHeaderTitle,
  parseCrmHeaderSubtitle,
  parseCrmHeaderTitle
} from "../utils/crmHeaderCopy";
import {
  applyCrmControlStyle,
  controlStyleEquals,
  DEFAULT_CRM_CONTROL_STYLE,
  normalizeCrmControlStyle,
  readCachedCrmControlStyle,
  type CrmControlStyleConfig
} from "../utils/crmControlStyle";
import {
  applyCrmLabelColors,
  defaultCrmLabelColors,
  labelColorsEqual,
  normalizeCrmLabelColors,
  parseCrmLabelColorsFromDb,
  readCachedCrmLabelColors,
  type CrmLabelColorKey,
  type CrmLabelColorPair,
  type CrmLabelColorsConfig
} from "../utils/crmLabelColors";

function persistHeaderCopyCache(
  headerTitle: string,
  headerSubtitle: string,
  footerText?: string,
  appVersion?: string
) {
  const existing = readCachedCrmBranding();
  writeCachedCrmBranding({
    backgroundSrc: existing?.backgroundSrc,
    headerIconSrc: existing?.headerIconSrc,
    headerTitle,
    headerSubtitle,
    footerText: footerText ?? existing?.footerText,
    appVersion: appVersion ?? existing?.appVersion
  });
}

function parseFooterText(raw: string | null | undefined): string {
  if (raw == null) {
    return CRM_DEFAULT_FOOTER_TEXT;
  }
  return String(raw);
}

function parseAppVersion(raw: string | null | undefined): string {
  if (raw == null || !String(raw).trim()) {
    return CRM_DEFAULT_APP_VERSION;
  }
  return String(raw).trim();
}

function applyBrandingSnapshot(input: {
  accentColor: string;
  colorMode: CrmColorMode;
  controlStyle: CrmControlStyleConfig;
  customBackgroundSrc: string | null;
  headerIconSrc: string;
  labelColors: CrmLabelColorsConfig;
  persistCache?: boolean;
}) {
  applyCrmColorMode(input.colorMode, { persistCache: input.persistCache });
  applyCrmAccentTheme(input.accentColor, { persistCache: input.persistCache });
  applyCrmControlStyle(input.controlStyle, { persistCache: input.persistCache });
  applyCrmLabelColors(input.labelColors, { persistCache: input.persistCache });
  applyCrmBackgroundImage(input.customBackgroundSrc);
  if (input.persistCache !== false) {
    writeCachedCrmBranding({
      backgroundSrc: input.customBackgroundSrc,
      headerIconSrc: input.headerIconSrc
    });
  }
}

export function useCrmBranding() {
  const cachedBranding = readCachedCrmBranding();
  const [accentColor, setAccentColor] = useState(() => readCachedCrmAccent() ?? CRM_DEFAULT_ACCENT);
  const [savedAccentColor, setSavedAccentColor] = useState(CRM_DEFAULT_ACCENT);
  const [backgroundSrc, setBackgroundSrc] = useState(
    () => cachedBranding?.backgroundSrc ?? CRM_DEFAULT_BACKGROUND_SRC
  );
  const [customBackgroundSrc, setCustomBackgroundSrc] = useState<string | null>(
    () => cachedBranding?.backgroundSrc ?? null
  );
  const [headerIconSrc, setHeaderIconSrc] = useState(
    () => cachedBranding?.headerIconSrc ?? CRM_DEFAULT_HEADER_ICON_SRC
  );
  const [savedBackgroundPath, setSavedBackgroundPath] = useState<string | null>(null);
  const [savedHeaderIconPath, setSavedHeaderIconPath] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<CrmColorMode>(
    () => readCachedCrmColorMode() ?? CRM_DEFAULT_COLOR_MODE
  );
  const [savedColorMode, setSavedColorMode] = useState<CrmColorMode>(CRM_DEFAULT_COLOR_MODE);
  const [headerTitle, setHeaderTitle] = useState(
    () => cachedBranding?.headerTitle ?? CRM_DEFAULT_HEADER_TITLE
  );
  const [headerSubtitle, setHeaderSubtitle] = useState(
    () => cachedBranding?.headerSubtitle ?? CRM_DEFAULT_HEADER_SUBTITLE
  );
  const [savedHeaderTitle, setSavedHeaderTitle] = useState(CRM_DEFAULT_HEADER_TITLE);
  const [savedHeaderSubtitle, setSavedHeaderSubtitle] = useState(CRM_DEFAULT_HEADER_SUBTITLE);
  const [footerText, setFooterText] = useState(() => cachedBranding?.footerText ?? CRM_DEFAULT_FOOTER_TEXT);
  const [appVersion, setAppVersion] = useState(() => cachedBranding?.appVersion ?? CRM_DEFAULT_APP_VERSION);
  const [controlStyle, setControlStyle] = useState<CrmControlStyleConfig>(
    () => readCachedCrmControlStyle() ?? DEFAULT_CRM_CONTROL_STYLE
  );
  const [savedControlStyle, setSavedControlStyle] = useState<CrmControlStyleConfig>(DEFAULT_CRM_CONTROL_STYLE);
  const [labelColors, setLabelColors] = useState<CrmLabelColorsConfig>(
    () => readCachedCrmLabelColors() ?? defaultCrmLabelColors()
  );
  const [savedLabelColors, setSavedLabelColors] = useState<CrmLabelColorsConfig | null>(null);
  const [hasCustomLabelColors, setHasCustomLabelColors] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingAccent, setSavingAccent] = useState(false);
  const [savingLabelColors, setSavingLabelColors] = useState(false);
  const [savingColorMode, setSavingColorMode] = useState(false);
  const [savingControlStyle, setSavingControlStyle] = useState(false);
  const [savingHeaderCopy, setSavingHeaderCopy] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<CrmBrandingAssetKind | null>(null);
  const [clearingKind, setClearingKind] = useState<CrmBrandingAssetKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = readCachedCrmBranding();
    const accent = readCachedCrmAccent() ?? CRM_DEFAULT_ACCENT;
    const mode = readCachedCrmColorMode() ?? CRM_DEFAULT_COLOR_MODE;
    const style = readCachedCrmControlStyle() ?? DEFAULT_CRM_CONTROL_STYLE;
    const cachedLabelColors = readCachedCrmLabelColors() ?? defaultCrmLabelColors(mode);
    applyBrandingSnapshot({
      accentColor: accent,
      colorMode: mode,
      controlStyle: style,
      customBackgroundSrc: cached?.backgroundSrc ?? null,
      headerIconSrc: cached?.headerIconSrc ?? CRM_DEFAULT_HEADER_ICON_SRC,
      labelColors: cachedLabelColors,
      persistCache: false
    });
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchCrmOrgBranding();
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    const accent = result.accentColor ?? CRM_DEFAULT_ACCENT;
    const nextColorMode = normalizeCrmColorMode(result.colorMode);
    const nextCustomBackgroundSrc = result.backgroundImagePath
      ? brandingSrcFromPath(result.backgroundImagePath, "background", result.updatedAt)
      : null;
    const nextBackgroundSrc = nextCustomBackgroundSrc ?? CRM_DEFAULT_BACKGROUND_SRC;
    const nextHeaderIconSrc = brandingSrcFromPath(result.headerIconPath, "header_icon", result.updatedAt);

    setAccentColor(accent);
    setSavedAccentColor(accent);
    setSavedBackgroundPath(result.backgroundImagePath);
    setSavedHeaderIconPath(result.headerIconPath);
    setCustomBackgroundSrc(nextCustomBackgroundSrc);
    setBackgroundSrc(nextBackgroundSrc);
    setHeaderIconSrc(nextHeaderIconSrc);
    setColorMode(nextColorMode);
    setSavedColorMode(nextColorMode);
    const nextHeaderTitle = parseCrmHeaderTitle(result.headerTitle);
    const nextHeaderSubtitle = parseCrmHeaderSubtitle(result.headerSubtitle);
    const nextFooterText = parseFooterText(result.footerText);
    const nextAppVersion = parseAppVersion(result.appVersion);
    setHeaderTitle(nextHeaderTitle);
    setHeaderSubtitle(nextHeaderSubtitle);
    setSavedHeaderTitle(nextHeaderTitle);
    setSavedHeaderSubtitle(nextHeaderSubtitle);
    setFooterText(nextFooterText);
    setAppVersion(nextAppVersion);
    persistHeaderCopyCache(nextHeaderTitle, nextHeaderSubtitle, nextFooterText, nextAppVersion);
    document.title = nextHeaderTitle;
    const nextControlStyle = normalizeCrmControlStyle({
      buttonShape: result.buttonShape,
      fieldShape: result.fieldShape,
      tabShape: result.tabShape,
      tabIdleStyle: result.tabIdleStyle,
      tabActiveStyle: result.tabActiveStyle,
      buttonPrimaryStyle: result.buttonPrimaryStyle,
      pageOutlineShape: result.pageOutlineShape,
      headerLayout: result.headerLayout,
      headerLogoAlign: result.headerLogoAlign,
      headerTitleAlign: result.headerTitleAlign,
      sidebarPanelStyle: result.sidebarPanelStyle,
      scrollbarStyle: result.scrollbarStyle,
      scrollbarShape: result.scrollbarShape,
      scrollbarWidth: result.scrollbarWidth
    });
    setControlStyle(nextControlStyle);
    setSavedControlStyle(nextControlStyle);
    const parsedLabelColors = parseCrmLabelColorsFromDb(result.labelColors);
    const nextLabelColors = parsedLabelColors ?? defaultCrmLabelColors(nextColorMode);
    setLabelColors(nextLabelColors);
    setSavedLabelColors(parsedLabelColors);
    setHasCustomLabelColors(Boolean(parsedLabelColors));
    applyBrandingSnapshot({
      accentColor: accent,
      colorMode: nextColorMode,
      controlStyle: nextControlStyle,
      customBackgroundSrc: nextCustomBackgroundSrc,
      headerIconSrc: nextHeaderIconSrc,
      labelColors: nextLabelColors
    });
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const previewAccentColor = useCallback((nextInput: string) => {
    const next = normalizeHexColor(nextInput);
    if (!next) {
      return;
    }
    setAccentColor(next);
    applyCrmAccentTheme(next, { persistCache: false });
  }, []);

  const saveAccentColor = useCallback(async (nextInput: string) => {
    const next = normalizeHexColor(nextInput);
    if (!next) {
      setError("Enter a valid 6-digit hex color (for example #f05d22).");
      return false;
    }

    setSavingAccent(true);
    setError(null);
    const result = await updateCrmThemeAccentColor(next);
    setSavingAccent(false);
    if (result.error) {
      setError(result.error);
      return false;
    }

    setAccentColor(next);
    setSavedAccentColor(next);
    applyBrandingSnapshot({
      accentColor: next,
      colorMode,
      controlStyle,
      customBackgroundSrc,
      headerIconSrc,
      labelColors
    });
    return true;
  }, [colorMode, controlStyle, customBackgroundSrc, headerIconSrc, labelColors]);

  const resetAccentColor = useCallback(async () => {
    return saveAccentColor(CRM_DEFAULT_ACCENT);
  }, [saveAccentColor]);

  const saveColorMode = useCallback(
    async (nextMode: CrmColorMode) => {
      const normalized = normalizeCrmColorMode(nextMode);
      if (normalized === savedColorMode) {
        return true;
      }

      setSavingColorMode(true);
      setError(null);
      setColorMode(normalized);
      const nextLabelColors = hasCustomLabelColors ? labelColors : defaultCrmLabelColors(normalized);
      if (!hasCustomLabelColors) {
        setLabelColors(nextLabelColors);
      }
      applyBrandingSnapshot({
        accentColor,
        colorMode: normalized,
        controlStyle,
        customBackgroundSrc,
        headerIconSrc,
        labelColors: nextLabelColors,
        persistCache: false
      });

      const result = await updateCrmColorMode(normalized);
      setSavingColorMode(false);
      if (result.error) {
        setError(result.error);
        setColorMode(savedColorMode);
        const rollbackLabelColors = hasCustomLabelColors ? labelColors : defaultCrmLabelColors(savedColorMode);
        if (!hasCustomLabelColors) {
          setLabelColors(rollbackLabelColors);
        }
        applyBrandingSnapshot({
          accentColor,
          colorMode: savedColorMode,
          controlStyle,
          customBackgroundSrc,
          headerIconSrc,
          labelColors: rollbackLabelColors,
          persistCache: false
        });
        return false;
      }

      setSavedColorMode(normalized);
      applyBrandingSnapshot({
        accentColor,
        colorMode: normalized,
        controlStyle,
        customBackgroundSrc,
        headerIconSrc,
        labelColors: nextLabelColors
      });
      return true;
    },
    [accentColor, controlStyle, customBackgroundSrc, hasCustomLabelColors, headerIconSrc, labelColors, savedColorMode]
  );

  const patchControlStyle = useCallback(
    async (patch: Partial<CrmControlStyleConfig>) => {
      const next = normalizeCrmControlStyle({ ...controlStyle, ...patch });
      if (controlStyleEquals(next, savedControlStyle)) {
        return true;
      }

      setSavingControlStyle(true);
      setError(null);
      setControlStyle(next);
      applyBrandingSnapshot({
        accentColor,
        colorMode,
        controlStyle: next,
        customBackgroundSrc,
        headerIconSrc,
        labelColors,
        persistCache: false
      });

      const result = await updateCrmControlStyle(next);
      setSavingControlStyle(false);
      if (result.error) {
        setError(result.error);
        setControlStyle(savedControlStyle);
        applyBrandingSnapshot({
          accentColor,
          colorMode,
          controlStyle: savedControlStyle,
          customBackgroundSrc,
          headerIconSrc,
          labelColors,
          persistCache: false
        });
        return false;
      }

      setSavedControlStyle(next);
      applyBrandingSnapshot({
        accentColor,
        colorMode,
        controlStyle: next,
        customBackgroundSrc,
        headerIconSrc,
        labelColors
      });
      return true;
    },
    [accentColor, colorMode, controlStyle, customBackgroundSrc, headerIconSrc, labelColors, savedControlStyle]
  );

  const previewHeaderTitle = useCallback((value: string) => {
    setHeaderTitle(value);
  }, []);

  const previewHeaderSubtitle = useCallback((value: string) => {
    setHeaderSubtitle(value);
  }, []);

  const saveHeaderCopy = useCallback(
    async (titleInput: string, subtitleInput: string) => {
      const nextTitle = normalizeCrmHeaderTitle(titleInput);
      if (!nextTitle) {
        setError(`Enter a title between 1 and ${CRM_HEADER_TITLE_MAX} characters.`);
        return false;
      }

      const nextSubtitle = normalizeCrmHeaderSubtitle(subtitleInput);
      if (nextSubtitle === null) {
        setError(`Subtitle must be ${CRM_HEADER_SUBTITLE_MAX} characters or fewer.`);
        return false;
      }

      setSavingHeaderCopy(true);
      setError(null);
      const result = await updateCrmHeaderCopy({
        headerTitle: nextTitle,
        headerSubtitle: nextSubtitle
      });
      setSavingHeaderCopy(false);
      if (result.error) {
        setError(result.error);
        return false;
      }

      setHeaderTitle(nextTitle);
      setHeaderSubtitle(nextSubtitle);
      setSavedHeaderTitle(nextTitle);
      setSavedHeaderSubtitle(nextSubtitle);
      persistHeaderCopyCache(nextTitle, nextSubtitle);
      return true;
    },
    []
  );

  const resetHeaderCopy = useCallback(async () => {
    return saveHeaderCopy(CRM_DEFAULT_HEADER_TITLE, CRM_DEFAULT_HEADER_SUBTITLE);
  }, [saveHeaderCopy]);

  const previewLabelColor = useCallback((key: CrmLabelColorKey, patch: Partial<CrmLabelColorPair>) => {
    setLabelColors((current) => {
      const next = normalizeCrmLabelColors({
        ...current,
        [key]: { ...current[key], ...patch }
      });
      applyCrmLabelColors(next, { persistCache: false });
      return next;
    });
  }, []);

  const saveLabelColors = useCallback(async () => {
    const normalized = normalizeCrmLabelColors(labelColors);
    setSavingLabelColors(true);
    setError(null);
    const result = await updateCrmLabelColors(normalized as unknown as Record<string, unknown>);
    setSavingLabelColors(false);
    if (result.error) {
      setError(result.error);
      return false;
    }

    setLabelColors(normalized);
    setSavedLabelColors(normalized);
    setHasCustomLabelColors(true);
    applyBrandingSnapshot({
      accentColor,
      colorMode,
      controlStyle,
      customBackgroundSrc,
      headerIconSrc,
      labelColors: normalized
    });
    return true;
  }, [accentColor, colorMode, controlStyle, customBackgroundSrc, headerIconSrc, labelColors]);

  const resetLabelColors = useCallback(async () => {
    const defaults = defaultCrmLabelColors(colorMode);
    setSavingLabelColors(true);
    setError(null);
    const result = await updateCrmLabelColors(null);
    setSavingLabelColors(false);
    if (result.error) {
      setError(result.error);
      return false;
    }

    setLabelColors(defaults);
    setSavedLabelColors(null);
    setHasCustomLabelColors(false);
    applyBrandingSnapshot({
      accentColor,
      colorMode,
      controlStyle,
      customBackgroundSrc,
      headerIconSrc,
      labelColors: defaults
    });
    return true;
  }, [accentColor, colorMode, controlStyle, customBackgroundSrc, headerIconSrc]);

  const uploadBrandingAsset = useCallback(
    async (kind: CrmBrandingAssetKind, file: File) => {
      const validationError = validateCrmBrandingPng(file);
      if (validationError) {
        setError(validationError);
        return false;
      }

      setUploadingKind(kind);
      setError(null);
      const result = await uploadCrmBrandingPng(kind, file);
      setUploadingKind(null);
      if (result.error) {
        setError(result.error);
        return false;
      }

      await reload();
      return true;
    },
    [reload]
  );

  const removeBrandingAsset = useCallback(
    async (kind: CrmBrandingAssetKind) => {
      setClearingKind(kind);
      setError(null);
      const result = await restoreCrmBrandingAsset(kind);
      setClearingKind(null);
      if (result.error) {
        setError(result.error);
        return false;
      }

      await reload();
      return true;
    },
    [reload]
  );

  return {
    accentColor,
    savedAccentColor,
    backgroundSrc,
    headerIconSrc,
    hasCustomBackground: Boolean(savedBackgroundPath),
    hasCustomHeaderIcon: Boolean(savedHeaderIconPath),
    previewAccentColor,
    saveAccentColor,
    resetAccentColor,
    uploadBackground: (file: File) => uploadBrandingAsset("background", file),
    uploadHeaderIcon: (file: File) => uploadBrandingAsset("header_icon", file),
    clearBackground: () => removeBrandingAsset("background"),
    clearHeaderIcon: () => removeBrandingAsset("header_icon"),
    colorMode,
    savedColorMode,
    saveColorMode,
    controlStyle,
    savedControlStyle,
    patchControlStyle,
    headerTitle,
    headerSubtitle,
    footerText,
    appVersion,
    savedHeaderTitle,
    savedHeaderSubtitle,
    previewHeaderTitle,
    previewHeaderSubtitle,
    saveHeaderCopy,
    resetHeaderCopy,
    labelColors,
    hasCustomLabelColors,
    previewLabelColor,
    saveLabelColors,
    resetLabelColors,
    loading,
    saving: savingAccent || savingColorMode || savingControlStyle || savingHeaderCopy || savingLabelColors,
    uploadingKind,
    clearingKind,
    error,
    setError,
    reload,
    isDirty: accentColor !== savedAccentColor,
    isLabelColorsDirty: !labelColorsEqual(
      labelColors,
      savedLabelColors ?? defaultCrmLabelColors(colorMode)
    ),
    isHeaderCopyDirty:
      headerTitle.trim() !== savedHeaderTitle || headerSubtitle.trim() !== savedHeaderSubtitle
  };
}
