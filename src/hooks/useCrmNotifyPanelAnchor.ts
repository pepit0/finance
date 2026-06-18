import { useEffect, type RefObject } from "react";

const MOBILE_PANEL_MQ = "(max-width: 767px)";
const LEFT_SIDEBAR_HEADER_MQ = "(min-width: 1024px)";

function isLeftSidebarHeader(wrap: HTMLElement): boolean {
  return (
    window.matchMedia(LEFT_SIDEBAR_HEADER_MQ).matches && Boolean(wrap.closest(".crmShell.crmShellHeaderLeft"))
  );
}

/** Positions alert/reminder dropdowns and keeps them on-screen (sets CSS vars on the wrap). */
export function useCrmNotifyPanelAnchor(
  open: boolean,
  wrapRef: RefObject<HTMLElement | null>,
  options?: { mobileSheet?: boolean; usePortal?: boolean }
) {
  useEffect(() => {
    if (!open || !wrapRef.current) {
      return;
    }

    const wrap = wrapRef.current;
    const button = wrap.querySelector(".crmNotifyButton");
    if (!(button instanceof HTMLElement)) {
      return;
    }

    const varTarget = options?.usePortal ? document.documentElement : wrap;

    const update = () => {
      const isMobile = window.matchMedia(MOBILE_PANEL_MQ).matches;
      const mobileSheet = options?.mobileSheet ?? isMobile;

      if (mobileSheet) {
        const maxHeight = Math.min(Math.round(window.innerHeight * 0.75), 520);
        varTarget.style.setProperty("--crm-notify-panel-max-height", `${maxHeight}px`);
        varTarget.style.removeProperty("--crm-notify-panel-top");
        varTarget.style.removeProperty("--crm-notify-panel-right");
        varTarget.style.removeProperty("--crm-notify-panel-left");
        wrap.classList.remove("crmNotifyWrapAnchorLeft");
        document.documentElement.classList.remove("crmNotifyPortalAnchorLeft");
        return;
      }

      const rect = button.getBoundingClientRect();
      const top = Math.round(rect.bottom + 6);
      const maxHeight = Math.max(140, Math.round(window.innerHeight - top - 12));
      varTarget.style.setProperty("--crm-notify-panel-top", `${top}px`);
      varTarget.style.setProperty("--crm-notify-panel-max-height", `${maxHeight}px`);

      if (isLeftSidebarHeader(wrap)) {
        const panelWidth = Math.min(352, window.innerWidth - 32);
        const left = Math.max(12, Math.min(Math.round(rect.left), window.innerWidth - panelWidth - 12));
        varTarget.style.setProperty("--crm-notify-panel-left", `${left}px`);
        varTarget.style.removeProperty("--crm-notify-panel-right");
        wrap.classList.add("crmNotifyWrapAnchorLeft");
        if (options?.usePortal) {
          document.documentElement.classList.add("crmNotifyPortalAnchorLeft");
        }
      } else {
        varTarget.style.setProperty("--crm-notify-panel-right", `${Math.round(window.innerWidth - rect.right)}px`);
        varTarget.style.removeProperty("--crm-notify-panel-left");
        wrap.classList.remove("crmNotifyWrapAnchorLeft");
        document.documentElement.classList.remove("crmNotifyPortalAnchorLeft");
      }
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      varTarget.style.removeProperty("--crm-notify-panel-top");
      varTarget.style.removeProperty("--crm-notify-panel-max-height");
      varTarget.style.removeProperty("--crm-notify-panel-right");
      varTarget.style.removeProperty("--crm-notify-panel-left");
      wrap.classList.remove("crmNotifyWrapAnchorLeft");
      document.documentElement.classList.remove("crmNotifyPortalAnchorLeft");
    };
  }, [open, options?.mobileSheet, options?.usePortal, wrapRef]);
}
