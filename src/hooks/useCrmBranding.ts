import { useCallback, useEffect, useState } from "react";
import {
  clearCrmBrandingAsset,
  fetchCrmOrgBranding,
  updateCrmColorMode,
  updateCrmControlStyle,
  updateCrmHeaderCopy,
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

function persistHeaderCopyCache(headerTitle: string, headerSubtitle: string) {
  const existing = readCachedCrmBranding();
  writeCachedCrmBranding({
    backgroundSrc: existing?.backgroundSrc,
    headerIconSrc: existing?.headerIconSrc,
    headerTitle,
    headerSubtitle
  });
}

function applyBrandingSnapshot(input: {
  accentColor: string;
  colorMode: CrmColorMode;
  controlStyle: CrmControlStyleConfig;
  customBackgroundSrc: string | null;
  headerIconSrc: string;
  persistCache?: boolean;
}) {
  applyCrmColorMode(input.colorMode, { persistCache: input.persistCache });
  applyCrmAccentTheme(input.accentColor, { persistCache: input.persistCache });
  applyCrmControlStyle(input.controlStyle, { persistCache: input.persistCache });
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
  const [controlStyle, setControlStyle] = useState<CrmControlStyleConfig>(
    () => readCachedCrmControlStyle() ?? DEFAULT_CRM_CONTROL_STYLE
  );
  const [savedControlStyle, setSavedControlStyle] = useState<CrmControlStyleConfig>(DEFAULT_CRM_CONTROL_STYLE);
  const [loading, setLoading] = useState(true);
  const [savingAccent, setSavingAccent] = useState(false);
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
    applyBrandingSnapshot({
      accentColor: accent,
      colorMode: mode,
      controlStyle: style,
      customBackgroundSrc: cached?.backgroundSrc ?? null,
      headerIconSrc: cached?.headerIconSrc ?? CRM_DEFAULT_HEADER_ICON_SRC,
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
    setHeaderTitle(nextHeaderTitle);
    setHeaderSubtitle(nextHeaderSubtitle);
    setSavedHeaderTitle(nextHeaderTitle);
    setSavedHeaderSubtitle(nextHeaderSubtitle);
    persistHeaderCopyCache(nextHeaderTitle, nextHeaderSubtitle);
    const nextControlStyle = normalizeCrmControlStyle({
      buttonShape: result.buttonShape,
      tabShape: result.tabShape,
      tabIdleStyle: result.tabIdleStyle,
      tabActiveStyle: result.tabActiveStyle,
      buttonPrimaryStyle: result.buttonPrimaryStyle,
      pageOutlineShape: result.pageOutlineShape
    });
    setControlStyle(nextControlStyle);
    setSavedControlStyle(nextControlStyle);
    applyBrandingSnapshot({
      accentColor: accent,
      colorMode: nextColorMode,
      controlStyle: nextControlStyle,
      customBackgroundSrc: nextCustomBackgroundSrc,
      headerIconSrc: nextHeaderIconSrc
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
      headerIconSrc
    });
    return true;
  }, [colorMode, controlStyle, customBackgroundSrc, headerIconSrc]);

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
      applyBrandingSnapshot({
        accentColor,
        colorMode: normalized,
        controlStyle,
        customBackgroundSrc,
        headerIconSrc,
        persistCache: false
      });

      const result = await updateCrmColorMode(normalized);
      setSavingColorMode(false);
      if (result.error) {
        setError(result.error);
        setColorMode(savedColorMode);
        applyBrandingSnapshot({
          accentColor,
          colorMode: savedColorMode,
          controlStyle,
          customBackgroundSrc,
          headerIconSrc,
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
        headerIconSrc
      });
      return true;
    },
    [accentColor, controlStyle, customBackgroundSrc, headerIconSrc, savedColorMode]
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
        headerIconSrc
      });
      return true;
    },
    [accentColor, colorMode, controlStyle, customBackgroundSrc, headerIconSrc, savedControlStyle]
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
      const result = await clearCrmBrandingAsset(kind);
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
    savedHeaderTitle,
    savedHeaderSubtitle,
    previewHeaderTitle,
    previewHeaderSubtitle,
    saveHeaderCopy,
    resetHeaderCopy,
    loading,
    saving: savingAccent || savingColorMode || savingControlStyle || savingHeaderCopy,
    uploadingKind,
    clearingKind,
    error,
    setError,
    reload,
    isDirty: accentColor !== savedAccentColor,
    isHeaderCopyDirty:
      headerTitle.trim() !== savedHeaderTitle || headerSubtitle.trim() !== savedHeaderSubtitle
  };
}
