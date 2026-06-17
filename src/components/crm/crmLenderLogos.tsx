import { useCallback, useEffect, useMemo, useState } from "react";
import type { CrmLenderConfig } from "../types/crm";
import { lenderFallbackInitials, lenderLogoCandidateUrls } from "../../utils/crmLenderIcon";

type CrmLenderLogoProps = {
  lender: Pick<CrmLenderConfig, "slug" | "label" | "icon_domain" | "custom_icon_path"> & {
    updated_at?: string | null;
  };
};

export function CrmLenderLogo({ lender }: CrmLenderLogoProps) {
  const urls = useMemo(() => lenderLogoCandidateUrls(lender), [lender]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [lender.slug, lender.label, lender.icon_domain, lender.custom_icon_path, lender.updated_at]);

  const onImgError = useCallback(() => {
    setIndex((current) => (current + 1 < urls.length ? current + 1 : urls.length));
  }, [urls.length]);

  if (index >= urls.length || urls.length === 0) {
    return (
      <span className="crmLenderLogoSlot" aria-hidden>
        <span className="crmLenderLogoFallback" title={lender.label}>
          {lenderFallbackInitials(lender.slug, lender.label)}
        </span>
      </span>
    );
  }

  return (
    <span className="crmLenderLogoSlot" aria-hidden>
      <img
        key={`${lender.slug}-${index}-${urls[index]}`}
        className="crmLenderLogoImg"
        src={urls[index]}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={onImgError}
      />
    </span>
  );
}
