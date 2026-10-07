import { useEffect, useState } from "react";

/**
 * Tracks whether the browser tab is currently visible.
 *
 * Returns `true` while the tab is focused/visible and `false` while it is
 * hidden (background tab, minimized window, etc.). Components can use this to
 * pause continuous animations so they stop running in the background and
 * resume cleanly when the user returns.
 */
export function usePageVisibility(): boolean {
  const [visible, setVisible] = useState<boolean>(() =>
    typeof document === "undefined" ? true : !document.hidden
  );

  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    onChange();
    document.addEventListener("visibilitychange", onChange, { passive: true });
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return visible;
}

/**
 * Adds `data-tab-hidden` to the <html> element while the tab is hidden.
 *
 * Combined with the matching rule in `styles/index.css`, this pauses every
 * CSS animation (tickers, gradient shifts, blink cursors, etc.) so nothing
 * keeps advancing while the user is away. The attribute is removed on unmount.
 */
export function usePauseCssAnimationsWhenHidden(): void {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => root.toggleAttribute("data-tab-hidden", document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", sync);
      root.removeAttribute("data-tab-hidden");
    };
  }, []);
}
