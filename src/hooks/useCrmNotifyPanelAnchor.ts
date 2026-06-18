import { useEffect, type RefObject } from "react";

const MOBILE_PANEL_MQ = "(max-width: 767px)";
const LEFT_SIDEBAR_HEADER_MQ = "(min-width: 1024px)";

function isLeftSidebarHeader(wrap: HTMLElement): boolean {
  return (
    window.matchMedia(LEFT_SIDEBAR_HEADER_MQ).matches && Boolean(wrap.closest(".crmShell.crmShellHeaderLeft"))
  );
}

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

      const isMobile = window.matchMedia(MOBILE_PANEL_MQ).matches;
      if (isMobile) {
        wrap.style.removeProperty("--crm-notify-panel-right");
        wrap.style.removeProperty("--crm-notify-panel-left");
        wrap.classList.remove("crmNotifyWrapAnchorLeft");
      } else if (isLeftSidebarHeader(wrap)) {
        const panelWidth = Math.min(352, window.innerWidth - 32);
        const left = Math.max(12, Math.min(Math.round(rect.left), window.innerWidth - panelWidth - 12));
        wrap.style.setProperty("--crm-notify-panel-left", `${left}px`);
        wrap.style.removeProperty("--crm-notify-panel-right");
        wrap.classList.add("crmNotifyWrapAnchorLeft");
      } else {
        wrap.style.setProperty("--crm-notify-panel-right", `${Math.round(window.innerWidth - rect.right)}px`);
        wrap.style.removeProperty("--crm-notify-panel-left");
        wrap.classList.remove("crmNotifyWrapAnchorLeft");
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
      wrap.style.removeProperty("--crm-notify-panel-left");
      wrap.classList.remove("crmNotifyWrapAnchorLeft");
    };
  }, [open, wrapRef]);
}
