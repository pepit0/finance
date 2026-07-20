import { useEffect, useState } from "react";

const HEADLINES = ["never miss a lead.", "close deals faster.", "automate everything.", "grow without chaos."];

// These overflow on mobile — let them wrap; keep the rest on one line.
const WRAP_HEADLINES = new Set(["automate everything.", "grow without chaos."]);

function wrapClass(headline: string) {
  return WRAP_HEADLINES.has(headline) ? "" : "whitespace-nowrap";
}

export function TypewriterHeadline() {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "erasing">("typing");
  const currentHeadline = HEADLINES[idx];

  useEffect(() => {
    const target = HEADLINES[idx];
    let t: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (displayed.length < target.length) {
        t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 52);
      } else {
        t = setTimeout(() => setPhase("pausing"), 1900);
      }
    } else if (phase === "pausing") {
      t = setTimeout(() => setPhase("erasing"), 300);
    } else if (displayed.length > 0) {
      t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 26);
    } else {
      setIdx((i) => (i + 1) % HEADLINES.length);
      setPhase("typing");
    }
    return () => clearTimeout(t);
  }, [displayed, phase, idx]);

  return (
    <span className="inline-grid max-w-full align-top overflow-visible leading-[1.15]">
      {HEADLINES.map((headline) => (
        <span
          key={headline}
          className={`invisible col-start-1 row-start-1 pb-[0.12em] ${wrapClass(headline)}`}
          aria-hidden="true"
        >
          {headline}
          <span className="inline-block w-[3px] h-[0.8em] ml-0.5" />
        </span>
      ))}
      <span
        className={`col-start-1 row-start-1 bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent pb-[0.12em] ${wrapClass(currentHeadline)}`}
        style={{ backgroundSize: "200% auto", animation: "gradientShift 4s linear infinite" }}
      >
        {displayed}
        <span
          className="inline-block w-[3px] h-[0.8em] bg-primary ml-0.5 align-middle rounded-sm"
          style={{ animation: "blink 1s step-end infinite" }}
        />
      </span>
    </span>
  );
}
