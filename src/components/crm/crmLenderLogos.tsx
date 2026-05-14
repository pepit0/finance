import { useCallback, useEffect, useMemo, useState } from "react";
import type { CrmLenderSlug } from "../../types/crm";

/** Hostnames used only to resolve favicons (not endorsements). */
const FAVICON_HOST: Record<CrmLenderSlug, string> = {
  national_bank: "nbc.ca",
  desjardins: "desjardins.com",
  td: "td.com",
  santander_prime: "santanderconsumer.ca",
  santander_subprime: "santanderconsumer.ca",
  lendcare: "lendcare.ca",
  prefera: "preferafinance.com"
};

const FALLBACK_TEXT: Record<CrmLenderSlug, string> = {
  national_bank: "NB",
  desjardins: "D",
  td: "TD",
  santander_prime: "S",
  santander_subprime: "S",
  lendcare: "LC",
  prefera: "P"
};

function faviconCandidateUrls(host: string): string[] {
  const q = encodeURIComponent(host);
  return [
    `https://www.google.com/s2/favicons?domain=${q}&sz=64`,
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
    `https://${host}/favicon.ico`
  ];
}

export function CrmLenderLogo({ slug, label }: { slug: CrmLenderSlug; label: string }) {
  const host = FAVICON_HOST[slug];
  const urls = useMemo(() => faviconCandidateUrls(host), [host]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slug]);

  const onImgError = useCallback(() => {
    setIndex((i) => (i + 1 < urls.length ? i + 1 : urls.length));
  }, [urls.length]);

  if (index >= urls.length) {
    return (
      <span className="crmLenderLogoFallback" title={label} aria-hidden>
        {FALLBACK_TEXT[slug]}
      </span>
    );
  }

  return (
    <img
      key={`${slug}-${index}`}
      className="crmLenderLogoImg"
      src={urls[index]}
      alt=""
      width={26}
      height={26}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={onImgError}
    />
  );
}
