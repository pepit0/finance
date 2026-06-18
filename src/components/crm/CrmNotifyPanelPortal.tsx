import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type CrmNotifyPanelPortalProps = {
  open: boolean;
  mobileSheet: boolean;
  onBackdropClick?: () => void;
  children: ReactNode;
};

export function CrmNotifyPanelPortal({
  open,
  mobileSheet,
  onBackdropClick,
  children
}: CrmNotifyPanelPortalProps) {
  useEffect(() => {
    if (!open || !mobileSheet) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, mobileSheet]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className={`crmNotifyPortalRoot${mobileSheet ? " crmNotifyPortalRootSheet" : ""}`}>
      {mobileSheet ? (
        <button
          type="button"
          className="crmNotifyPanelBackdrop"
          aria-label="Close panel"
          onClick={onBackdropClick}
        />
      ) : null}
      {children}
    </div>,
    document.body
  );
}
