import { useEffect, type RefObject } from "react";

const MOBILE_PANEL_MQ = "(max-width: 767px)";

/** Positions alert/reminder dropdowns and keeps them on-screen (sets CSS vars on the wrap). */
export function useCrmNotifyPanelAnchor(open: boolean, wrapRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open || !wrapRef.current) {
      return;
    }

    const wrap = wrapRef.current;
    const button = wrap.querySelector(".crmNotifyButton");
    if (!(button instanceof HTMLElement)) {
      return;
    }

    const update = () => {
      const rect = button.getBoundingClientRect();
      const top = Math.round(rect.bottom + 6);
      const maxHeight = Math.max(140, Math.round(window.innerHeight - top - 12));
      wrap.style.setProperty("--crm-notify-panel-top", `${top}px`);
      wrap.style.setProperty("--crm-notify-panel-max-height", `${maxHeight}px`);

      if (!window.matchMedia(MOBILE_PANEL_MQ).matches) {
        wrap.style.setProperty("--crm-notify-panel-right", `${Math.round(window.innerWidth - rect.right)}px`);
      } else {
        wrap.style.removeProperty("--crm-notify-panel-right");
      }
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      wrap.style.removeProperty("--crm-notify-panel-top");
      wrap.style.removeProperty("--crm-notify-panel-max-height");
      wrap.style.removeProperty("--crm-notify-panel-right");
    };
  }, [open, wrapRef]);
}
