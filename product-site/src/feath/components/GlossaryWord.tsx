import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { termGlossary, type GlossaryKey } from "../termGlossary";

type GlossaryWordProps = {
  term: GlossaryKey;
  /** Override visible text (defaults to glossary label) */
  children?: string;
  className?: string;
};

type TooltipPosition = {
  top: number;
  left: number;
  placement: "top" | "bottom";
};

const VIEWPORT_PAD = 12;

export function GlossaryWord({ term, children, className = "" }: GlossaryWordProps) {
  const entry = termGlossary[term];
  const label = children ?? entry.label;
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const anchor = rootRef.current;
    const tip = tipRef.current;
    if (!anchor || !tip) return;

    const anchorRect = anchor.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const tipWidth = tipRect.width || Math.min(288, window.innerWidth - VIEWPORT_PAD * 2);
    const tipHeight = tipRect.height || 120;

    let left = anchorRect.left + anchorRect.width / 2 - tipWidth / 2;
    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - tipWidth - VIEWPORT_PAD));

    let top = anchorRect.top - tipHeight - 8;
    let placement: TooltipPosition["placement"] = "top";
    if (top < VIEWPORT_PAD) {
      top = anchorRect.bottom + 8;
      placement = "bottom";
    }

    setPosition({ top, left, placement });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
  }, [open, label, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      if (tipRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <>
      <span ref={rootRef} className={className}>
        <button
          type="button"
          aria-label={`What is ${entry.label}?`}
          aria-expanded={open}
          className="m-0 inline border-0 bg-transparent p-0 font-[inherit] text-[length:inherit] leading-[inherit] tracking-[inherit] text-primary underline decoration-primary/45 decoration-dotted [text-decoration-skip-ink:none] underline-offset-[0.15em] cursor-help align-baseline transition-[text-decoration-color] hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:rounded-sm"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={() => setOpen((value) => !value)}
        >
          {label}
        </button>
      </span>

      {open &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            style={
              position
                ? { top: position.top, left: position.left }
                : { top: -9999, left: -9999, visibility: "hidden" }
            }
            className="fixed z-[200] w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-popover p-4 text-left shadow-xl shadow-black/20 pointer-events-none"
          >
            {position && (
              <span
                className={`absolute h-2 w-2 rotate-45 border-border bg-popover ${
                  position.placement === "top"
                    ? "left-1/2 top-full -translate-x-1/2 -translate-y-1 border-r border-b"
                    : "left-1/2 bottom-full -translate-x-1/2 translate-y-1 border-l border-t"
                }`}
                aria-hidden="true"
              />
            )}
            <p className="text-sm font-bold text-foreground mb-1.5">{entry.label}</p>
            <p className="text-sm font-normal text-muted-foreground leading-relaxed">{entry.definition}</p>
          </div>,
          document.body
        )}
    </>
  );
}
