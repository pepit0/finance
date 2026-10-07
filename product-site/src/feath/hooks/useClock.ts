import { useEffect, useState } from "react";
import { usePageVisibility } from "./usePageVisibility";

/**
 * A ticking clock that updates on an interval, but only while the tab is
 * visible. Returns the current Date so consumers can format it. The interval
 * is torn down when the tab is hidden and restarted when it returns, so it
 * never runs (throttled) in the background.
 */
export function useClock(intervalMs = 1000): Date {
  const visible = usePageVisibility();
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!visible) return;
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [visible, intervalMs]);

  return now;
}
