import { useEffect } from "react";
import { readCachedCrmBranding } from "../utils/crmBrandingAssets";
import { CRM_DEFAULT_HEADER_TITLE } from "../utils/crmHeaderCopy";
import { isCrmRoute } from "../utils/productMode";

export function useCrmDocumentTitle(pathname: string) {
  useEffect(() => {
    if (!isCrmRoute(pathname)) {
      return;
    }
    const cached = readCachedCrmBranding();
    const title = cached?.headerTitle?.trim() || CRM_DEFAULT_HEADER_TITLE;
    document.title = title;
  }, [pathname]);
}
