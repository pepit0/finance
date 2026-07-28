import { useEffect, useState } from "react";
import { fetchCrmPublicLoginBranding } from "../lib/crmApi";
import {
  applyCachedCrmLoginTheme,
  applyCrmLoginTheme,
  persistCrmLoginBrandingCopy,
  readCachedCrmLoginBrandingCopy,
  type CrmLoginBrandingCopy
} from "../utils/crmLoginTheme";
import { loginSubtitle, loginTitle } from "../utils/productMode";

export function useCrmLoginTheme(enabled: boolean, options?: { fetchRemote?: boolean }): CrmLoginBrandingCopy {
  const fetchRemote = options?.fetchRemote ?? true;
  const [copy, setCopy] = useState<CrmLoginBrandingCopy>(() =>
    enabled
      ? readCachedCrmLoginBrandingCopy()
      : { headerTitle: loginTitle(), headerSubtitle: loginSubtitle() }
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    applyCachedCrmLoginTheme();
    setCopy(readCachedCrmLoginBrandingCopy());

    if (!fetchRemote) {
      return;
    }

    let cancelled = false;
    void fetchCrmPublicLoginBranding().then((result) => {
      if (cancelled || result.error) {
        return;
      }

      applyCrmLoginTheme({
        accentColor: result.accentColor,
        colorMode: result.colorMode,
        persistCache: true
      });

      const nextCopy = {
        headerTitle: result.headerTitle,
        headerSubtitle: result.headerSubtitle
      };
      persistCrmLoginBrandingCopy(nextCopy);
      setCopy(nextCopy);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, fetchRemote]);

  return copy;
}
