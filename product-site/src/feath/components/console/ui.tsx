import { Apple, Bird } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useClock } from "../../hooks/useClock";

/**
 * Console/ops surface palette. The console is intentionally a dark product
 * surface in BOTH site themes (like a terminal embedded in the page), so these
 * are fixed values rather than theme tokens.
 */
export const C = {
  surface: "var(--c-surface)",
  inset: "var(--c-inset)",
  border: "var(--c-border)",
  borderSoft: "var(--c-border-soft)",
  text: "var(--c-text)",
  dim: "var(--c-dim)",
  faint: "var(--c-faint)",
  accent: "var(--c-accent)",
  accentSoft: "var(--c-accent-soft)",
  accentSoft2: "var(--c-accent-soft-2)",
  warn: "var(--c-warn)",
  warnSoft: "var(--c-warn-soft)",
  track: "var(--c-track)",
  shadow: "var(--c-shadow)",
  phoneFrame: "var(--c-phone-frame)",
  phoneScreen: "var(--c-phone-screen)",
  phoneBorder: "var(--c-phone-border)",
  phoneIsland: "var(--c-phone-island)",
  phoneShadow: "var(--c-phone-shadow)",
};

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Animates a number from `start` to `target` the first time its element scrolls into view. */
export function useAnimatedNumber<T extends HTMLElement>(
  target: number,
  { duration = 1100, start = 0, threshold = 0.4 }: { duration?: number; start?: number; threshold?: number } = {}
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const [value, setValue] = useState(start);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let raf = 0;
    let startTs: number | null = null;
    const step = (ts: number) => {
      if (startTs === null) startTs = ts;
      const t = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(start + (target - start) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration, start]);

  return { ref, value };
}

const NUM_RE = /^([^\d]*)(\d[\d,]*\.?\d*)(.*)$/;

/** Counts the numeric part of a display string up from zero, preserving any prefix/suffix. */
export function CountUp({ value, duration = 1100 }: { value: string; duration?: number }) {
  const match = NUM_RE.exec(value);
  const numStr = match?.[2] ?? "";
  const hasNum = numStr.length > 0;
  const target = hasNum ? parseFloat(numStr.replace(/,/g, "")) : 0;
  const decimals = hasNum && numStr.includes(".") ? numStr.split(".")[1].length : 0;
  const grouped = numStr.includes(",");
  const prefix = match?.[1] ?? "";
  const suffix = match?.[3] ?? "";
  const { ref, value: n } = useAnimatedNumber<HTMLSpanElement>(target, { duration, threshold: 0.4 });

  if (!hasNum) return <span>{value}</span>;
  const shown = grouped
    ? n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : n.toFixed(decimals);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}

export function Sparkline({
  data,
  width = 88,
  height = 26,
  color = C.accent,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * (height - 3) - 1.5;
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={`${line} L${width},${height} L0,${height} Z`} style={{ fill: color, opacity: 0.12 }} />
      <path d={line} fill="none" style={{ stroke: color }} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DeltaBadge({ value, good = true }: { value: string; good?: boolean }) {
  const color = good ? C.accent : C.warn;
  return (
    <span className="font-mono text-[11px] whitespace-nowrap" style={{ color }}>
      {good ? "▲" : "▼"} {value}
    </span>
  );
}

export function LiveBadge({ label = "LIVE", timestamp }: { label?: string; timestamp?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: C.accent }}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: C.accent, opacity: 0.6 }} />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: C.accent }} />
      </span>
      {label}
      {timestamp != null && <span className="tabular-nums normal-case tracking-normal" style={{ color: C.faint }}>{timestamp}</span>}
    </span>
  );
}

export function LiveClock() {
  const now = useClock();
  return <>{now.toLocaleTimeString("en-US", { hour12: false })}</>;
}

export function StatCard({
  label,
  value,
  delta,
  deltaGood,
  spark,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaGood?: boolean;
  spark?: number[];
}) {
  return (
    <div className="rounded-xl p-3.5" style={{ background: C.inset, border: `1px solid ${C.borderSoft}` }}>
      <div className="font-mono text-[10px] uppercase tracking-wider mb-2" style={{ color: C.faint }}>{label}</div>
      <div className="flex items-end justify-between gap-2">
        <span className="font-mono text-xl font-semibold" style={{ color: C.text }}><CountUp value={value} /></span>
        {spark && <Sparkline data={spark} width={64} height={22} />}
      </div>
      {delta && <div className="mt-1.5"><DeltaBadge value={delta} good={deltaGood} /></div>}
    </div>
  );
}

export function ScoreRing({ value, label, size = 60 }: { value: number; label: string; size?: number }) {
  const { ref, value: p } = useAnimatedNumber<HTMLDivElement>(value, { duration: 1200, threshold: 0.4 });
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: C.track }} strokeWidth={4} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            style={{ stroke: C.accent }}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - p / 100)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold tabular-nums" style={{ color: C.text }}>
          {Math.round(p)}
        </span>
      </div>
      <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: C.faint }}>{label}</span>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    New: { bg: C.track, fg: C.dim },
    Qualified: { bg: C.accentSoft, fg: C.accent },
    Booked: { bg: C.accentSoft2, fg: C.accent },
  };
  const s = map[status] ?? map.New;
  return (
    <span className="inline-block font-mono text-[10px] px-2 py-0.5 rounded" style={{ background: s.bg, color: s.fg }}>{status}</span>
  );
}

export function SectionHeader({
  index,
  eyebrow,
  title,
  sub,
  center = false,
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center max-w-2xl mx-auto" : "max-w-2xl"}>
      <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">
        {index && <span className="text-muted-foreground/60">({index}) </span>}
        {eyebrow}
      </p>
      <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {title}
      </h2>
      {sub && <p className="text-muted-foreground leading-relaxed">{sub}</p>}
    </div>
  );
}

export function TabStrip({
  tabs,
  active,
  onChange,
  className = "",
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label="Views" className={`flex flex-wrap items-center gap-1 ${className}`}>
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className="font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors"
            style={on ? { background: C.accentSoft, color: C.accent } : { color: C.faint }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function ConsoleWindow({
  title = "feath.console",
  tabs,
  active,
  onTab,
  footer,
  children,
}: {
  title?: string;
  tabs?: { id: string; label: string }[];
  active?: string;
  onTab?: (id: string) => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${C.border}`, background: C.surface, boxShadow: C.shadow }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
          <span className="font-mono text-[11px] truncate" style={{ color: C.faint }}>{title}</span>
        </div>
        <LiveBadge timestamp={<LiveClock />} />
      </div>
      {tabs && active != null && onTab && (
        <div className="px-3 pt-2.5 pb-2" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
          <TabStrip tabs={tabs} active={active} onChange={onTab} />
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
      {footer && (
        <div
          className="px-4 sm:px-6 py-3 font-mono text-[10px] tracking-wide flex flex-wrap gap-x-4 gap-y-1"
          style={{ borderTop: `1px solid ${C.borderSoft}`, color: C.faint }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

export function AppStoreBadge({ label = "Live on the App Store" }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
      style={{ background: C.accentSoft, color: C.accent }}
    >
      <Apple size={11} /> {label}
    </span>
  );
}

export function PhoneMock() {
  const rows = [
    { s: "Northern Cardinal", loc: "Riverside Park", t: "2m" },
    { s: "Blue Jay", loc: "Oak Trail", t: "18m" },
    { s: "Great Blue Heron", loc: "Mill Pond", t: "41m" },
  ];
  return (
    <div className="mx-auto" style={{ width: 184 }}>
      <div className="rounded-[2rem] p-2" style={{ background: C.phoneFrame, border: `1px solid ${C.phoneBorder}`, boxShadow: C.phoneShadow }}>
        <div className="rounded-[1.6rem] overflow-hidden" style={{ background: C.phoneScreen, border: `1px solid ${C.borderSoft}` }}>
          <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5 font-mono text-[9px]" style={{ color: C.faint }}>
            <span>9:41</span>
            <span className="w-9 h-2.5 rounded-full" style={{ background: C.phoneIsland }} />
            <span>5G</span>
          </div>
          <div className="px-3.5 pb-4">
            <div className="font-mono text-[9px] uppercase tracking-wider mb-2" style={{ color: C.faint }}>Recent sightings</div>
            {rows.map((x, i) => (
              <div key={x.s} className="flex items-center gap-2.5 py-2" style={{ borderTop: i ? `1px solid ${C.borderSoft}` : undefined }}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: C.accentSoft }}>
                  <Bird size={13} style={{ color: C.accent }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold truncate" style={{ color: C.text }}>{x.s}</div>
                  <div className="font-mono text-[9px]" style={{ color: C.faint }}>{x.loc}</div>
                </div>
                <span className="font-mono text-[9px] tabular-nums" style={{ color: C.accent }}>{x.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BarFill({ pct }: { pct: number }) {
  const { ref, value } = useAnimatedNumber<HTMLDivElement>(pct, { duration: 1000, threshold: 0.4 });
  return <div ref={ref} className="h-full rounded-full" style={{ width: `${value}%`, background: C.accent }} />;
}

export function SpeedupBars({ rows }: { rows: { label: string; before: string; after: string; pct: number }[] }) {
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="rounded-xl p-3.5" style={{ background: C.inset, border: `1px solid ${C.borderSoft}` }}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-sm font-medium" style={{ color: C.text }}>{r.label}</span>
            <span className="font-mono text-[11px] whitespace-nowrap">
              <span style={{ color: C.faint, textDecoration: "line-through" }}>{r.before}</span>
              <span style={{ color: C.accent }}> → {r.after}</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.track }}>
            <BarFill pct={r.pct} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LeadTable({ rows }: { rows: string[][] }) {
  const heads = ["Name", "Source", "Intent", "Status"];
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.borderSoft}` }}>
      <table className="w-full font-mono text-[11px]">
        <thead>
          <tr style={{ background: C.inset }}>
            {heads.map((h) => (
              <th key={h} className="text-left px-3 py-2 text-[9px] uppercase tracking-wider font-medium" style={{ color: C.faint }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
              <td className="px-3 py-2 whitespace-nowrap" style={{ color: C.text }}>{r[0]}</td>
              <td className="px-3 py-2 whitespace-nowrap" style={{ color: C.dim }}>{r[1]}</td>
              <td className="px-3 py-2 whitespace-nowrap" style={{ color: C.dim }}>{r[2]}</td>
              <td className="px-3 py-2"><StatusPill status={r[3]} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
