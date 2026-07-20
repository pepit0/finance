import { ArrowRight } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { GlowButton } from "../components/GlowButton";
import { Reveal } from "../Reveal";
import { useTheme } from "../ThemeContext";

const BASE_PKGS = [
  { id: "static" as const, label: "Static Website", tag: "STATIC", sub: "Multi-page site, fast & clean", monthly: 79, setup: 999 },
  { id: "inventory" as const, label: "Inventory Site", tag: "INVENT", sub: "Product catalog + live search", monthly: 149, setup: 1999 },
  { id: "leadcapture" as const, label: "Lead Capture", tag: "LEADS", sub: "Forms, chat & smart follow-up", monthly: 119, setup: 1499 },
];
type BaseId = "static" | "inventory" | "leadcapture";

const ADDON_LIST = [
  { id: "crm" as const, label: "CRM", full: "CRM Integration", sub: "Pipeline + contact management", monthly: 149, requires: null as null | string },
  { id: "calltext" as const, label: "Call & Text", full: "Call & Text", sub: "Built-in voice & SMS", monthly: 59, requires: "crm" as null | string },
  { id: "ai" as const, label: "AI", full: "AI Automation", sub: "Lead scoring & auto follow-up", monthly: 199, requires: null as null | string },
  { id: "analytics" as const, label: "Analytics", full: "Analytics", sub: "Conversion funnels & traffic data", monthly: 49, requires: null as null | string },
];
type AddonId = "crm" | "calltext" | "ai" | "analytics";

function pathD(pts: { x: number; y: number }[]) {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

function pathLen(pts: { x: number; y: number }[]) {
  let t = 0;
  for (let i = 1; i < pts.length; i++) t += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return t;
}

function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(`(max-width: ${bp - 1}px)`).matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [bp]);
  return mobile;
}

type Pt = { x: number; y: number };
type ModSpec = {
  id: AddonId;
  conn: Pt[];
  nodes: { x: number; y: number; r: number }[];
  links: [number, number][];
  label: string;
  subLabel: string;
  lx: number;
  ly: number;
  tipX: number;
  tipY: number;
  tipW: number;
  tipH: number;
  dotDur: number;
};

type HudLayout = {
  w: number;
  h: number;
  hub: Pt;
  core: Pt[];
  ringOuter: number;
  ringInner: number;
  mods: ModSpec[];
};

const DESKTOP_LAYOUT: HudLayout = {
  w: 900,
  h: 560,
  hub: { x: 450, y: 280 },
  core: [
    { x: 450, y: 205 },
    { x: 525, y: 280 },
    { x: 450, y: 355 },
    { x: 375, y: 280 },
  ],
  ringOuter: 148,
  ringInner: 104,
  mods: [
    {
      id: "crm",
      conn: [
        { x: 450, y: 205 },
        { x: 450, y: 128 },
        { x: 630, y: 128 },
      ],
      nodes: [
        { x: 630, y: 128, r: 10 },
        { x: 705, y: 104, r: 6 },
        { x: 705, y: 152, r: 6 },
      ],
      links: [
        [0, 1],
        [0, 2],
        [1, 2],
      ],
      label: "CRM",
      subLabel: "PIPELINE",
      lx: 667,
      ly: 82,
      tipX: 624,
      tipY: 162,
      tipW: 122,
      tipH: 52,
      dotDur: 2.0,
    },
    {
      id: "calltext",
      conn: [
        { x: 705, y: 128 },
        { x: 820, y: 128 },
        { x: 820, y: 220 },
      ],
      nodes: [
        { x: 820, y: 220, r: 9 },
        { x: 862, y: 202, r: 5 },
        { x: 862, y: 238, r: 5 },
      ],
      links: [
        [0, 1],
        [0, 2],
        [1, 2],
      ],
      label: "CALL+TXT",
      subLabel: "VOICE/SMS",
      lx: 841,
      ly: 260,
      tipX: 714,
      tipY: 242,
      tipW: 122,
      tipH: 52,
      dotDur: 1.6,
    },
    {
      id: "ai",
      conn: [
        { x: 525, y: 280 },
        { x: 660, y: 280 },
        { x: 660, y: 398 },
        { x: 725, y: 398 },
      ],
      nodes: [
        { x: 725, y: 398, r: 10 },
        { x: 800, y: 376, r: 6 },
        { x: 800, y: 420, r: 6 },
      ],
      links: [
        [0, 1],
        [0, 2],
        [1, 2],
      ],
      label: "AI AUTO",
      subLabel: "AUTOMATION",
      lx: 762,
      ly: 444,
      tipX: 594,
      tipY: 420,
      tipW: 122,
      tipH: 52,
      dotDur: 2.4,
    },
    {
      id: "analytics",
      conn: [
        { x: 375, y: 280 },
        { x: 242, y: 280 },
        { x: 242, y: 160 },
        { x: 178, y: 160 },
      ],
      nodes: [
        { x: 178, y: 160, r: 10 },
        { x: 110, y: 138, r: 6 },
        { x: 110, y: 182, r: 6 },
      ],
      links: [
        [0, 1],
        [0, 2],
        [1, 2],
      ],
      label: "ANALYTICS",
      subLabel: "INSIGHTS",
      lx: 144,
      ly: 116,
      tipX: 188,
      tipY: 196,
      tipW: 122,
      tipH: 52,
      dotDur: 2.2,
    },
  ],
};

/** Portrait layout — compact height so it shares the phone viewport with controls */
const MOBILE_LAYOUT: HudLayout = {
  w: 390,
  h: 560,
  hub: { x: 195, y: 105 },
  core: [
    { x: 195, y: 60 },
    { x: 240, y: 105 },
    { x: 195, y: 150 },
    { x: 150, y: 105 },
  ],
  ringOuter: 78,
  ringInner: 54,
  mods: [
    {
      id: "crm",
      conn: [
        { x: 240, y: 105 },
        { x: 305, y: 105 },
        { x: 305, y: 195 },
      ],
      nodes: [
        { x: 305, y: 195, r: 10 },
        { x: 338, y: 180, r: 5 },
        { x: 338, y: 210, r: 5 },
      ],
      links: [
        [0, 1],
        [0, 2],
        [1, 2],
      ],
      label: "CRM",
      subLabel: "PIPELINE",
      lx: 321,
      ly: 238,
      tipX: 175,
      tipY: 210,
      tipW: 120,
      tipH: 48,
      dotDur: 2.0,
    },
    {
      id: "calltext",
      conn: [
        { x: 305, y: 195 },
        { x: 305, y: 280 },
        { x: 305, y: 330 },
      ],
      nodes: [
        { x: 305, y: 330, r: 9 },
        { x: 335, y: 316, r: 5 },
        { x: 335, y: 344, r: 5 },
      ],
      links: [
        [0, 1],
        [0, 2],
        [1, 2],
      ],
      label: "CALL+TXT",
      subLabel: "VOICE/SMS",
      lx: 320,
      ly: 372,
      tipX: 145,
      tipY: 330,
      tipW: 120,
      tipH: 48,
      dotDur: 1.6,
    },
    {
      id: "ai",
      conn: [
        { x: 195, y: 150 },
        { x: 195, y: 280 },
        { x: 195, y: 420 },
        { x: 240, y: 455 },
      ],
      nodes: [
        { x: 240, y: 455, r: 10 },
        { x: 272, y: 440, r: 5 },
        { x: 272, y: 470, r: 5 },
      ],
      links: [
        [0, 1],
        [0, 2],
        [1, 2],
      ],
      label: "AI AUTO",
      subLabel: "AUTOMATION",
      lx: 256,
      ly: 500,
      tipX: 70,
      tipY: 420,
      tipW: 120,
      tipH: 48,
      dotDur: 2.4,
    },
    {
      id: "analytics",
      conn: [
        { x: 150, y: 105 },
        { x: 70, y: 105 },
        { x: 70, y: 250 },
        { x: 70, y: 310 },
      ],
      nodes: [
        { x: 70, y: 310, r: 10 },
        { x: 42, y: 295, r: 5 },
        { x: 42, y: 325, r: 5 },
      ],
      links: [
        [0, 1],
        [0, 2],
        [1, 2],
      ],
      label: "ANALYTICS",
      subLabel: "INSIGHTS",
      lx: 70,
      ly: 352,
      tipX: 95,
      tipY: 320,
      tipW: 120,
      tipH: 48,
      dotDur: 2.2,
    },
  ],
};

function PricingHUD({
  base,
  addons,
  dark,
  toggleAddon,
}: {
  base: BaseId;
  addons: Set<AddonId>;
  dark: boolean;
  toggleAddon: (id: AddonId) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const mobile = useIsMobile();
  const layout = mobile ? MOBILE_LAYOUT : DESKTOP_LAYOUT;
  const { w, h, hub: HUB, core: CORE_VERTS, ringOuter, ringInner } = layout;
  const pc = dark ? "61,184,112" : "30,124,74";
  const bg = dark ? "15,26,13" : "242,245,240";
  const baseTag = BASE_PKGS.find((b) => b.id === base)!.tag;
  const labelSize = mobile ? 11 : 10;
  const subSize = mobile ? 8 : 7;
  const hubPulse = mobile ? 28 : 36;
  const hubOuter = mobile ? 28 : 36;
  const hubMid = mobile ? 22 : 28;
  const hubInner = mobile ? 15 : 19;

  const mods = layout.mods.map((m) => ({ ...m, active: addons.has(m.id) }));

  const tr = (delay = 0, dur = 0.8) =>
    `stroke-dashoffset ${dur}s cubic-bezier(.22,.68,0,1.2) ${delay}ms, opacity 0.4s ease ${delay}ms`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={mobile ? "100%" : undefined}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={`block ${mobile ? "max-h-full" : ""}`}
    >
      <defs>
        <filter id="ph-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ph-glow-lg" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="ph-radial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`rgba(${pc},0.18)`} />
          <stop offset="100%" stopColor={`rgba(${pc},0)`} />
        </radialGradient>
        <linearGradient id="ph-scan" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={`rgba(${pc},0)`} />
          <stop offset="40%" stopColor={`rgba(${pc},0.04)`} />
          <stop offset="60%" stopColor={`rgba(${pc},0.04)`} />
          <stop offset="100%" stopColor={`rgba(${pc},0)`} />
        </linearGradient>
        <clipPath id="ph-clip">
          <rect x="0" y="0" width={w} height={h} />
        </clipPath>
      </defs>

      {Array.from({ length: mobile ? 14 : 10 }, (_, row) =>
        Array.from({ length: mobile ? 8 : 18 }, (_, col) => (
          <circle
            key={`g${row}-${col}`}
            cx={col * (mobile ? 52 : 52) + 8}
            cy={row * (mobile ? 52 : 56) + 12}
            r={1}
            fill={`rgba(${pc},0.05)`}
          />
        )),
      )}

      {[
        `M 36,14 L 14,14 L 14,36`,
        `M ${w - 36},14 L ${w - 14},14 L ${w - 14},36`,
        `M 36,${h - 14} L 14,${h - 14} L 14,${h - 36}`,
        `M ${w - 36},${h - 14} L ${w - 14},${h - 14} L ${w - 14},${h - 36}`,
      ].map((d, i) => (
        <path key={i} d={d} fill="none" stroke={`rgba(${pc},0.25)`} strokeWidth={1.5} />
      ))}

      <circle cx={HUB.x} cy={HUB.y} r={mobile ? 130 : 220} fill="url(#ph-radial)" />

      <g clipPath="url(#ph-clip)">
        <rect x={0} width={w} height={mobile ? 90 : 120} fill="url(#ph-scan)">
          <animate attributeName="y" values={`${-90};${h + 40};${-90}`} dur="12s" repeatCount="indefinite" calcMode="linear" />
        </rect>
      </g>

      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${HUB.x} ${HUB.y}`}
          to={`360 ${HUB.x} ${HUB.y}`}
          dur="36s"
          repeatCount="indefinite"
        />
        <circle cx={HUB.x} cy={HUB.y} r={ringOuter} fill="none" stroke={`rgba(${pc},0.07)`} strokeWidth={1} strokeDasharray="14 10" />
      </g>
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${HUB.x} ${HUB.y}`}
          to={`-360 ${HUB.x} ${HUB.y}`}
          dur="22s"
          repeatCount="indefinite"
        />
        <circle cx={HUB.x} cy={HUB.y} r={ringInner} fill="none" stroke={`rgba(${pc},0.06)`} strokeWidth={1} strokeDasharray="6 14" />
      </g>

      {CORE_VERTS.map((v, i) => (
        <line
          key={i}
          x1={HUB.x}
          y1={HUB.y}
          x2={v.x}
          y2={v.y}
          stroke={`rgba(${pc},0.35)`}
          strokeWidth={1.5}
          filter="url(#ph-glow)"
        />
      ))}
      {CORE_VERTS.map((v, i) => {
        const nv = CORE_VERTS[(i + 1) % 4];
        return (
          <line
            key={`r${i}`}
            x1={v.x}
            y1={v.y}
            x2={nv.x}
            y2={nv.y}
            stroke={`rgba(${pc},0.22)`}
            strokeWidth={1}
            filter="url(#ph-glow)"
          />
        );
      })}

      {mods.map((m) => {
        const isH = hovered === m.id;
        const len = pathLen(m.conn);
        const addonId = m.id;
        const trackOpacity = isH && !m.active ? 0.22 : 0.05;

        return (
          <g key={m.id}>
            <path
              d={pathD(m.conn)}
              fill="none"
              stroke={`rgba(${pc},${trackOpacity})`}
              strokeWidth={1.5}
              style={{ transition: "stroke 0.3s" }}
            />

            <path
              d={pathD(m.conn)}
              fill="none"
              filter="url(#ph-glow)"
              style={
                {
                  stroke: `rgba(${pc},${isH ? 1 : 0.7})`,
                  strokeWidth: isH ? 2.2 : 1.8,
                  strokeDasharray: len,
                  strokeDashoffset: m.active ? 0 : len,
                  opacity: m.active ? 1 : 0,
                  transition: tr() + `, stroke 0.2s, stroke-width 0.2s`,
                } as CSSProperties
              }
            />

            {m.active && (
              <circle r={isH ? 4 : 3.2} fill={`rgba(${pc},1)`} filter="url(#ph-glow)">
                <animateMotion dur={`${m.dotDur}s`} repeatCount="indefinite" path={pathD(m.conn)} />
              </circle>
            )}

            {m.links.map(([a, b], li) => {
              const na = m.nodes[a];
              const nb = m.nodes[b];
              const ll = Math.hypot(nb.x - na.x, nb.y - na.y);
              return (
                <line
                  key={li}
                  x1={na.x}
                  y1={na.y}
                  x2={nb.x}
                  y2={nb.y}
                  filter="url(#ph-glow)"
                  style={
                    {
                      stroke: `rgba(${pc},0.5)`,
                      strokeWidth: 1,
                      strokeDasharray: ll,
                      strokeDashoffset: m.active ? 0 : ll,
                      opacity: m.active ? 1 : 0,
                      transition: tr(260 + li * 70, 0.5),
                    } as CSSProperties
                  }
                />
              );
            })}

            {m.nodes.map((nd, ni) => (
              <g key={ni} transform={`translate(${nd.x} ${nd.y})`}>
                <g
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    transform: `scale(${m.active ? (isH && ni === 0 ? 1.15 : 1) : 0.05})`,
                    opacity: m.active ? 1 : 0,
                    transition: `transform 0.6s cubic-bezier(.34,1.56,.64,1) ${ni * 70}ms, opacity 0.4s ease ${ni * 50}ms`,
                  }}
                >
                  <circle cx={0} cy={0} r={nd.r + 8} fill={`rgba(${pc},0.04)`} stroke={`rgba(${pc},0.12)`} strokeWidth={1} />
                  <circle
                    cx={0}
                    cy={0}
                    r={nd.r}
                    fill={`rgba(${pc},${isH ? 0.28 : 0.2})`}
                    stroke={`rgba(${pc},${isH ? 0.9 : 0.65})`}
                    strokeWidth={1.8}
                    filter="url(#ph-glow)"
                  />
                  <circle cx={0} cy={0} r={nd.r - 5} fill={`rgba(${pc},0.3)`} />
                  {ni === 0 && (
                    <circle cx={0} cy={0} r={nd.r} fill="none" stroke={`rgba(${pc},${isH ? 0.8 : 0.5})`} strokeWidth={1.5}>
                      <animate attributeName="r" values={`${nd.r};${nd.r + 14};${nd.r}`} dur={isH ? "1.8s" : "3s"} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur={isH ? "1.8s" : "3s"} repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              </g>
            ))}

            <text
              x={m.lx}
              y={m.ly}
              textAnchor="middle"
              fontFamily="'Plus Jakarta Sans',sans-serif"
              fontSize={labelSize}
              fontWeight="800"
              letterSpacing="1.5"
              fill={`rgba(${pc},${isH ? 1 : 0.95})`}
              filter="url(#ph-glow)"
              style={{ opacity: m.active ? 1 : 0, transition: "opacity 0.4s ease 0.4s" }}
            >
              {m.label}
            </text>
            <text
              x={m.lx}
              y={m.ly + (mobile ? 14 : 13)}
              textAnchor="middle"
              fontFamily="'JetBrains Mono',monospace"
              fontSize={subSize}
              letterSpacing="1"
              fill={`rgba(${pc},0.6)`}
              style={{ opacity: m.active ? 1 : 0, transition: "opacity 0.4s ease 0.5s" }}
            >
              {m.subLabel}
            </text>

            <g
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(m.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => toggleAddon(addonId)}
            >
              <path d={pathD(m.conn)} fill="none" stroke="transparent" strokeWidth={mobile ? 36 : 28} />
              <circle cx={m.nodes[0].x} cy={m.nodes[0].y} r={m.nodes[0].r + (mobile ? 24 : 18)} fill="transparent" />
            </g>

            {isH && (
              <g style={{ animation: "fadeUp 0.18s ease forwards", pointerEvents: "none" }}>
                <rect
                  x={m.tipX}
                  y={m.tipY}
                  width={m.tipW}
                  height={m.tipH}
                  rx={5}
                  fill={`rgba(${bg},0.94)`}
                  stroke={`rgba(${pc},0.45)`}
                  strokeWidth={1}
                />
                <text
                  x={m.tipX + m.tipW / 2}
                  y={m.tipY + 16}
                  textAnchor="middle"
                  fontFamily="'Plus Jakarta Sans',sans-serif"
                  fontSize={mobile ? 10 : 9}
                  fontWeight="800"
                  letterSpacing="0.5"
                  fill={`rgba(${pc},1)`}
                >
                  {ADDON_LIST.find((a) => a.id === m.id)?.full ?? m.label}
                </text>
                <text
                  x={m.tipX + m.tipW / 2}
                  y={m.tipY + 30}
                  textAnchor="middle"
                  fontFamily="'JetBrains Mono',monospace"
                  fontSize={mobile ? 9 : 8}
                  fill={`rgba(${pc},0.75)`}
                >
                  +${ADDON_LIST.find((a) => a.id === m.id)?.monthly}/mo
                </text>
                <text
                  x={m.tipX + m.tipW / 2}
                  y={m.tipY + 44}
                  textAnchor="middle"
                  fontFamily="'JetBrains Mono',monospace"
                  fontSize={mobile ? 8 : 7.5}
                  fill={`rgba(${pc},${m.active ? 0.55 : 0.45})`}
                >
                  {m.active ? (mobile ? "TAP TO REMOVE" : "ACTIVE. CLICK TO REMOVE") : mobile ? "TAP TO ADD" : "CLICK TO ADD"}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {CORE_VERTS.map((v, i) => (
        <g key={`cv${i}`}>
          <circle cx={v.x} cy={v.y} r={mobile ? 14 : 16} fill={`rgba(${pc},0.06)`} stroke={`rgba(${pc},0.18)`} strokeWidth={1} />
          <circle
            cx={v.x}
            cy={v.y}
            r={mobile ? 7 : 8}
            fill={`rgba(${pc},0.22)`}
            stroke={`rgba(${pc},0.55)`}
            strokeWidth={1.5}
            filter="url(#ph-glow)"
          />
          <circle cx={v.x} cy={v.y} r={3} fill={`rgba(${pc},0.7)`} />
        </g>
      ))}

      <circle cx={HUB.x} cy={HUB.y} r={hubPulse} fill="none" stroke={`rgba(${pc},0.4)`} strokeWidth={1.5}>
        <animate attributeName="r" values={`${hubPulse};${hubPulse + 16};${hubPulse}`} dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx={HUB.x} cy={HUB.y} r={hubOuter} fill={`rgba(${pc},0.07)`} stroke={`rgba(${pc},0.28)`} strokeWidth={1} />
      <circle
        cx={HUB.x}
        cy={HUB.y}
        r={hubMid}
        fill={`rgba(${pc},0.16)`}
        stroke={`rgba(${pc},0.6)`}
        strokeWidth={2}
        filter="url(#ph-glow-lg)"
      />
      <circle cx={HUB.x} cy={HUB.y} r={hubInner} fill={`rgba(${pc},0.35)`} />
      <line x1={HUB.x - (mobile ? 34 : 42)} y1={HUB.y} x2={HUB.x - (mobile ? 16 : 20)} y2={HUB.y} stroke={`rgba(${pc},0.25)`} strokeWidth={1} />
      <line x1={HUB.x + (mobile ? 16 : 20)} y1={HUB.y} x2={HUB.x + (mobile ? 34 : 42)} y2={HUB.y} stroke={`rgba(${pc},0.25)`} strokeWidth={1} />
      <line x1={HUB.x} y1={HUB.y - (mobile ? 34 : 42)} x2={HUB.x} y2={HUB.y - (mobile ? 16 : 20)} stroke={`rgba(${pc},0.25)`} strokeWidth={1} />
      <line x1={HUB.x} y1={HUB.y + (mobile ? 16 : 20)} x2={HUB.x} y2={HUB.y + (mobile ? 34 : 42)} stroke={`rgba(${pc},0.25)`} strokeWidth={1} />

      <g transform={`translate(${HUB.x} ${HUB.y})`} filter="url(#ph-glow)">
        <g transform={`translate(-8 -13) scale(${mobile ? 0.6 : 0.7})`}>
          <path
            d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"
            fill={`rgba(${pc},0.25)`}
            stroke={`rgba(${pc},1)`}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1={16} y1={8} x2={2} y2={22} stroke={`rgba(${pc},1)`} strokeWidth={1.6} strokeLinecap="round" />
          <line x1={17.5} y1={15} x2={9} y2={15} stroke={`rgba(${pc},1)`} strokeWidth={1.6} strokeLinecap="round" />
        </g>
      </g>

      <text
        x={HUB.x}
        y={HUB.y + (mobile ? 14 : 17)}
        textAnchor="middle"
        fontFamily="'Plus Jakarta Sans',sans-serif"
        fontSize={mobile ? 8 : 9}
        fontWeight="800"
        letterSpacing="1.5"
        fill={`rgba(${pc},1)`}
        filter="url(#ph-glow)"
      >
        {baseTag}
      </text>

      <text
        x={w / 2}
        y={h - 22}
        textAnchor="middle"
        fontFamily="'JetBrains Mono',monospace"
        fontSize={mobile ? 8 : 7.5}
        letterSpacing="2"
        fill={`rgba(${pc},0.28)`}
      >
        {`NODES: ${
          1 +
          CORE_VERTS.length +
          Array.from(addons).reduce((s, id) => {
            const m = mods.find((x) => x.id === id);
            return s + (m ? m.nodes.length : 0);
          }, 0)
        }`}
      </text>

      <line x1={18} y1={h - 26} x2={44} y2={h - 26} stroke={`rgba(${pc},0.14)`} strokeWidth={1} />
      <text
        x={50}
        y={h - 22}
        textAnchor="start"
        fontFamily="'JetBrains Mono',monospace"
        fontSize={mobile ? 7.5 : 7}
        letterSpacing="2.5"
        fill={`rgba(${pc},0.2)`}
      >
        FEATH SYS
      </text>
    </svg>
  );
}

export function PricingPage() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const [base, setBase] = useState<BaseId>("static");
  const [addons, setAddons] = useState<Set<AddonId>>(new Set());

  const toggleAddon = (id: AddonId) => {
    setAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (id === "crm") next.delete("calltext");
      } else {
        const spec = ADDON_LIST.find((a) => a.id === id);
        if (spec?.requires && !prev.has(spec.requires as AddonId)) next.add(spec.requires as AddonId);
        next.add(id);
      }
      return next;
    });
  };

  const basePkg = BASE_PKGS.find((b) => b.id === base)!;
  const addonTotal = Array.from(addons).reduce((s, id) => s + (ADDON_LIST.find((a) => a.id === id)?.monthly ?? 0), 0);
  const totalMonthly = basePkg.monthly + addonTotal;

  return (
    <div className="md:min-h-screen bg-background pt-16 md:pt-20 pb-3 md:pb-16 overflow-hidden md:overflow-x-hidden h-[100dvh] md:h-auto flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-2 md:mb-8 text-center shrink-0">
        <Reveal y={12}>
          <span className="text-[10px] md:text-[11px] tracking-[0.22em] uppercase text-primary font-bold">
            Configure Your Stack
          </span>
          <h1
            className="text-xl md:text-5xl sm:text-4xl font-bold text-foreground mt-1 md:mt-2.5 mb-0 md:mb-3 leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
          >
            Build your solution
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto hidden md:block">
            Select a base and stack on modules. Watch your architecture assemble in real time.
          </p>
        </Reveal>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 flex-1 min-h-0 w-full flex flex-col">
        <div className="flex flex-col md:flex-row gap-2 md:gap-6 items-stretch md:items-start flex-1 min-h-0">
          {/* Ultra-compact controls on mobile — graphic gets the rest of the viewport */}
          <Reveal className="w-full md:w-auto order-2 md:order-1 shrink-0" y={10} delay={80}>
            <div
              className="w-full md:sticky md:top-24 md:w-52 rounded-xl border border-border bg-card/90 md:bg-card/80 backdrop-blur-sm p-2 md:p-5 space-y-1.5 md:space-y-6"
              style={{ boxShadow: "0 0 0 1px rgba(61,184,112,0.05), inset 0 0 20px rgba(61,184,112,0.02)" }}
            >
              <div>
                <div className="text-[8px] md:text-[9px] font-bold tracking-[0.22em] uppercase text-primary mb-1 md:mb-3 flex items-center gap-1.5">
                  <span className="inline-block w-2.5 md:w-3 h-px bg-primary/60" />
                  Base
                </div>
                <div className="grid grid-cols-3 md:grid-cols-1 gap-1">
                  {BASE_PKGS.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setBase(pkg.id)}
                      className={`w-full flex md:flex-row flex-col items-center gap-0 md:gap-2.5 px-1 md:px-3 py-1 md:py-2 rounded-md md:rounded-lg text-center md:text-left transition-all duration-200 ${
                        base === pkg.id
                          ? "bg-primary/12 border border-primary/35 shadow-[0_0_12px_rgba(61,184,112,0.1)]"
                          : "border border-border/50 md:border-transparent hover:bg-primary/5 hover:border-border bg-secondary/20 md:bg-transparent"
                      }`}
                    >
                      <div
                        className={`hidden md:block w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                          base === pkg.id ? "bg-primary" : "bg-muted-foreground/35"
                        }`}
                      />
                      <span
                        className={`text-[8px] md:text-xs font-semibold md:flex-1 leading-tight ${
                          base === pkg.id ? "text-foreground" : "text-muted-foreground"
                        }`}
                        style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                      >
                        <span className="md:hidden">{pkg.label.replace(" Website", "").replace(" Site", "")}</span>
                        <span className="hidden md:inline">{pkg.label}</span>
                      </span>
                      <span className="text-[8px] md:text-[10px] font-mono text-primary opacity-80">${pkg.monthly}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border" />

              <div>
                <div className="text-[8px] md:text-[9px] font-bold tracking-[0.22em] uppercase text-primary mb-1 md:mb-3 flex items-center gap-1.5">
                  <span className="inline-block w-2.5 md:w-3 h-px bg-primary/60" />
                  Modules
                </div>
                <div className="grid grid-cols-4 md:grid-cols-1 gap-1">
                  {ADDON_LIST.map((addon) => {
                    const active = addons.has(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddon(addon.id)}
                        className={`w-full flex md:flex-row flex-col items-center gap-0.5 md:gap-2.5 px-0.5 md:px-3 py-1 md:py-2.5 rounded-md md:rounded-lg text-center md:text-left transition-all duration-200 ${
                          active
                            ? "bg-primary/12 border border-primary/35 shadow-[0_0_12px_rgba(61,184,112,0.1)]"
                            : "border border-border/50 md:border-transparent hover:bg-primary/5 hover:border-border bg-secondary/20 md:bg-transparent"
                        }`}
                      >
                        <div
                          className={`w-5 h-3 md:w-7 md:h-4 rounded-full flex items-center px-0.5 transition-all duration-200 shrink-0 ${
                            active ? "bg-primary justify-end" : "bg-muted/60 justify-start"
                          }`}
                        >
                          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-white shadow-sm" />
                        </div>
                        <span
                          className={`text-[7px] md:text-xs font-semibold md:flex-1 min-w-0 truncate leading-tight ${
                            active ? "text-foreground" : "text-muted-foreground"
                          }`}
                          style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                        >
                          {addon.label}
                        </span>
                        <span className="text-[7px] md:text-[10px] font-mono text-primary opacity-80 shrink-0">
                          +${addon.monthly}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center gap-2 md:block md:space-y-3">
                <div className="flex-1 flex items-center justify-between gap-3 md:block md:space-y-1 min-w-0">
                  <div className="flex items-baseline gap-1 md:justify-between md:w-full">
                    <span className="text-[8px] md:text-[10px] text-muted-foreground font-mono">SETUP</span>
                    <span className="text-[11px] md:text-sm font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      ${basePkg.setup.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 md:justify-between md:w-full">
                    <span className="text-[8px] md:text-[10px] text-muted-foreground font-mono">/MO</span>
                    <span className="text-sm md:text-xl font-bold text-primary" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      ${totalMonthly}
                    </span>
                  </div>
                </div>
                <GlowButton
                  size="md"
                  className="shrink-0 !px-2.5 !py-1.5 text-[11px] md:w-full md:!px-6 md:!py-3 md:text-sm md:justify-center"
                  onClick={() => {
                    navigate("/contact/");
                    window.scrollTo({ top: 0 });
                  }}
                >
                  <span className="md:hidden">Book</span>
                  <span className="hidden md:inline">Book a Call</span>
                  <ArrowRight size={12} className="ml-0.5 md:ml-1.5" />
                </GlowButton>
              </div>
              <p className="hidden md:block text-[9px] text-muted-foreground leading-relaxed">
                No contracts. SSL & hosting included.
              </p>
            </div>
          </Reveal>

          <div className="flex-1 w-full order-1 md:order-2 min-h-0 min-w-0 relative flex flex-col">
            <Reveal className="flex-1 min-h-0 flex" y={12}>
              <div
                className="w-full flex-1 min-h-0 max-w-none mx-auto rounded-xl md:rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden"
                style={{ boxShadow: "0 0 60px rgba(61,184,112,0.06), inset 0 0 80px rgba(61,184,112,0.02)" }}
              >
                <PricingHUD base={base} addons={addons} dark={dark} toggleAddon={toggleAddon} />
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={200}>
          <div className="hidden md:flex flex-wrap items-center justify-center gap-6 mt-8 text-[10px] text-muted-foreground font-mono tracking-wide">
            <span className="flex items-center gap-2">
              <span className="inline-block w-6 h-px bg-primary/70" /> Active connection
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-primary/50 bg-primary/15 inline-block" /> Node cluster
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Data pulse
            </span>
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full bg-primary/20 border border-primary/40 inline-block"
                style={{ animation: "pulseGlow 2s ease-in-out infinite" }}
              />
              Active module
            </span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
