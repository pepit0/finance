import { useEffect, useState } from "react";

const MOBILE_SHEET_MQ = "(max-width: 767px)";

export function useCrmNotifyPortalMode() {
  const [mobileSheet, setMobileSheet] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_SHEET_MQ).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_SHEET_MQ);
    const sync = () => setMobileSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return { usePortal: true, mobileSheet };
}
